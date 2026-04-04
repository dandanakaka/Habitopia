import { create } from 'zustand';
import { db } from '../firebase';
import {
  collection, addDoc, doc, getDoc, getDocs,
  updateDoc, query, where, serverTimestamp,
} from 'firebase/firestore';

const useQuestStore = create((set, get) => ({
  quests: [],
  isLoading: false,

  // Fetch quests for this realm that involve the current user
  fetchQuests: async (realmId, userId) => {
    if (!realmId || !userId) return;
    set({ isLoading: true });

    try {
      // Get all quests for this realm
      const q = query(
        collection(db, 'quests'),
        where('realm_id', '==', realmId)
      );
      const snapshot = await getDocs(q);
      const allQuests = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(quest => quest.assigned_to === userId || quest.assigned_by === userId);

      set({ quests: allQuests, isLoading: false });
    } catch (err) {
      console.error('Failed to fetch quests', err);
      set({ isLoading: false });
    }
  },

  // Assign a habit to another user
  assignQuest: async (realmId, habitTitle, habitType, assignedTo, assignedBy) => {
    try {
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

      const docRef = await addDoc(collection(db, 'quests'), questData);

      // Optimistic add to local state
      set((state) => ({
        quests: [...state.quests, { id: docRef.id, ...questData, created_at: new Date() }],
      }));
    } catch (err) {
      console.error('Failed to assign quest', err);
    }
  },

  acceptQuest: async (questId) => {
    // Optimistic
    set((state) => ({
      quests: state.quests.map(q => q.id === questId ? { ...q, status: 'accepted' } : q),
    }));
    try {
      await updateDoc(doc(db, 'quests', questId), { status: 'accepted' });
    } catch (err) {
      console.error('Failed to accept quest', err);
      set((state) => ({
        quests: state.quests.map(q => q.id === questId ? { ...q, status: 'pending' } : q),
      }));
    }
  },

  declineQuest: async (questId) => {
    set((state) => ({
      quests: state.quests.map(q => q.id === questId ? { ...q, status: 'declined' } : q),
    }));
    try {
      await updateDoc(doc(db, 'quests', questId), { status: 'declined' });
    } catch (err) {
      console.error('Failed to decline quest', err);
    }
  },

  completeQuest: async (questId) => {
    const quest = get().quests.find(q => q.id === questId);
    if (!quest) return;

    const newStatus = quest.status === 'completed' ? 'accepted' : 'completed';

    set((state) => ({
      quests: state.quests.map(q =>
        q.id === questId ? { ...q, status: newStatus, completed_at: newStatus === 'completed' ? new Date() : null } : q
      ),
    }));
    try {
      await updateDoc(doc(db, 'quests', questId), {
        status: newStatus,
        completed_at: newStatus === 'completed' ? serverTimestamp() : null,
      });
    } catch (err) {
      console.error('Failed to complete quest', err);
      set((state) => ({
        quests: state.quests.map(q => q.id === questId ? { ...q, status: quest.status } : q),
      }));
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
}));

export default useQuestStore;
