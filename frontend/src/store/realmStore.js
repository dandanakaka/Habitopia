import { create } from 'zustand';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const useRealmStore = create((set, get) => ({
  realm: null,
  memberProfiles: [],
  inviteCode: null,
  isLoading: false,
  error: null,

  unsubscribeRealm: null,
  unsubscribeMembers: [],

  // Set up real-time listeners for the realm and its members
  fetchRealm: async (realmId) => {
    if (!realmId) return;

    // Cleanup previous listeners
    const currentUnsubscribe = get().unsubscribeRealm;
    if (currentUnsubscribe) currentUnsubscribe();
    get().unsubscribeMembers.forEach(u => u());

    set({ isLoading: true, error: null, memberProfiles: [] });

    // 1. Listen to Realm document
    const realmRef = doc(db, 'realms', realmId);
    const unsubRealm = onSnapshot(realmRef, (snapshot) => {
      if (!snapshot.exists()) {
        set({ error: 'Realm not found', isLoading: false });
        return;
      }

      const realmData = {
        id: snapshot.id,
        health: 100, // Default to 100
        ...snapshot.data()
      };
      set({ realm: realmData, isLoading: false });

      // 2. Setup/Update member listeners if necessary
      const currentMemberIds = get().memberProfiles.map(m => m.id).sort().join(',');
      const newMemberIds = (realmData.members || []).sort().join(',');

      if (currentMemberIds !== newMemberIds) {
        // Members list changed, rebuild listeners
        get().setupMemberListeners(realmData.members || []);
      }
    }, (err) => {
      set({ error: err.message, isLoading: false });
    });

    set({ unsubscribeRealm: unsubRealm });
  },

  setupMemberListeners: (memberIds) => {
    // Kill old ones
    get().unsubscribeMembers.forEach(u => u());
    const newUnsubs = [];

    memberIds.forEach(uid => {
      const uRef = doc(db, 'users', uid);
      const uUnsub = onSnapshot(uRef, (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          const p = {
            id: snap.id,
            username: d.displayName || d.email?.split('@')[0] || 'Unknown',
            xp: d.xp ?? d.XP ?? 0,
            habitsCompleted: d.habitsCompleted ?? d.completions ?? 0,
            streak: d.streak ?? 0,
          };

          set(state => ({
            memberProfiles: state.memberProfiles.some(existing => existing.id === p.id)
              ? state.memberProfiles.map(existing => existing.id === p.id ? p : existing)
              : [...state.memberProfiles, p]
          }));
        }
      });
      newUnsubs.push(uUnsub);
    });

    set({ unsubscribeMembers: newUnsubs });
  },

  // Returns exactly the Realm's Firestore ID
  generateInviteCode: () => {
    const currentState = get();
    if (currentState.realm?.id) {
      set({ inviteCode: currentState.realm.id });
      return currentState.realm.id;
    }
    return null;
  },

  cleanup: () => {
    const s = get();
    if (s.unsubscribeRealm) s.unsubscribeRealm();
    s.unsubscribeMembers.forEach(u => u());
    set({ realm: null, memberProfiles: [], unsubscribeRealm: null, unsubscribeMembers: [] });
  },

  leaveRealm: async (uid, realmId) => {
    if (!uid || !realmId) return;
    
    try {
      const { arrayRemove, updateDoc, doc, getDoc, deleteDoc } = await import('firebase/firestore');
      
      // 1. Manage Realm (delete if last member, else leave)
      const realmRef = doc(db, 'realms', realmId);
      const realmSnap = await getDoc(realmRef);
      if (realmSnap.exists()) {
        const data = realmSnap.data();
        if (data.members?.length === 1 && data.members[0] === uid) {
          await deleteDoc(realmRef);
        } else {
          await updateDoc(realmRef, {
            members: arrayRemove(uid)
          });
        }
      }
      
      // 2. Remove from User
      await updateDoc(doc(db, 'users', uid), {
        realm_ids: arrayRemove(realmId)
      });

      // 3. Cleanup local store
      get().cleanup();
      
      return true;
    } catch (error) {
      console.error('Error leaving realm:', error);
      throw error;
    }
  }
}));

export default useRealmStore;
