# FITTRACK PRO – Personal Fitness & Physique Transformation Tracker

FITTRACK PRO is a commercial-grade, full-stack client-side fitness tracking and physique transformation web application designed to guide athletes through a structured **6-Month Transformation Program** to build a lean, aesthetic, muscular physique.

Built entirely with standard web technologies (HTML5, CSS3, ES6+ JavaScript, Chart.js, LocalStorage and IndexedDB), FITTRACK PRO runs locally without requiring paid subscriptions, external cloud backends, or third-party server logins.

---

## 🌟 Key Features

### 1. Interactive 4-Step Onboarding System
- **Personal Details**: Age, Gender, Height, Current & Target Weight, Activity Level.
- **Physique & 6-Month Goals**: Skinny fat / slim / athletic classification, aesthetic goal, target waist circumference.
- **Lifestyle & Kerala Diet**: Commercial gym / home workout preferences, split frequency, sleep hours, hydration goals, dietary preferences (non-vegetarian, vegetarian, vegan, etc.).
- **Automated Calorie Architecture**: Uses the validated **Mifflin-St Jeor formula** to calculate BMR, TDEE, optimal calorie deficits/surpluses, and macronutrient targets (2.0–2.3g/kg protein, healthy hormonal fats, and performance carbohydrates).

### 2. Apple Fitness Style Dashboard & Primary Daily Habit Architecture
- **Primary Showcase: Daily Habit Protocol Hub (Discipline First)**: Positioned directly at the top of the dashboard as the primary daily driver for physical & mental transformation:
  - 🧊 **Cold Bath / Cold Shower**: 2–3 min cold exposure for dopamine baseline increase, norepinephrine release, inflammation reduction & mental grit.
  - 🥩 **Eat Target Protein (2g+/kg)**: Fuel Muscle Protein Synthesis (MPS) and preserve lean mass.
  - 🥦 **Fresh Vegetables & Greens**: High micronutrient density, prebiotic fiber & optimal gut microbiome health.
  - 💧 **3.5L–4L Pure Hydration**: Cellular hydration, electrolyte balance and muscle fullness.
  - ☀️ **10–15 Min Morning Sunlight**: Circadian rhythm regulation, cortisol spike & natural Vitamin D synthesis.
  - 💊 **Creatine Monohydrate (5g) & Supplements**: ATP saturation for muscular power and cognitive focus.
  - 🏋️ **Complete Daily Workout**: Heavy progressive resistance training or scheduled active recovery.
  - 👟 **8,000–10,000 Daily Steps**: Non-Exercise Activity Thermogenesis (NEAT) for conditioning and fat oxidation.
  - 🧘 **Mobility & Post-Workout Stretch**: 10 mins flexibility, injury prevention and joint health.
  - 🌙 **7–8 Hours Deep Anabolic Sleep**: Growth hormone and testosterone pulse during deep slow-wave sleep.
  - 🚫 **Zero Processed Junk / No Sugar**: Stable blood glucose, insulin sensitivity and zero brain fog.
  - 📝 **Fitness Journal & Mindset Review**: Reflection on daily effort, gym performance and gratitude.
  - **Custom Habit Builder**: Add and track your own personalized discipline habits with one click.
  - **Live Adherence Progress**: Real-time progress bar, dynamic status badges (*"100% DISCIPLINE CHAMPION 🔥"*, *"ON FIRE ⚡"*), category filters (*Morning, Nutrition, Training*), and Web Audio sound effects.
- **Transformation Roadmap Widget**: Displays starting weight, current weight, target weight, net weight change, program day counter, current milestone, and overall transformation percentage.
- **Circular Progress Rings**: Glowing SVG progress rings for Calories, Protein, Carbohydrates, Fats, Water, and Workout Sets.
- **Daily Motivation & Streak Counter**: Motivational quotes from legendary bodybuilders (Arnold Schwarzenegger, Frank Zane, Ronnie Coleman) and an automated consistency streak counter.

### 3. Nutrition & Kerala Food Database
- **Comprehensive Food Database**: 60+ items with deep focus on Kerala & Indian nutrition staples:
  - *Matta rice, White rice, Chapati, Dosa, Idli, Puttu, Appam, Idiyappam, Ragi porridge/puttu, Rolled oats, Whole eggs, Egg whites, Boneless chicken breast, Kerala fish curry (Ayala/Mackerel with Kudampuli), Karimeen shallow fry, Sardines (Mathi), Whole cow milk, Curd/Dahi, Paneer, Toor dal/Sambar, Cherupayar (Green gram), Brown chickpeas (Kadala curry), Almonds, Peanuts, Cashews, Bananas, Apples, Avial, Thoran, Whey Protein, etc.*
- **Proportional Nutrient Calculations**: All items standardized per 100g/ml; dynamically calculates calories, protein, carbs, fat, fiber, sugar, saturated fat, sodium, calcium, iron, magnesium, potassium, zinc, and vitamins A, B-Complex, C, D, E, K.
- **Editable Database**: Add custom foods with personalized macros and serving units.
- **Interactive Macro Donut Chart**: Visualizes daily caloric breakdown (Protein vs Carbs vs Fats).

