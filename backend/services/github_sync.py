import requests
import json
from datetime import datetime, timezone

def get_daily_github_commits(username, token=None):
    """
    Fetches the number of commits made by a user today (UTC).
    """
    url = f"https://api.github.com/users/{username}/events/public"
    headers = {"Accept": "application/vnd.github.v3+json"}
    if token:
        headers["Authorization"] = f"token {token}"

    try:
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 403:
            return {"error": "Rate limit exceeded"}
        
        response.raise_for_status()
        events = response.json()

        today = datetime.now(timezone.utc).date()
        commit_count = 0

        for event in events:
            if event["type"] == "PushEvent":
                event_date = datetime.strptime(event["created_at"], "%Y-%m-%dT%H:%M:%SZ").date()
                if event_date == today:
                    commit_count += event.get("payload", {}).get("size", 0)
                elif event_date < today:
                    break

        return {"username": username, "commits_today": commit_count}

    except requests.exceptions.RequestException as e:
        return {"error": f"GitHub connection failed: {str(e)}"}

def get_daily_leetcode_solves(username):
    """
    Fetches the number of unique problems solved by a user today (UTC).
    Uses LeetCode's GraphQL API.
    """
    url = "https://leetcode.com/graphql"
    
    # Query for the last 20 submissions
    query = """
    query userRecentSubmissions($username: String!, $limit: int) {
        recentSubmissionList(username: $username, limit: $limit) {
            title
            statusDisplay
            timestamp
        }
    }
    """
    
    variables = {"username": username, "limit": 20}
    
    try:
        response = requests.post(
            url, 
            json={'query': query, 'variables': variables}, 
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        
        submissions = data.get("data", {}).get("recentSubmissionList", [])
        if not submissions:
            return {"username": username, "solves_today": 0}

        today = datetime.now(timezone.utc).date()
        solved_titles = set()

        for sub in submissions:
            # Check if status is "Accepted"
            if sub["statusDisplay"] == "Accepted":
                sub_date = datetime.fromtimestamp(int(sub["timestamp"]), tz=timezone.utc).date()
                
                if sub_date == today:
                    # Use a set to only count unique problems solved today
                    solved_titles.add(sub["title"])
                elif sub_date < today:
                    break

        return {
            "username": username, 
            "solves_today": len(solved_titles)
        }

    except requests.exceptions.RequestException as e:
        return {"error": f"LeetCode connection failed: {str(e)}"}