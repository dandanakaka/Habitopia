import { getAuth } from 'firebase/auth';
import { Platform } from 'react-native';

// Adjust for local dev. 
// - iOS Simulator: localhost
// - Android Emulator: 10.0.2.2
// - Physical Device: Replace with your machine's local IP (e.g. http://192.168.1.50:8000)
const API_IP = '10.123.190.93';
const API_BASE_URL = Platform.OS === 'android'
    ? `http://${API_IP}:8000`
    : `http://${API_IP}:8000`; // Using IP for both to ensure physical devices can connect too

async function fetchWithAuth(endpoint, options = {}) {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        throw new Error('No authenticated user found');
    }

    // Get the fresh Firebase ID Token
    const token = await user.getIdToken();

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'API request failed');
    }

    return response.json();
}

export default fetchWithAuth;