### 4. Gym Workout Planner & Progressive Overload Architecture
- **Workout Splits**: Push / Pull / Legs (PPL), Upper / Lower, Full Body, and Custom Splits.
- **Comprehensive Exercise Catalog**: Bench press, incline dumbbell press, cable fly, lat pulldown, pull-ups, barbell row, seated cable row, shoulder press, lateral raises, rear delt fly, barbell curls, hammer curls, triceps pushdown, squats, leg press, leg curls, calf raises, planks, and hanging leg raises.
- **Progressive Overload Tracking**: Automatically pulls previous session performance for each exercise and detects Personal Records (**🔥 +PR**).
- **Interactive Floating Rest Timer**: Built-in countdown timer (60s, 90s, 120s) with Web Audio chime alerts.
- **Personal Records (PRs) Hall of Fame**: Tracks estimated 1-Rep Max (1RM) using the Epley formula.

### 5. Body Measurements & Progress Photo Studio (IndexedDB)
- **Comprehensive Body Measurements**: Weight, Waist, Chest, Shoulders, Left/Right Arms, Forearms, Thighs, Calves, and Neck.
- **Progress Photo Studio**: Stores high-resolution physique photos locally inside the browser's **IndexedDB**.
- **Side-by-Side Comparison**: Compare any two milestones (e.g. Month 0 Baseline vs Month 2 Check-in) side-by-side with net weight and waist metrics.

### 6. Six-Month Structured Transformation Roadmap
- **Month 1 – Foundation**: Establish consistent diet, learn proper technique, build consistency.
- **Month 2 – Consistency & Overload**: Increase weights on primary compound lifts, meal prep routines.
- **Month 3 – Progress Calibration**: Evaluate waist reduction and muscle gain, mid-way review.
- **Month 4 – Hypertrophy & Volume**: Target lagging muscle groups, maximize volume.
- **Month 5 – Refinement & Conditioning**: Sharpen abdominal definition, aesthetic conditioning.
- **Month 6 – Transformation Finale**: Final measurement comparison, before/after review, comprehensive transformation report.
- **12 Gamified Badges**: Unlock badges for consistency streaks, hydration milestones, PR crushing, and foundation completion.

### 7. Analytics & 8 Interactive Chart.js Visualizations
1. Weight Progression Line Chart (with target weight line).
2. Daily Calorie Consumption Bar/Line Chart (with baseline target).
3. Protein Intake Chart (with 2g/kg goal threshold).
4. Carbohydrate vs Fat Intake Comparison Chart.
5. Weekly Workout Consistency & Frequency Chart.
6. Body Measurements Progression Chart (Waist vs Chest vs Arms).
7. Daily Water Consumption Chart.
8. Compound Lifts Strength Progression Chart.
- **Time Range Filters**: 7 Days, 30 Days, 3 Months, 6 Months, Custom Date Range.

### 8. Backup, Export & PDF Reports
- **Complete JSON Backup & Restore**: Backup all LocalStorage data and IndexedDB photos into a single JSON file.
- **Export to CSV**: Download separate CSV spreadsheets for Nutrition Logs, Workout Sessions, and Body Measurements.
- **Printable Transformation PDF Report**: Generates a formatted report for print or PDF export.
- **One-Click Demo Data**: Instantly load a realistic 6-month sample transformation dataset to explore all features, charts, photos, and calendar records.

---

## 🚀 How to Run the Application Locally

No build tools, node_modules, or external servers are required.

### Method 1: Direct Browser Opening
1. Navigate to the project directory:
   `C:\Users\HP\.gemini\antigravity\scratch\fittrack-pro\`
2. Double-click `index.html` to open it directly in any modern web browser (Google Chrome, Microsoft Edge, Brave, Firefox, or Safari).

### Method 2: Local HTTP Server (Recommended for IndexedDB and Web Audio)
Using Python or Node.js:

**Using Python 3:**
```bash
cd "C:\Users\HP\.gemini\antigravity\scratch\fittrack-pro"
python -m http.server 8080
```
Then visit: `http://localhost:8080` in your web browser.

**Using npx (Node.js):**
```bash
cd "C:\Users\HP\.gemini\antigravity\scratch\fittrack-pro"
npx serve .
```

---

## 📁 File Structure

```
fittrack-pro/
│
├── index.html               # Main HTML5 application shell & view sections
├── style.css                # Premium Dark Charcoal & Neon Green stylesheet
├── responsive.css           # Responsive mobile bottom navigation & layout rules
│
├── js/
│   ├── app.js               # Master controller, view router, calendar & settings
│   ├── onboarding.js        # Multi-step onboarding wizard & profile architect
│   ├── dashboard.js         # Circular progress rings, habits, transformation banner
│   ├── nutrition.js         # Daily food logger, macro calculations, micronutrients
│   ├── food-database.js     # Kerala & Indian food database (standardized per 100g)
│   ├── calorie-calculator.js# Mifflin-St Jeor BMR, TDEE, & macro calculator
│   ├── workout.js           # Workout planner, progressive overload, rest timer & PRs
│   ├── physique.js          # Body measurements & IndexedDB progress photo studio
│   ├── analytics.js         # Chart.js analytics engine (8 interactive charts)
│   ├── milestones.js        # 6-Month transformation roadmap & 12 gamified badges
│   ├── reminders.js         # Meal schedule alerts & browser notification manager
│   ├── storage.js           # LocalStorage, IndexedDB manager & sample data loader
│   └── utils.js             # Date helpers, Web Audio synth chime, CSV/JSON exporters
│
├── assets/
│   └── icons/               # Application icons
│
└── README.md                # Comprehensive documentation
```

---

## 🔒 Privacy & Data Sovereignty
FITTRACK PRO operates completely on the client side. Your body measurements, weight records, food logs, and progress photos are stored solely within your browser's private **LocalStorage** and **IndexedDB** storage. No personal data is sent to external cloud servers.
