import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (username, password, displayName) => {
    // Mock login — no backend
    const mockUser = {
      id: 'u1',
      username: username,
      displayName: displayName || username,
      realm_id: 'r1',
    };
    const mockToken = 'mock-jwt-token-' + Date.now();

    set({
      user: mockUser,
      token: mockToken,
      isAuthenticated: true,
    });
  },

  logout: () => {
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },
}));

export default useAuthStore;
