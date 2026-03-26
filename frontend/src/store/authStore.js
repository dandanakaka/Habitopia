import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (userData) => {
    set({
      user: {
        uid: userData.uid, // Always keep the Firebase UID
        email: userData.email,
        displayName: userData.displayName || userData.email,
        realm_id: userData.realm_id || null, // Can be updated later when they join a realm
      },
      token: 'jwt-placeholder', // In a real app, use user.getIdToken()
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
