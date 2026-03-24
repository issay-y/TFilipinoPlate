import express from "express";
import axios from "axios";
import { Recipe } from "../models/recipe.models.js";

const router = express.Router();

// Base API endpoint for Panlasang Pinoy posts.
const PANLASANG_PINOY_API = "https://www.panlasangpinoy.com/wp-json/wp/v2/posts";

const SYNONYM_MAP = {
	giniling: ["ground pork", "minced pork"],
	"ground pork": ["giniling", "minced pork"],
	"minced pork": ["giniling", "ground pork"],
	caldereta: ["kaldereta"],
	kaldereta: ["caldereta"],
	calderata: ["caldereta", "kaldereta"],
	lumpia: ["spring roll", "spring rolls"],
	"spring roll": ["lumpia"],
	"spring rolls": ["lumpia"],
	"fried rice": ["sinangag"],
	sinangag: ["fried rice"]
};

function clampNumber(value, min, max, fallback) {
	const parsed = Number.parseInt(value, 10);
	if (Number.isNaN(parsed)) {
		return fallback;
	}
	return Math.max(min, Math.min(max, parsed));
}

function normalizeQuery(query) {
	const raw = String(query || "").toLowerCase();
	const withoutCountryWords = raw
		.replace(/\b(filipino|philippine|tagalog|pinoy)\b/g, " ")
		.replace(/[^a-z0-9\s-]/g, " ")
		.replace(/\s+/g, " ")
		.trim();

	return withoutCountryWords;
}

function buildQueryTerms(query) {
	return normalizeQuery(query)
		.split(/\s+/)
		.map((term) => term.trim())
		.filter((term) => term.length >= 2);
}

