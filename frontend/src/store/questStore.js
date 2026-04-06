import { create } from 'zustand';
import { db } from '../firebase';
import {
  collection, addDoc, doc, getDoc,
  updateDoc, query, where, serverTimestamp,
  onSnapshot, increment
} from 'firebase/firestore';
import useRealmStore from './realmStore';

const useQuestStore = create((set, get) => ({
  quests: [],
  isLoading: false,
  unsubscribeQuests: null,

  // Fetch quests for this realm that involve the current user
  fetchQuests: async (realmId, userId) => {
    if (!realmId || !userId) return;

    // Cleanup previous listener if one exists
    const currentUnsubscribe = get().unsubscribeQuests;
    if (currentUnsubscribe) currentUnsubscribe();

    set({ isLoading: true });

    try {
      const q = query(
        collection(db, 'quests'),
        where('realm_id', '==', realmId)
      );

      // Listen to real-time changes
      const unsub = onSnapshot(q, (snapshot) => {
        const allQuests = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(quest => quest.assigned_to === userId || quest.assigned_by === userId);

        set({ quests: allQuests, isLoading: false });
      }, (err) => {
        console.error('Failed to listen to quests:', err);
        set({ isLoading: false });
      });

      set({ unsubscribeQuests: unsub });
    } catch (err) {
      console.error('Failed to setup quests listener', err);
      set({ isLoading: false });
    }
  },

  // Assign a habit to another user
  assignQuest: async (realmId, habitTitle, habitType, assignedTo, assignedBy) => {
    try {
      // additional strict check to avoid double submission
      const exists = get().quests.find(q => q.assigned_to === assignedTo && q.habit_title === habitTitle && q.status !== 'declined');
      if (exists) {
        console.warn('Quest already assigned');
        return;
      }

      const questData = {
        realm_id: realmId,
        habit_title: habitTitle,
        habit_type: habitType, // "github" | "leetcode" | "strava" | "custom"
        assigned_to: assignedTo,
        assigned_by: assignedBy,
        xp_reward: 5,
        status: 'pending',
        created_at: serverTimestamp(),
        completed_at: null,
      };

      await addDoc(collection(db, 'quests'), questData);
      // Removed optimistic UI update since onSnapshot instantly provides the new data locally
    } catch (err) {
      console.error('Failed to assign quest', err);
    }
  },

  acceptQuest: async (questId) => {
    try {
      await updateDoc(doc(db, 'quests', questId), { status: 'accepted' });
    } catch (err) {
      console.error('Failed to accept quest', err);
    }
  },

  declineQuest: async (questId) => {
    try {
      await updateDoc(doc(db, 'quests', questId), { status: 'declined' });
    } catch (err) {
      console.error('Failed to decline quest', err);
    }
  },

  completeQuest: async (questId) => {
    const quest = get().quests.find(q => q.id === questId);
    if (!quest) return;

    // Toggle between completed and accepted
    const newStatus = quest.status === 'completed' ? 'accepted' : 'completed';

    try {
      // 1. Update the quest status
      await updateDoc(doc(db, 'quests', questId), {
        status: newStatus,
        completed_at: newStatus === 'completed' ? serverTimestamp() : null,
      });

      // 2. Increment or decrement user XP depending on toggle
      if (quest.assigned_to) {
        const xpAmount = quest.xp_reward || 5;
        const xpDelta = newStatus === 'completed' ? xpAmount : -xpAmount;
        const completionsDelta = newStatus === 'completed' ? 1 : -1;

        await updateDoc(doc(db, 'users', quest.assigned_to), {
          xp: increment(xpDelta),
          habitsCompleted: increment(completionsDelta),
        });

        // Compute and update Realm Health
        const realmState = useRealmStore.getState().realm;
        if (realmState?.id === quest.realm_id) {
          const membersCount = realmState.members?.length || 1;
          const userHabits = await get().fetchUserHabits(quest.realm_id, quest.assigned_to);
          const totalUserHabits = userHabits.length || 1;
          const personalHpGain = (100 / membersCount) / totalUserHabits;
          const questHpGain = personalHpGain * 0.5; // 50% of regular personal habit
          
          await updateDoc(doc(db, 'realms', quest.realm_id), {
            health: increment(newStatus === 'completed' ? questHpGain : -questHpGain)
          });

          // Write to habit_logs if completed
          if (newStatus === 'completed') {
            await addDoc(collection(db, 'habit_logs'), {
              user_id: quest.assigned_to,
              realm_id: quest.realm_id,
              habit_type: 'quest_completion',
              timestamp: serverTimestamp(),
              xp_reward: xpAmount,
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to complete/uncomplete quest', err);
    }
  },

  // Get habits for a specific user (to filter assignable habits)
  fetchUserHabits: async (realmId, targetUserId) => {
    if (!realmId || !targetUserId) return [];
    try {
      const realmSnap = await getDoc(doc(db, 'realms', realmId));
      if (!realmSnap.exists()) return [];
      const habitIds = realmSnap.data().habit_ids || [];
      if (!Array.isArray(habitIds) || habitIds.length === 0) return [];

      const habits = await Promise.all(
        habitIds.map(async (id) => {
          try {
            const snap = await getDoc(doc(db, 'habits', id));
            if (snap.exists() && snap.data().user_id === targetUserId) {
              return { id: snap.id, ...snap.data() };
            }
          } catch (e) { /* skip */ }
          return null;
        })
      );
      return habits.filter(Boolean);
    } catch (err) {
      console.error('Failed to fetch user habits', err);
      return [];
    }
  },

  // Added ability to opt-out and clean up listeners
  cleanup: () => {
    const s = get();
    if (s.unsubscribeQuests) s.unsubscribeQuests();
    set({ quests: [], unsubscribeQuests: null });
  }
}));

export default useQuestStore;
