def calculate_new_village_health(current_health, total_expected_quests, missed_quests):
    """
    Calculates village health based on missed daily tasks.
    
    Constraints:
    - Decay is proportional to (missed_quests / total_expected_quests).
    - Max health is 100, min health is 0.
    - Decay Cap: Health cannot drop by more than 20 points in a single day.
    """
    if total_expected_quests <= 0:
        return current_health

    # Calculate raw penalty (assuming 100 points is 'full' health scale)
    # Failure ratio * 100 gives the percentage of health lost
    raw_decay = (missed_quests / total_expected_quests) * 100
    
    # Apply Decay Cap: Max 20 points lost per day
    actual_decay = min(raw_decay, 20)
    
    # Calculate new health and clamp between 0 and 100
    new_health = int(current_health - actual_decay)
    
    return max(0, min(100, new_health))

# Example Logic:
# 10 quests expected, 5 missed. Raw decay = 50. 
# Capped at 20. 100 -> 80.