# Habitopia

A social habit-tracking RPG. Users join small groups called **Realms**, complete daily habits, and collectively maintain a shared **Village** health bar. Miss your habits, the village decays. Show up, it thrives.

---

## Concept

| Term | Meaning |
|---|---|
| Realm | A group of 2–5 users |
| Village | Shared health bar (0–100) tied to the Realm |
| Main Quests | Personal habits (GitHub commits, LeetCode solves, Strava runs, custom) |
| Friend Quests | Peer-assigned challenges within a Realm |
| Decay | Village health drops 100 points each night for incomplete habits |

**Village Health States:** `0–20` Broken · `21–40` Weak · `41–60` Stable · `61–80` Strong · `81–100` Thriving

---

## Tech Stack

| Layer | Tech |
|---|---|
| Mobile app | React Native (Expo) |
| State | Zustand |
| Realtime sync | Firebase Firestore (JS SDK) |
| Auth | Firebase Auth |
| Backend | FastAPI (Python) |
| Backend auth | Firebase Admin SDK (token verification) |
| Integrations | GitHub API, LeetCode GraphQL, Strava OAuth |

---

## Project Structure

```
Habitopia/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── api/
│   │   ├── realms.py            # Realm CRUD + nightly reset cron
│   │   ├── pulse.py             # Habits CRUD + integration sync
│   │   └── quests.py            # Friend quest assign/accept/complete
│   ├── core/
│   │   ├── config.py            # Settings (pydantic-settings, loads .env)
│   │   ├── firebase_setup.py    # Firebase Admin SDK init
│   │   └── security.py          # Firebase token verification dependency
│   └── services/
│       └── github_sync.py       # GitHub + LeetCode activity helpers
└── frontend/
    ├── App.js                   # Navigation root, auth listener
    └── src/
        ├── theme.js             # Design tokens (colors, fonts, spacing)
        ├── firebase.js          # Firebase JS SDK init
        ├── apiClient.js         # Axios client for backend calls
        ├── screens/
        │   ├── AuthScreen.js
        │   ├── RealmHubScreen.js
        │   ├── CreateRealmScreen.js
        │   ├── JoinRealmScreen.js
        │   ├── AccessRealmScreen.js
        │   ├── VillageScreen.js
        │   ├── PulseScreen.js       # Main Quests tab
        │   ├── QuestsScreen.js      # Friend Quests tab
        │   └── HabitWrappedScreen.js
        ├── store/
        │   ├── authStore.js     # Auth state + Firestore user listener
        │   ├── realmStore.js    # Realm + member real-time listeners
        │   ├── habitStore.js    # Habits real-time listener + toggle
        │   └── questStore.js    # Quests real-time listener + actions
        └── components/
            ├── RPGButton.js
            ├── RPGInput.js
            ├── ProgressBar.js
            └── ProfileModal.js
```

---

## Backend Setup

**Requirements:** Python 3.11+

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install fastapi uvicorn firebase-admin pydantic-settings requests
```

Create a `.env` file in `backend/`:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=serviceAccountKey.json
GITHUB_TOKEN=your_github_pat           # Optional — raises API rate limit
LEETCODE_SESSION_COOKIE=               # Optional
STRAVA_CLIENT_ID=                      # Required for Strava OAuth
STRAVA_CLIENT_SECRET=                  # Required for Strava OAuth
CRON_SECRET=your_secret_here           # Required — protects nightly reset endpoint
```

Download your Firebase service account JSON from the Firebase console and save it as `backend/serviceAccountKey.json`.

```bash
uvicorn main:app --reload
# API docs at http://localhost:8000/docs
```

---

## Frontend Setup

**Requirements:** Node 18+, Expo CLI

```bash
cd frontend
npm install
npx expo start
```

Configure your Firebase project credentials in `frontend/src/firebase.js`.

---

## API Overview

All endpoints except `/health` and `/pulse/validate-username` require a Firebase ID token:
```
Authorization: Bearer <firebase_id_token>
```

