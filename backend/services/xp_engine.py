from core.config import settings

# XP Reward Constants - Tunable for game balance
REWARDS = {
    "MANUAL_HABIT": 10,       # e.g., "Drink Water"
    "GITHUB_COMMIT": 5,       # Per commit
    "GITHUB_MAX_DAILY": 25,   # Cap to prevent commit spamming
    "LEETCODE_SOLVE": 20,      # Per unique problem
    "SIDE_QUEST_BONUS": 15    # Base multiplier for peer-assigned tasks
}

def calculate_daily_user_xp(manual_count: int, github_data: dict, leetcode_data: dict):
    """
    Calculates total XP contributed by a single user based on daily activities.
    """
    total_xp = 0

    # 1. Manual Habits
    total_xp += manual_count * REWARDS["MANUAL_HABIT"]

    # 2. GitHub Integration (with Daily Cap)
    if "commits_today" in github_data:
        github_xp = github_data["commits_today"] * REWARDS["GITHUB_COMMIT"]
        total_xp += min(github_xp, REWARDS["GITHUB_MAX_DAILY"])

    # 3. LeetCode Integration
    if "solves_today" in leetcode_data:
        total_xp += leetcode_data["solves_today"] * REWARDS["LEETCODE_SOLVE"]

    return total_xp

def calculate_village_progression(current_total_xp: int, daily_contribution: int):
    """
    Updates the Village's total XP pool. 
    This total is used to upgrade the Village or offset Decay[cite: 13, 18].
    """
    # Logic for leveling up could be added here
    new_total = current_total_xp + daily_contribution
    return new_total

def get_quest_reward_value(base_reward: int, difficulty_multiplier: float = 1.0):
    """
    Calculates rewards for Module 4: Quest System (Side Quests)[cite: 86].
    """
    return int(base_reward * difficulty_multiplier)