function escapeRegex(value) {
	return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildExpandedTerms(query) {
	const normalized = normalizeQuery(query);
	const baseTerms = buildQueryTerms(query);
	const expanded = new Set(baseTerms);

	if (normalized.length >= 2) {
		expanded.add(normalized);
	}

	for (const [key, relatedTerms] of Object.entries(SYNONYM_MAP)) {
		const hasPhrase = normalized.includes(key);
		const hasToken = baseTerms.includes(key);
		if (hasPhrase || hasToken) {
			expanded.add(key);
			for (const related of relatedTerms) {
				expanded.add(related);
			}
		}
	}

	return Array.from(expanded)
		.map((term) => term.trim())
		.filter((term) => term.length >= 2);
}

function levenshteinDistance(a, b) {
	const x = String(a || "");
	const y = String(b || "");
	const dp = Array.from({ length: x.length + 1 }, () => new Array(y.length + 1).fill(0));

	for (let i = 0; i <= x.length; i += 1) dp[i][0] = i;
	for (let j = 0; j <= y.length; j += 1) dp[0][j] = j;

	for (let i = 1; i <= x.length; i += 1) {
		for (let j = 1; j <= y.length; j += 1) {
			const cost = x[i - 1] === y[j - 1] ? 0 : 1;
			dp[i][j] = Math.min(
				dp[i - 1][j] + 1,
				dp[i][j - 1] + 1,
				dp[i - 1][j - 1] + cost
			);
		}
	}

	return dp[x.length][y.length];
}

function hasFuzzyTokenMatch(content, term) {
	const termNormalized = normalizeQuery(term);
	if (!termNormalized || termNormalized.length < 4 || termNormalized.includes(" ")) {
		return false;
	}

	const tokens = normalizeQuery(content).split(/\s+/).filter(Boolean);
	if (!tokens.length) {
		return false;
	}

	const allowedDistance = termNormalized.length <= 5 ? 1 : 2;
	for (const token of tokens) {
		if (Math.abs(token.length - termNormalized.length) > allowedDistance) {
			continue;
		}

		if (levenshteinDistance(token, termNormalized) <= allowedDistance) {
			return true;
		}
	}

	return false;
}

function mapInternalRecipe(item) {
	return {
		id: String(item._id),
		title: item.title,
		description: item.description || "Recipe shared by an admin",
		ingredients: item.ingredients || [],
		instructions: item.instructions || "",
		image: item.image || null,
		link: null,
		source: "admin"
	};
}

async function fetchInternalRecipes(query = "", expandedTerms = []) {
	const q = String(query || "").trim();
	const searchTerms = (expandedTerms.length ? expandedTerms : [q])
		.map((term) => normalizeQuery(term))
		.filter((term) => term.length > 0);

	const recipes = await Recipe.find({ is_published: true }).sort({ created_at: -1 }).lean();
	const mapped = recipes.map(mapInternalRecipe);

	if (!searchTerms.length) {
		return mapped;
	}

	return mapped.filter((recipe) => {
		const haystack = normalizeQuery([
			recipe.title,
			recipe.description,
			recipe.instructions,
			Array.isArray(recipe.ingredients) ? recipe.ingredients.join(" ") : ""
		].join(" "));

		return searchTerms.some((term) => haystack.includes(term));
	});
}

function scoreTextField(text, terms, highWeight, lowWeight) {
	const content = String(text || "").toLowerCase();
	if (!content) {
		return 0;
	}

	let score = 0;
	for (const term of terms) {
		if (content === term) {
			score += highWeight + 10;
		} else if (content.startsWith(term + " ") || content.includes(" " + term + " ")) {
			score += highWeight;
		} else if (content.includes(term)) {
			score += lowWeight;
		} else if (hasFuzzyTokenMatch(content, term)) {
			score += Math.max(2, lowWeight - 3);
		}
	}

	return score;
}

function scoreRecipe(recipe, terms) {
	if (!terms.length) {
		return 0;
	}

	const titleScore = scoreTextField(recipe.title, terms, 40, 25);
	const descriptionScore = scoreTextField(recipe.description, terms, 18, 10);
	const ingredientsText = Array.isArray(recipe.ingredients) ? recipe.ingredients.join(" ") : "";
	const ingredientsScore = scoreTextField(ingredientsText, terms, 12, 7);
	const instructionsScore = scoreTextField(recipe.instructions, terms, 8, 4);

	// Favor internal/admin recipes when scores tie because they are usually curated for this app.
	const sourceBonus = recipe.source === "admin" ? 1 : 0;

	return titleScore + descriptionScore + ingredientsScore + instructionsScore + sourceBonus;
}

function rankRecipesByQuery(recipes, query) {
	const terms = buildQueryTerms(query);
	if (!terms.length) {
		return recipes;
	}

	return [...recipes]
		.map((recipe, index) => ({ recipe, index, score: scoreRecipe(recipe, terms) }))
		.sort((a, b) => {
			if (b.score !== a.score) {
				return b.score - a.score;
			}
			// Keep stable ordering for same-score items.
			return a.index - b.index;
		})
		.map((item) => item.recipe);
}

async function fetchFromPanlasangPinoy(searchTerm, page = 1, perPage = 20) {
	try {
		const response = await axios.get(PANLASANG_PINOY_API, {
			params: {
				search: searchTerm,
				per_page: perPage,
				page,
				_fields: "id,title,excerpt,link,featured_media,content"
			},
			timeout: 10000
		});

		return response.data || [];
	} catch (error) {
		console.warn(`Error fetching from Panlasang Pinoy: ${error.message}`);
		return [];
	}
}

async function fetchFromPanlasangPinoyWithExpansions(query, candidateSize) {
	const expandedTerms = buildExpandedTerms(query).filter((term) => term.length >= 3);
	const queries = [];

	const primary = normalizeQuery(query) || String(query || "").trim();
	if (primary) {
		queries.push(primary);
	}

	for (const term of expandedTerms) {
		if (queries.length >= 4) {
			break;
		}
		if (!queries.includes(term)) {
			queries.push(term);
		}
	}

	if (!queries.length) {
		queries.push("");
	}

	const perQuery = Math.max(10, Math.ceil(candidateSize / queries.length));
	const fetchedLists = await Promise.all(
		queries.map((item) => fetchFromPanlasangPinoy(item, 1, perQuery))
	);

	const unique = new Map();
	for (const list of fetchedLists) {
		for (const recipe of list) {
			if (recipe?.id && !unique.has(recipe.id)) {
				unique.set(recipe.id, recipe);
			}
		}
	}

	return Array.from(unique.values());
}

async function fetchFeaturedImage(mediaId) {
	if (!mediaId) return null;
	try {
		const response = await axios.get(`https://www.panlasangpinoy.com/wp-json/wp/v2/media/${mediaId}`, {
			timeout: 5000,
			validateStatus: () => true // Return the response even when media is missing (404).
		});
		if (response.status === 200 && response.data?.source_url) {
			return response.data.source_url;
		}
		return null;
	} catch (error) {
		return null;
	}
}

function extractIngredientsAndInstructions(htmlContent) {
	if (!htmlContent) return { ingredients: [], instructions: "" };
	
	try {
		const html = htmlContent;
		
		// Convert common HTML entities into readable text.
		const decodeHtml = (text) => {
			const map = {
				'&amp;': '&',
				'&lt;': '<',
				'&gt;': '>',
				'&quot;': '"',
				'&#39;': "'",
				'&nbsp;': ' ',
				'&#x25a2;': '',
				'&#32;': ' '
			};
			let result = text;
			Object.entries(map).forEach(([entity, char]) => {
				result = result.replace(new RegExp(entity, 'g'), char);
			});
			// Remove numeric entities like &#160; and &#x25a2;.
			result = result.replace(/&#x[0-9a-f]+;/gi, '');
			result = result.replace(/&#\d+;/g, ' ');
			return result.replace(/\s+/g, ' ').trim();
		};
		
		// Find the ingredients section and read the list items.
		const ingredientsRegex = /<h[2-3][^>]*>Ingredients?<\/h[2-3]>([\s\S]*?)(?=<h[2-3]|$)/i;
		let ingredients = [];
		const ingredientsMatch = html.match(ingredientsRegex);
		
		if (ingredientsMatch) {
			// Pull out each ingredient from list items.
			const listItems = ingredientsMatch[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
			ingredients = listItems
				.map(item => {
					// Remove tags and decode entities.
					return decodeHtml(item.replace(/<[^>]*>/g, " "));
				})
				.filter(item => item.length > 2 && item.length < 200)
				.slice(0, 50); // Keep the first 50 items at most.
		}
		
		// Find the cooking steps section.
		const instructionsRegex = /<h[2-3][^>]*>(?:Directions?|How to Cook|Instructions?|Procedures?|Steps?)<\/h[2-3]>([\s\S]*?)(?=<h[2-3]|$)/i;
		let instructions = "";
		const instructionsMatch = html.match(instructionsRegex);
		
		if (instructionsMatch) {
			// Pull out each step from list items.
			const listItems = instructionsMatch[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
			const steps = listItems
				.map(item => {
					// Remove tags and decode entities.
					return decodeHtml(item.replace(/<[^>]*>/g, " "));
				})
				.filter(item => item.length > 2)
				.slice(0, 20); // Keep the first 20 steps at most.
			
			instructions = steps.join("\n");
		}
		
		return { ingredients, instructions };
	} catch (error) {
		return { ingredients: [], instructions: "" };
	}
}


function mapPanlasangPinoyRecipe(item, imageUrl = null, recipeData = {}) {
	const excerpt = item?.excerpt?.rendered || item?.excerpt || "";
	const cleanExcerpt = excerpt
		.replace(/<[^>]*>/g, "")
		.replace(/&[a-z]+;/g, "")
		.replace(/\s+/g, " ")
		.trim();

	const shortDescription = cleanExcerpt.length > 150
		? `${cleanExcerpt.substring(0, 147).trim()}...`
		: cleanExcerpt;
	
	return {
		id: item?.id || null,
		title: (item?.title?.rendered || item?.title || "").replace(/<[^>]*>/g, ""),
		description: shortDescription || "Filipino recipe from Panlasang Pinoy",
		ingredients: recipeData?.ingredients || [],
		instructions: recipeData?.instructions || "",
		image: imageUrl,
		link: item?.link || null
	};
}

export async function initRecipes() {
	console.log("Panlasang Pinoy recipe integration is ready.");
}

router.get("/", async (req, res) => {
	const q = String(req.query.q || "").trim();
	const num = clampNumber(req.query.num, 1, 100, 10);
	const page = clampNumber(req.query.page, 1, 100, 1);
	const normalizedQuery = normalizeQuery(q);
	const expandedTerms = buildExpandedTerms(normalizedQuery || q);

	try {
		let recipes;
		let totalResults;
		let displayQuery;
		let externalRecipes = [];
		const internalRecipes = await fetchInternalRecipes(normalizedQuery || q, expandedTerms);

		// Fetch more than one page worth so ranking has enough candidates.
		const candidateSize = Math.min(Math.max(num * 3, 30), 100);
		const results = await fetchFromPanlasangPinoyWithExpansions(normalizedQuery || q, candidateSize);
		externalRecipes = await Promise.all(
			results.map(async (recipe) => {
				const imageUrl = await fetchFeaturedImage(recipe.featured_media);
				const recipeData = extractIngredientsAndInstructions(recipe.content?.rendered || recipe.content || "");
				return mapPanlasangPinoyRecipe(recipe, imageUrl, recipeData);
			})
		);

		const mergedRecipes = rankRecipesByQuery([...internalRecipes, ...externalRecipes], expandedTerms.join(" ") || normalizedQuery || q);
		totalResults = mergedRecipes.length;
		displayQuery = q || "all";
		recipes = mergedRecipes.slice((page - 1) * num, page * num);

		return res.json({
			query: displayQuery,
			count: recipes.length,
			page,
			pageSize: num,
			totalResults,
			recipes
		});
	} catch (error) {
		const status = error.response?.status || 500;
		const details = error.response?.data || error.message;
		return res.status(status).json({
			message: "Failed to fetch recipes from Panlasang Pinoy.",
			details
		});
	}
});



export default router; 