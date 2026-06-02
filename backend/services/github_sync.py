import requests
import json
from datetime import datetime, timezone

def get_daily_github_commits(username, token=None):
    """
    Fetches the number of commits authored by a user today (UTC) via the
    GitHub Search Commits API. Authenticated requests get a higher rate limit.
    """
    today = datetime.now(timezone.utc).date().isoformat()
    url = "https://api.github.com/search/commits"
    params = {"q": f"author:{username} committer-date:{today}"}
    # cloak-preview is required for the commits search endpoint
    headers = {"Accept": "application/vnd.github.cloak-preview"}
    if token:
        headers["Authorization"] = f"token {token}"

    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)

        if response.status_code == 403:
            return {"error": "rate_limit"}

        if response.status_code != 200:
            try:
                message = response.json().get("message", response.text)
            except ValueError:
                message = response.text
            return {"error": message or f"http_{response.status_code}"}

        data = response.json()
        return {"username": username, "commits_today": data.get("total_count", 0)}

    except requests.exceptions.RequestException as e:
        return {"error": str(e)}

def get_daily_leetcode_solves(username):
    """
    Fetches the number of unique problems solved by a user today (UTC).
    Uses LeetCode's GraphQL API.
    """
    url = "https://leetcode.com/graphql"
    
    # Query for the last 20 submissions
    query = """
    query userRecentSubmissions($username: String!, $limit: Int) {
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