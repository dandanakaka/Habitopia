🏰 Habitopia
Where habits become shared systems.

Habitopia is a social, gamified habit tracking platform that transforms personal discipline into a collaborative experience.
Instead of tracking habits alone, users operate within small groups (“realms”), where every action contributes to a shared village state.

🚀 Core Idea
Traditional habit apps rely on self-motivation.

Habitopia introduces:

Social accountability

Shared consequences

Real-time feedback

👉 Your habits don’t just affect you — they affect your entire team.

🎮 Features
🏰 Village System
Shared group environment (3–5 users)

Village health reflects collective consistency

Visual state evolves based on performance

👑 Main Quests (Core Habits)
Automated tracking via:

GitHub

LeetCode

Strava

Custom habit creation

Drives core contribution score

⚔️ Friend Quests (Social Layer)
Interactive group challenges

Real-time contribution updates

Direct impact on village health

⚠️ Decay System
Missed main quests → village health drops

Creates urgency and accountability

📊 Real-Time Feedback
XP system

Contribution %

Streak tracking

Live updates across users

📅 Monthly “Habit Wrapped”
Realm-level performance summary

Highlights:

Top contributors

Consistency trends

Failure points

🧱 Tech Stack
📱 Frontend
React Native (Expo)

⚙️ Backend
FastAPI (Python)

🗄️ Database
MongoDB Atlas

🔄 Real-Time Layer
Firebase Realtime DB / Firestore

🔌 Integrations
GitHub API

LeetCode (unofficial API)

Strava API

⚙️ System Architecture
User Action
   ↓
Frontend (React Native)
   ↓
FastAPI Backend (Business Logic)
   ↓
MongoDB (Source of Truth)
   ↓
Firebase (Real-time Sync)
   ↓
Frontend UI Update
🔄 Core Loop
Main Quests → XP →
Friend Quests → Contribution →
Contribution → Village Health →
Village Health → Feedback →
Feedback → User Behavior
🧠 Why Habitopia?
❌ No accountability → solved with group pressure

❌ Boring tracking → solved with gamification

❌ High drop-off → solved with shared consequences

👉 Built using behavioral psychology + system design

📦 Getting Started
1. Clone the repo
git clone https://github.com/your-repo/habitopia.git
cd habitopia
2. Frontend setup
cd habitopia-app
npm install
npx expo start
3. Backend setup
cd habitopia-backend
pip install -r requirements.txt
uvicorn main:app --reload
🧪 MVP Scope
Auth (Google login)

Realm creation & joining

Quest tracking (manual + API)

Village health system

Real-time updates

🛠️ Future Improvements
AI-driven habit recommendations

Advanced analytics dashboard

Push notifications & reminders

Cross-realm competitions

👥 Team
Frontend: Stitch + Antigravity MCP

Backend: FastAPI + MongoDB

Integrations: GitHub / LeetCode / Strava

🏁 Final Note
Habitopia isn’t just a productivity tool.

It’s a system where behavior is visible, shared, and consequential.

“When your habits affect others — you show up.” 🔥
