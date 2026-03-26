import { create } from 'zustand';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  unsubscribe: null,

  setUser: (firebaseUser) => {
    // If we already have a listener, kill it to prevent leaks
    const currentUnsubscribe = get().unsubscribe;
    if (currentUnsubscribe) currentUnsubscribe();

    if (!firebaseUser) {
      set({ user: null, isAuthenticated: false, unsubscribe: null });
      return;
    }

    // Set up real-time Firestore listener for this user document
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const unsub = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        set({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: data.displayName || firebaseUser.displayName || firebaseUser.email,
            xp: data.xp ?? data.XP ?? 0,
            level: data.level ?? 1,
            habitsCompleted: data.habitsCompleted ?? data.completions ?? 0,
            streak: data.streak ?? 0,
            realm_ids: data.realm_ids ?? [],
            ...data
          },
          isAuthenticated: true,
        });
      }
    });

    set({ unsubscribe: unsub });
  },

  logout: () => {
    const unsub = get().unsubscribe;
    if (unsub) unsub();
    set({ user: null, isAuthenticated: false, unsubscribe: null });
  },
}));

export default useAuthStore;