### Realms
| Method | Path | Description |
|---|---|---|
| POST | `/realms/create` | Create a new Realm |
| POST | `/realms/{realm_id}/join` | Join a Realm (transactional, enforces member cap) |
| GET | `/realms/{realm_id}` | Get Realm state (members only) |
| GET | `/realms/{realm_id}/stats` | Get member habit completions for today |
| POST | `/realms/nightly-reset?secret=<CRON_SECRET>` | Nightly cron: decay health, evaluate streaks, reset habits, clean logs |

### Habits (Pulse)
| Method | Path | Description |
|---|---|---|
| POST | `/pulse/habits` | Create a habit |
| PUT | `/pulse/habits/{habit_id}` | Update a habit |
| DELETE | `/pulse/habits/{habit_id}` | Delete a habit |
| GET | `/pulse/habits` | List user's habits |
| POST | `/pulse/habits/{habit_id}/log` | Log a habit completion (idempotent per day) |
| POST | `/pulse/sync` | Auto-complete habits from GitHub/LeetCode/Strava activity |
| GET | `/pulse/validate-username` | Check if a username exists on GitHub or LeetCode |

### Quests
| Method | Path | Description |
|---|---|---|
| POST | `/quests/assign` | Assign a Friend Quest to a Realm member |
| GET | `/quests/my-quests` | Get your pending quests |
| POST | `/quests/{quest_id}/accept` | Accept a quest |
| POST | `/quests/{quest_id}/decline` | Decline a quest |
| POST | `/quests/{quest_id}/complete` | Complete a quest (awards XP) |

---

## Firestore Collections

| Collection | Description |
|---|---|
| `users/{uid}` | User profile, XP, streak, realm_ids, linked usernames |
| `realms/{realm_id}` | Realm state, members array, health, habit_ids |
| `habits/{habit_id}` | Individual habit (user_id, realm_id, type, status, xp_value) |
| `quests/{quest_id}` | Friend Quest (assigned_to, assigned_by, status, xp_reward) |
| `habit_logs/{log_id}` | Completion log (user_id, realm_id, habit_type, timestamp) — purged after 7 days |

---

## Village Health Math

Each user is responsible for an equal share of Village health:

```
user_share      = 100 / number_of_members
hp_per_habit    = user_share / number_of_user_habits

Main Quest completion   → +hp_per_habit
Friend Quest completion → +hp_per_habit × 0.5
Nightly reset           → health -= 100 (floor 0, cap 100)
```

---

## Integrations

**GitHub** — checks for commits today via the GitHub Search Commits API. User saves their GitHub username in their profile.

**LeetCode** — checks for accepted submissions today via LeetCode's GraphQL API. User saves their LeetCode username in their profile.

**Strava** — requires OAuth. User connects their Strava account via the in-app flow (`POST /strava/connect`). Access tokens are stored on the user's Firestore document and refreshed automatically on each sync.

---

## Design System

Cyber OS aesthetic — dark mode only, sharp borders, dense layouts, terminal-style labels.

| Token | Value |
|---|---|
| Background | `#0D0D0D` |
| Primary (purple) | `#dcb8ff` |
| Secondary (green) | `#4ce346` |
| Error | `#ff4457` |
| Border radius | `0` (sharp) |
| Headline font | Space Grotesk |
| Body font | Plus Jakarta Sans |

All tokens live in `frontend/src/theme.js`.

---

## Nightly Reset (Cron)

The `/realms/nightly-reset` endpoint should be called by a cron job at midnight UTC:

```bash
curl -X POST "https://your-api.com/realms/nightly-reset?secret=YOUR_CRON_SECRET"
```

Operations (in order):
1. Subtract 100 from every Realm's health (floor 0)
2. Evaluate and update user streaks
3. Reset all habit statuses to 0
4. Delete `habit_logs` older than 7 days

---

## Engineering Rules

- Firebase is realtime sync only — backend is source of truth
- External integrations belong in `backend/services/`
- Prefer readability over abstraction
- Do not add frameworks unless necessary
