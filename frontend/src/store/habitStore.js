import { create } from 'zustand';
import fetchWithAuth from '../apiClient';

const useHabitStore = create((set, get) => ({
  habits: [],
  isLoading: false,

  fetchHabits: async () => {
    set({ isLoading: true });
    try {
      const data = await fetchWithAuth('/pulse/habits');
      // Format data to match UI
      const formatted = data.map(h => ({
        id: h.habit_id,
        title: h.title,
        xp: h.xp_value || 10,
        completed: false, // By default we assume not completed today for now
        streak: h.streak || 0,
        icon: h.icon || '⚡',
      }));
      set({ habits: formatted, isLoading: false });
    } catch (err) {
      console.error('Failed to fetch habits', err);
      set({ isLoading: false });
    }
  },

  addHabit: async (title, xp, icon) => {
    const newId = 'habit_' + Date.now();
    const xpVal = xp || 25;

    // Optimistic UI update
    set((state) => ({
      habits: [
        ...state.habits,
        { id: newId, title, xp: xpVal, completed: false, streak: 0, icon: icon || '⚡' }
      ]
    }));

    try {
      // The API uses query params for this POST
      await fetchWithAuth(`/pulse/habits?habit_id=${newId}&title=${encodeURIComponent(title)}&xp_value=${xpVal}`, {
        method: 'POST'
      });
    } catch (err) {
      console.error('Failed to add habit to API', err);
    }
  },

  toggleHabit: async (id) => {
    const state = get();
    const habit = state.habits.find(h => h.id === id);
    if (!habit) return;

    if (!habit.completed) {
      // Optimistic UI
      set((state) => ({
        habits: state.habits.map((h) => h.id === id ? { ...h, completed: true } : h),
      }));

      try {
        await fetchWithAuth(`/pulse/habits/${id}/log`, { method: 'POST' });
        // After this POST, the User's XP and habitsCompleted automatically increase in Firestore!
      } catch (err) {
        console.error('Failed to log habit completion', err);
        // Rollback UI
        set((state) => ({
          habits: state.habits.map((h) => h.id === id ? { ...h, completed: false } : h),
        }));
      }
    }
  },

  editHabit: (id, updates) =>
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    })),

  removeHabit: async (id) => {
    // Optimistic UI
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
    }));

    try {
      await fetchWithAuth(`/pulse/habits/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete habit', err);
    }
  },
}));

export default useHabitStore;
