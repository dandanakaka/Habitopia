import { create } from 'zustand';

const useRealmStore = create((set) => ({
  realm: {
    id: 'r1',
    name: 'The Iron Village',
    health: 85,
    members: ['u1', 'u2'],
  },

  memberProfiles: [
    { id: 'u1', username: 'player_one', xp: 1250, habitsCompleted: 42, streak: 7 },
    { id: 'u2', username: 'shadow_knight', xp: 980, habitsCompleted: 35, streak: 5 },
  ],

  inviteLink: null,

  setRealm: (realm) => set({ realm }),

  generateInviteLink: () => {
    const link = `habitopia://join/r1?code=${Math.random().toString(36).substr(2, 8)}`;
    set({ inviteLink: link });
    return link;
  },

  updateHealth: (delta) =>
    set((state) => ({
      realm: {
        ...state.realm,
        health: Math.max(0, Math.min(100, state.realm.health + delta)),
      },
    })),
}));

export default useRealmStore;
