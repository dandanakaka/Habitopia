import { create } from 'zustand';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const INTEGRATED_TYPES = ['leetcode', 'strava', 'github'];

const useHabitStore = create((set, get) => ({
  habits: [],
  isLoading: false,

  // Fetch habits from Firestore using the realm's habit_ids, filtered by current user
  fetchHabits: async (realmId, userId) => {
    if (!realmId || !userId) return;
    set({ isLoading: true });

    try {
      // 1. Get the realm doc to find habit_ids
      const realmSnap = await getDoc(doc(db, 'realms', realmId));
      if (!realmSnap.exists()) {
        set({ habits: [], isLoading: false });
        return;
      }

      const habitIds = realmSnap.data().habit_ids || [];
      if (!Array.isArray(habitIds) || habitIds.length === 0) {
        set({ habits: [], isLoading: false });
        return;
      }

      // 2. Fetch each habit doc, keep only ones belonging to this user
      const habitDocs = await Promise.all(
        habitIds.map(async (id) => {
          try {
            const snap = await getDoc(doc(db, 'habits', id));
            if (snap.exists() && snap.data().user_id === userId) {
              return { id: snap.id, ...snap.data() };
            }
          } catch (e) {
            console.error('Error fetching habit', id, e);
          }
          return null;
        })
      );

      const userHabits = habitDocs.filter(Boolean).map(h => ({
        id: h.id,
        title: h.title || 'Untitled',
        type: h.type || 'custom',
        xp: h.xp_value || 10,
        streak: h.streak || 0,
        status: h.status || 0,
        completed: h.status === 1,
        isIntegrated: INTEGRATED_TYPES.includes(h.type),
      }));

      set({ habits: userHabits, isLoading: false });
    } catch (err) {
      console.error('Failed to fetch habits from Firestore', err);
      set({ isLoading: false });
    }
  },

  // Toggle a custom habit's completion (status: 0 <-> 1)
  toggleHabit: async (habitId) => {
    const habit = get().habits.find(h => h.id === habitId);
    if (!habit || habit.isIntegrated) return;

    const newStatus = habit.completed ? 0 : 1;
    const newCompleted = !habit.completed;

    // Optimistic UI update
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === habitId ? { ...h, completed: newCompleted, status: newStatus } : h
      ),
    }));

    try {
      await updateDoc(doc(db, 'habits', habitId), {
        status: newStatus,
        lastUpdated: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to update habit status', err);
      // Rollback
      set((state) => ({
        habits: state.habits.map((h) =>
          h.id === habitId ? { ...h, completed: habit.completed, status: habit.status } : h
        ),
      }));
    }
  },
}));

export default useHabitStore;
