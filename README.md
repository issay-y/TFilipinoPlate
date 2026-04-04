# The Filipino Plate

**Filipino Ulam Planning System**

---

## Project Overview

The Filipino Plate is a responsive web-based application that helps Filipino households simplify daily meal planning by discovering, organizing, and preparing authentic Filipino dishes without repetition. The platform combines external recipe sources (Panlasang Pinoy API) with admin-curated internal recipes, enabling users to search intelligently, save favorites, track cooking diversity, and leverage AI-powered ingredient-based recipe suggestions.

**Live Demo:** [https://tfp-yu16.onrender.com](https://tfp-yu16.onrender.com)

---

## Problem Statement & Solution

### The Problem
Filipino households struggle with:
- **Meal monotony**: Cooking the same dishes repeatedly due to limited meal planning awareness
- **Recipe discovery**: Difficulty accessing diverse authentic Filipino recipes conveniently
- **Dietary concerns**: No easy way to filter recipes based on allergies or dietary restrictions
- **Planning inefficiency**: Manual tracking of what was cooked and when

### The Solution
The Filipino Plate addresses these by:
- Aggregating 500+ Filipino recipes from Panlasang Pinoy and curated internal sources
- Providing intelligent search with filters (cooking method, time, allergens)
- Offering AI-powered ingredient-based recipe suggestions
- Tracking cooking history and promoting cooking method diversity
- Enabling personalized recipe bookmarking and allergy filtering

---

## Key Features

### **User Authentication & Profile Management**
- Secure registration and JWT-based login with rate limiting (5 attempts/15 min)
- Password requirements: 6+ chars, 1 uppercase, 1 lowercase, 1 number
- User profile with avatar, allergen preferences, and email notifications
- Password change notifications via email
- Role-based access control (Admin vs. User)

### **Recipe Discovery & Search**
- **500+ Recipes**: Integration with Panlasang Pinoy API + internal admin-curated database
- **Multi-filter Search**: By cooking method, max cooking time, allergens
- **Recipe Detail Modal**: Full instructions, ingredients, time, difficulty, and cooking method
- **Smart Allergen Filtering**: Auto-apply saved allergen preferences across searches

### **Personalization Features**
- **Bookmarks**: Save and manage favorite recipes for quick access
- **Cooking History**: Log daily cooked dishes with duplicate-same-day protection
- **Cooking Method Diversity**: Track which cooking methods used this week/month
- **Diversity Dashboard**: Visual stats on cooking method usage (frying, boiling, baking, etc.)

### **AI Recipe Assistant**
- **Ingredient-Based Suggestions**: Generate new recipe ideas based on available ingredients
- **Context-Aware**: Considers user's allergens and recent cooking history
- **Time Preferences**: Filter suggestions by available cooking time
- **Powered by Google Gemini 3.5 Flash**

### **Admin Dashboard**
- **Recipe Management**: Add, edit, delete internal recipes
- **User Management**: View, disable, or manage user accounts
- **Audit Logging**: Track all system actions (logins, recipe modifications, admin actions)
- Role-based protection with admin middleware validation

---

## Technical Architecture

### **Tech Stack**
| Layer | Technology |
|-------|------------|
| **Frontend** | Vanilla JavaScript, HTML5, CSS3 (Responsive Design) |
| **Backend** | Node.js (ES Modules), Express.js 5.2.1 |
| **Database** | MongoDB (Atlas Cloud) with Mongoose 9.2.2 ODM |
| **Authentication** | JWT (jsonwebtoken 9.0.3), 1-hour token expiry |
| **AI Integration** | Google Generative AI (Gemini 3.5 Flash) |
| **Email Service** | Nodemailer 8.0.4 (SMTP) |
| **Hosting** | Render (Free Tier Web Service) |
| **External APIs** | Panlasang Pinoy Recipe Database |

### **Database Schema**
```
Users
├── name, email, password (hashed), avatar
├── allergens (array)
├── role (user/admin)
└── createdAt, updatedAt

Recipes
├── title, description, ingredients
├── instructions, cookingMethod, cookingTime
├── difficulty, servings
├── source (internal/panlasangpinoy)
└── createdAt

Bookmarks
├── userId → User
├── recipeId → Recipe
└── createdAt

CookingHistory
├── userId → User
├── recipeId → Recipe
├── cookingMethod
├── cookedAt (date)
└── notes

AuditLogs
├── userId, action (LOGIN, RECIPE_VIEW, BOOKMARK_ADD)
├── details (JSON)
└── timestamp
```

### **API Architecture**
```
Base URL: https://tfp-yu16.onrender.com/api

Authentication Routes (/auth)
├── POST /register         - Register new user
├── POST /login            - Login and receive JWT
└── POST /logout           - Invalidate session

User Routes (/user)
├── GET /profile           - Get user profile
├── PUT /profile           - Update profile (name, email, avatar, allergens)
├── POST /password-change  - Change password (sends email notification)
└── GET /stats             - Get cooking history stats

Recipe Routes (/recipe)
├── GET /all               - Fetch all recipes (paginated, filtering support)
├── GET /:id               - Get single recipe details
├── POST /create [ADMIN]   - Create new recipe
├── PUT /:id [ADMIN]       - Update recipe
└── DELETE /:id [ADMIN]    - Delete recipe

Bookmark Routes (/bookmark)
├── GET /list              - Get user's bookmarked recipes
├── POST /add              - Bookmark a recipe
└── DELETE /:id            - Remove bookmark

Cooking History Routes (/history)
├── POST /log              - Log a cooked dish
├── GET /list              - Get cooking history
├── GET /diversity-stats   - Get cooking method breakdown

AI Routes (/ai)
└── POST /suggest          - Generate recipe suggestions (requires JWT)

Admin Routes (/admin)
├── GET /users [ADMIN]     - List all users
├── GET /logs [ADMIN]      - View audit logs
└── DELETE /user/:id [ADMIN] - Delete user
```

### **Security Measures**
- JWT token-based authentication with 1-hour expiry
- Password hashing with bcrypt
- Rate limiting on login attempts (5 fail/15 min)
- CORS policy with allowlists for localhost, devtunnels.ms, and production origins
- Role-based middleware for admin route protection
- Environment variables for sensitive data (JWT_SECRET, GEMINI_API_KEY, MONGODB_URI)
- Server-side input validation and HTML escaping

---

## Frontend Features

### **Pages & Workflows**

| Page | Purpose | Features |
|------|---------|----------|
| **Guest Home** | Landing page for unauthenticated users | Hero section, signup/login buttons, app overview |
| **Login/Register** | Authentication | Email validation, password strength checking, error feedback |
| **Recipe Main Page** | Core recipe discovery | Search, multi-filter (method/time/allergen), pagination, recipe modal |
| **User Home** | Authenticated dashboard | Recent recipes, quick stats, personalized welcome |
| **Bookmarks** | Saved recipes | List bookmarks, remove from list, quick view |
| **AI Kitchen Assistant** | AI-powered suggestions | Ingredient input, time preference, allergen auto-apply, suggestion display |
| **User Profile** | Account management | Edit name/email/avatar, manage allergens, change password, logout |
| **Admin Dashboard** | Admin controls | Recipe CRUD, user management, audit log viewing, system stats |

### **Responsive Design**
- Mobile-first breakpoints (320px, 768px, 1024px)
- Flexible layout with CSS Grid and Flexbox
- Touch-friendly form inputs and buttons
- Readable font sizes and spacing
- Optimized for desktop primary use with mobile-safe fallbacks

---

## Deployment & Operations

### **Hosted Architecture**
```
User Browser (https://tfp-yu16.onrender.com)
        ↓
   Render Web Service (Node.js)
        ↓
   Express Server (Port 10000)
        ↓
   [MongoDB Atlas Cloud] [Gemini API]
```

### **Environment Variables**
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/tfp
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecureAdminPassword123
ADMIN_NAME=Admin User
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
CORS_ORIGINS=http://localhost:3000,https://tfp-yu16.onrender.com
```

### **Deployment Process**
1. **Local Development**: `npm install && npm start` (connects to local MongoDB)
2. **Production**: Push to GitHub → Render auto-deploys from `main` branch
3. **Database**: MongoDB Atlas provides cloud storage with automatic backups
4. **Monitoring**: Render logs available in dashboard; MongoDB Atlas metrics viewable

---

## Data Integration

### **External Data Source: Panlasang Pinoy API**
- **Provider**: Panlasang Pinoy Recipe Database
- **Integration Method**: API/scraping to fetch recipe metadata and instructions
- **Data Mapped**: Recipe title, ingredients, cooking time, difficulty, cooking method
- **Frequency**: Recipes fetched and cached on user request or admin sync
- **Dependency**: Any format changes in external source may require code updates

### **Internal Recipe Database**
- Admin-curated Filipino recipes managed via dashboard
- Full control over content, accuracy, and completeness
- Serves as fallback if external source is unavailable
- Enables custom/proprietary recipes unique to the app

---

## Testing & Quality Assurance

### **Tested Scenarios**
- User registration with password validation
- Login with rate limiting and JWT token issuance
- Recipe search with multi-filter (method, time, allergen)
- Bookmark add/remove operations
- Cooking history logging (same-day duplicate protection)
- Profile updates and password change notifications
- AI recipe generation with ingredient input
- Admin recipe CRUD operations
- Audit log tracking
- Responsive layout on desktop and mobile browsers
- CORS handling across localhost, devtunnels, and production

### **Known Limitations**
- **External Source Dependency**: Changes in Panlasang Pinoy format may break recipe extraction
- **AI Reliability**: Gemini suggestions vary in quality and culinary accuracy; user judgment required
- **Internet Dependency**: Full functionality requires active internet connectivity
- **No Nutritional Data**: App does not validate or provide medical/nutritional accuracy
- **Free-Tier Hosting**: Render may sleep after 15 min inactivity; cold starts may delay first request
- **Mobile Optimization**: Partial (desktop-first design; some mobile layouts need refinement)

---

## Installation & Setup

### **Prerequisites**
- Node.js 20+ and npm
- MongoDB (local or Atlas account)
- Google Generative AI API key (free tier available)
- Git

### **Local Development**
```bash
# Clone and install
git clone https://github.com/Sir-Hasn/TFP.git
cd TFP
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB URI, JWT_SECRET, GEMINI_API_KEY, etc.

# Start server
npm start
# Server runs on http://localhost:3000

# (Optional) Seed admin account
node scripts/seedAdmin.js
```

### **Seed Admin Account**
```javascript
// Admin credentials for testing (change in production)
Email: admin@tfp.com
Password: AdminPassword123
```

---

## Usage Guide

### **As a Guest User**
1. Navigate to `https://tfp-yu16.onrender.com`
2. Browse featured recipes or click "Sign Up" to create an account

### **As a Registered User**
1. **Register**: Provide email and secure password
2. **Login**: Enter credentials; receive JWT token
3. **Discover Recipes**: Search by name, filter by cooking method/time/allergens
4. **Bookmark**: Click heart icon on recipes to save
5. **Log Cooking**: Track what you cooked today in "Cooking History"
6. **View Stats**: See your cooking method diversity and recent habits
7. **AI Suggestions**: Go to "AI Kitchen Assistant" → Enter ingredients → Get personalized suggestions
8. **Update Profile**: Manage allergens, avatar, and contact info

### **As an Admin**
1. Login with admin credentials
2. Access `/admin` dashboard
3. **Manage Recipes**: Add new recipes, update details, delete old ones
4. **View Users**: See registered users and their activity
5. **Audit Logs**: Review system actions (logins, deletions, modifications)

---

## Future Enhancements

- **Mobile App**: Native iOS/Android for better UX
- **Social Sharing**: Share recipes and cooking achievements
- **Meal Planning Calendar**: Plan weekly meals in advance
- **Nutrition API Integration**: Link to nutrition databases for calorie/macro info
- **User Reviews & Ratings**: Community feedback on recipes
- **Shopping List Export**: Generate grocery lists from selected recipes
- **Video Tutorials**: Embed cooking video tutorials for selected recipes
- **Multi-language Support**: Tagalog, English, Ilocano options

---

## License

**Copyright © 2026 Sir Hasn - The Filipino Plate**

Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

**See LICENSE file for full terms.**

---

## Author & Contact

**Developer**: Sir Hasn
**Repository**: [https://github.com/Sir-Hasn/TFP](https://github.com/Sir-Hasn/TFP)  
**Live Site**: [https://tfp-yu16.onrender.com](https://tfp-yu16.onrender.com)  

---

## Acknowledgments

- **Panlasang Pinoy**: External recipe source for diverse Filipino cuisine
- **Google Generative AI**: AI recipe suggestion engine
- **MongoDB Atlas**: Cloud database hosting
- **Render**: Free hosting platform for deployment
- **Filipino Culinary Community**: Inspiration and cultural preservation

---

**Last Updated**: April 2026  
**Status**: Live and operational
