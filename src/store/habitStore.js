import { create } from 'zustand';

const useHabitStore = create((set) => ({
  habits: [
    { id: 'h1', title: 'Morning Run', xp: 50, completed: false, streak: 3, icon: '🏃' },
    { id: 'h2', title: 'Read 30 mins', xp: 30, completed: true, streak: 7, icon: '📖' },
    { id: 'h3', title: 'Drink 2L Water', xp: 20, completed: false, streak: 12, icon: '💧' },
    { id: 'h4', title: 'Meditate', xp: 40, completed: false, streak: 5, icon: '🧘' },
    { id: 'h5', title: '100 Pushups', xp: 60, completed: false, streak: 1, icon: '💪' },
  ],

  addHabit: (title, xp, icon) =>
    set((state) => ({
      habits: [
        ...state.habits,
        {
          id: 'h' + Date.now(),
          title,
          xp: xp || 25,
          completed: false,
          streak: 0,
          icon: icon || '⚡',
        },
      ],
    })),

  toggleHabit: (id) =>
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, completed: !h.completed } : h
      ),
    })),

  editHabit: (id, updates) =>
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, ...updates } : h
      ),
    })),

  removeHabit: (id) =>
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
    })),
}));

export default useHabitStore;
