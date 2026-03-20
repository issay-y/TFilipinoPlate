const API_BASE_URL = "http://localhost:3000/api";

async function fetchRecipes(query = "") {
    const params = new URLSearchParams();
    if (query.trim()) {
        params.set("q", query.trim());
    }
    params.set("num", "20");
    params.set("page", "1");

    const response = await fetch(`${API_BASE_URL}/recipes?${params.toString()}`);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch recipes");
    }

    return data;
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function renderRecipes(recipes) {
    const container = document.getElementById("recipe-list");

    if (!recipes.length) {
        container.innerHTML = "<p>No recipes found.</p>";
        return;
    }

    container.innerHTML = recipes.map((recipe) => {
        const sourceLabel = recipe.source === "admin" ? "Admin Recipe" : "Panlasang Pinoy";
        const imageTag = recipe.image
            ? `<img src="${escapeHtml(recipe.image)}" alt="${escapeHtml(recipe.title)}" class="recipe-image">`
            : "";

        return `
            <article class="card recipe-card">
                ${imageTag}
                <h3>${escapeHtml(recipe.title)}</h3>
                <p class="source-pill">${escapeHtml(sourceLabel)}</p>
                <p>${escapeHtml(recipe.description || "No description")}</p>
            </article>
        `;
    }).join("");
}

async function runSearch(query = "") {
    const meta = document.getElementById("recipe-search-meta");
    meta.textContent = "Loading recipes...";

    try {
        const result = await fetchRecipes(query);
        renderRecipes(result.recipes || []);
        meta.textContent = `${result.count || 0} recipes shown for '${result.query || "all"}'.`;
    } catch (err) {
        meta.textContent = err.message;
        document.getElementById("recipe-list").innerHTML = "";
    }
}

document.getElementById("recipe-search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const query = document.getElementById("recipe-query").value;
    runSearch(query);
});

runSearch("");
