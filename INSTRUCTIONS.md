# Family Meal Plan App — Setup & Weekly Usage Guide

---

## PART 1: DEPLOYING TO NETLIFY (one-time setup, ~15 minutes)

### What you'll need
- A free Netlify account (netlify.com)
- A free GitHub account (github.com)
- The mealplan-app folder from this zip file

---

### Step 1 — Create a GitHub account (skip if you have one)
1. Go to github.com and click "Sign up"
2. Choose a username, enter your email, create a password
3. Verify your email address

---

### Step 2 — Create a new GitHub repository
1. Log into github.com
2. Click the green "New" button (top left) or go to github.com/new
3. Name it: `family-meal-plan`
4. Set it to **Private**
5. Leave everything else unchecked
6. Click "Create repository"

---

### Step 3 — Upload your project files to GitHub
1. On your new repository page, click "uploading an existing file" (link in the middle of the page)
2. Open the `mealplan-app` folder on your computer
3. Select ALL files and folders inside it and drag them into the GitHub upload area
   - You should see: `package.json`, `vite.config.js`, `netlify.toml`, `public/`, `src/`
4. Scroll down, add a commit message like "Initial upload"
5. Click "Commit changes"

---

### Step 4 — Create a Netlify account and connect GitHub
1. Go to netlify.com and click "Sign up"
2. Choose "Sign up with GitHub" — this connects them automatically
3. Authorize Netlify to access your GitHub account

---

### Step 5 — Deploy your app on Netlify
1. In Netlify, click "Add new site" → "Import an existing project"
2. Click "GitHub"
3. Find and select your `family-meal-plan` repository
4. Netlify will auto-detect the settings from `netlify.toml`. You should see:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click "Deploy site"
6. Wait 1–2 minutes while it builds
7. Netlify gives you a URL like `https://cheerful-unicorn-abc123.netlify.app`

---

### Step 6 — (Optional) Set a custom name for your URL
1. In Netlify, go to Site Settings → General → Site details
2. Click "Change site name"
3. Enter something like `family-mealplan` → your URL becomes `https://family-mealplan.netlify.app`

---

