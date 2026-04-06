import { create } from 'zustand';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp, increment, collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import useRealmStore from './realmStore';
import useAuthStore from './authStore';

const INTEGRATED_TYPES = ['leetcode', 'strava', 'github'];

const useHabitStore = create((set, get) => ({
  unsubscribeHabits: null,
  habits: [],
  isLoading: false,

  // Listen to habits for this realm + user in real-time
  subscribeHabits: async (realmId, userId) => {
    if (!realmId || !userId) return;

    // 1. Cleanup old listener
    if (get().unsubscribeHabits) get().unsubscribeHabits();

    set({ isLoading: true });

    try {
      // 2. Fetch the realm document first to know which habit_ids belong to this realm
      const realmSnap = await getDoc(doc(db, 'realms', realmId));
      if (!realmSnap.exists()) {
        set({ habits: [], isLoading: false });
        return;
      }
      
      const habitIds = realmSnap.data().habit_ids || [];
      if (habitIds.length === 0) {
        set({ habits: [], isLoading: false });
        return;
      }

      // 3. Set up a listener for ALL habits where user_id and realm_id match
      const habitsRef = collection(db, 'habits');
      const q = query(habitsRef, where('user_id', '==', userId), where('realm_id', '==', realmId));

      const unsub = onSnapshot(q, (snapshot) => {
        const userHabits = snapshot.docs.map(snap => {
          const h = snap.data();
          return {
            id: snap.id,
            title: h.title || 'Untitled',
            type: h.type || 'custom',
            xp: h.xp_value || 10,
            streak: h.streak || 0,
            status: h.status || 0,
            completed: h.status === 1,
            isIntegrated: INTEGRATED_TYPES.includes(h.type),
          };
        });
        
        set({ habits: userHabits, isLoading: false });
      }, (err) => {
        console.error('Habits listener error:', err);
        set({ isLoading: false });
      });

      set({ unsubscribeHabits: unsub });
    } catch (err) {
      console.error('Failed to setup habits listener:', err);
      set({ isLoading: false });
    }
  },

  cleanup: () => {
    if (get().unsubscribeHabits) get().unsubscribeHabits();
    set({ habits: [], unsubscribeHabits: null });
  },

  // Toggle a custom habit's completion (status: 0 <-> 1)
  toggleHabit: async (habitId) => {
    const habit = get().habits.find(h => h.id === habitId);
    if (!habit || habit.isIntegrated) return;

    const newStatus = habit.completed ? 0 : 1;
    
    try {
      await updateDoc(doc(db, 'habits', habitId), {
        status: newStatus,
        lastUpdated: serverTimestamp(),
      });

      // Compute and update Realm Health
      const realmState = useRealmStore.getState().realm;
      if (realmState?.id) {
        const membersCount = realmState.members?.length || 1;
        const totalUserHabits = get().habits.length || 1;
        if (totalUserHabits === 0) return;
        
        const hpGain = (100 / membersCount) / totalUserHabits;
        
        await updateDoc(doc(db, 'realms', realmState.id), {
          health: increment(newStatus === 1 ? hpGain : -hpGain)
        });

        // Write to habit_logs if completed
        if (newStatus === 1) {
          const authState = useAuthStore.getState().user;
          if (authState?.uid) {
            await addDoc(collection(db, 'habit_logs'), {
              user_id: authState.uid,
              realm_id: realmState.id,
              habit_type: habit.type,
              timestamp: serverTimestamp(),
              xp_reward: habit.xp || 10,
            });
          }
        }
      }

    } catch (err) {
      console.error('Failed to update habit status', err);
    }
  },
}));

export default useHabitStore;