### Step 7 — Add to your phone's home screen
**iPhone:**
1. Open your Netlify URL in Safari
2. Tap the Share button (box with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Name it "Meal Plan" → tap Add

**Android:**
1. Open your Netlify URL in Chrome
2. Tap the three-dot menu
3. Tap "Add to Home Screen"

Your app now opens like a native app from your home screen and saves all data between sessions!

---

## PART 2: UPDATING THE MEAL PLAN EACH WEEK

### The weekly workflow (takes about 5 minutes)

**Step 1 — Fill in the Next Week tab**
Open your app and go to the 📋 Next Week tab. Fill in:
- Week start date
- Any ingredients to use up
- Scheduling notes (busy nights, etc.)
- Daughter's breakfast/lunch requests
- Prep day
- Anything else

The app automatically pulls in your leftover tracker selections, quick-add items, favorites, and cook time history.

**Step 2 — Generate and copy your prompt**
Tap "Generate My Prompt" then "Copy Prompt."

**Step 3 — Open Claude and paste your profile**
1. Go to claude.ai and start a new conversation
2. Open your Google Doc profile
3. Select all (Ctrl+A / Cmd+A) and copy it
4. Paste it into Claude

**Step 4 — Paste your prompt and send**
Immediately after your profile, paste the prompt you copied from the app. Hit send.

**Step 5 — Review and request swaps if needed**
Read through the meal plan Claude generates. If anything doesn't appeal to you this week, just say so in the same conversation:
- "Swap Tuesday's salmon for something with shrimp"
- "Replace the turkey skillet with something faster"
- "I'm not feeling tacos this week, give me something Mexican but different"

Claude will replace the meal and update the grocery list on the spot. Keep adjusting until you're happy.

**Step 6 — Update the app**
Once you have a plan you like, update your app with the new week's meals and grocery list. See Part 3 for how to do this.

---

## PART 3: UPDATING THE APP WITH NEW MEALS EACH WEEK

The meal and grocery data lives in the `src/App.jsx` file. Here's exactly where to find and update each section.

### Updating the meal plan

Open `src/App.jsx` and find the `const MEALS = [` section (around line 60).

Each meal looks like this:
```
{ id:"sun", day:"Sunday, Apr 27", badge:"⚡ Reluctant Cook · 5 min", name:"Ground Beef Tacos",
  estMin:5, time:"5 min (meat pre-browned Sat)",
  left:"~0.5 lbs taco meat → Tuesday lunch rice bowls",
  spice:"Adults add hot sauce/jalapeños. Teen builds mild bar.",
  ing:["ingredient 1","ingredient 2",...],
  steps:["Step 1.","Step 2.",...] },
```

To update for a new week:
1. Change `day` to the new date (e.g., `"Sunday, May 4"`)
2. Change `name` to the new meal name
3. Change `estMin` to the estimated minutes
4. Update `badge` to reflect difficulty/time
5. Replace `ing` and `steps` with the new recipe
6. Update `left` to note what leftovers go where
7. Update `spice` if needed

**To update the PREP card**, find `const PREP = {` just above the MEALS array and update the day, name, and steps.

### Updating the grocery list

Find `const GROCERY = {` (around line 120). Each item looks like:
```
{i:"Item name", q:"Quantity", s:"Size note · Used in: X meal", c:true/false},
```
- `i` = item name
- `q` = quantity to buy
- `s` = size assumption and which meal it's for
- `c` = true if Costco, false if Cub/other

Replace the items in each section with your new week's grocery list.

### Updating the lunch coverage

Find `const LUNCH_DATA = [` and update the day-by-day entries for the new week.

### Updating the header date

Find this line near the bottom of the file:
```
<div style={{...}}>Week of April 25, 2026</div>
```
Change the date to the new week.

---

### Deploying your changes to Netlify

After editing `App.jsx`:
1. Go to your GitHub repository (github.com/yourusername/family-meal-plan)
2. Click on `src/App.jsx`
3. Click the pencil (edit) icon
4. Make your changes directly in the browser editor
5. Scroll down, add a commit message like "Week of May 4 update"
6. Click "Commit changes"
7. Netlify automatically detects the change and rebuilds in 1–2 minutes
8. Your app is live with the new meal plan!

---

## PART 4: DO YOU STILL NEED THE GOOGLE DOC PROFILE?

**Yes — keep it.** The Google Doc profile is the "brain" that tells Claude who your family is, what you can eat, your preferences, and your constraints. The app is where you track and use the plan; Claude is where you generate it.

Here's how they work together:

| Tool | Purpose |
|------|---------|
| **Google Doc profile** | Stores your family's permanent preferences, dietary rules, favorites, staples list |
| **App → Next Week tab** | Generates the weekly-specific prompt (dates, schedule, leftovers, etc.) |
| **Claude conversation** | Combines both to generate your new meal plan and grocery list |
| **App** | Where you live with the plan all week — cook, shop, track |

**When to update your Google Doc profile:**
- Low-FODMAP phase ends → remove that restriction
- New favorite meal → add it to the favorites section
- Preference change → update the relevant section
- Daughter's preferences change → update her section
- You move past the 6-8 week low-FODMAP window → big update time!

**The profile doesn't change week to week** — that's what the Next Week prompt tab is for. The profile only changes when something permanent about your family changes.

---

## PART 5: QUICK REFERENCE — WEEKLY CHECKLIST

- [ ] Ask daughter what she wants for breakfast/lunch this week
- [ ] Check leftover tracker and mark what's in the fridge
- [ ] Add any one-off items in Quick Add
- [ ] Fill in Next Week tab (date, schedule, daughter's requests, prep day)
- [ ] Generate prompt → copy it
- [ ] Open Claude → paste Google Doc profile → paste prompt → send
- [ ] Review meal plan, request any swaps
- [ ] Update App.jsx with new meals and grocery list
- [ ] Commit to GitHub → Netlify auto-deploys
- [ ] Go shopping! Tap items in grocery list as you add to cart
- [ ] Cook! Use Cook Mode with timer
- [ ] Rate meals and add notes
- [ ] Star favorites to carry forward

---

*Questions? Open a new Claude conversation, paste your profile, and ask away!*
