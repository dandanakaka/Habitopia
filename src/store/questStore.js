import { create } from 'zustand';

const useQuestStore = create((set) => ({
  quests: [
    {
      id: 'q1',
      title: '100 Pushups',
      description: 'Complete 100 pushups before end of day',
      status: 'pending',        // pending | accepted | declined | completed
      assigned_to: 'u1',
      assigned_by: 'u2',
      xpReward: 80,
      type: 'challenge',        // challenge | side_quest
    },
    {
      id: 'q2',
      title: 'Read a Chapter',
      description: 'Read one chapter from any book',
      status: 'accepted',
      assigned_to: 'u1',
      assigned_by: 'u2',
      xpReward: 40,
      type: 'side_quest',
    },
    {
      id: 'q3',
      title: 'Cold Shower',
      description: 'Take a 3-minute cold shower',
      status: 'pending',
      assigned_to: 'u2',
      assigned_by: 'u1',
      xpReward: 60,
      type: 'challenge',
    },
  ],

  assignQuest: (title, description, assignedTo, assignedBy, type) =>
    set((state) => ({
      quests: [
        ...state.quests,
        {
          id: 'q' + Date.now(),
          title,
          description: description || '',
          status: 'pending',
          assigned_to: assignedTo,
          assigned_by: assignedBy,
          xpReward: Math.floor(Math.random() * 60) + 20,
          type: type || 'side_quest',
        },
      ],
    })),

  acceptQuest: (id) =>
    set((state) => ({
      quests: state.quests.map((q) =>
        q.id === id ? { ...q, status: 'accepted' } : q
      ),
    })),

  declineQuest: (id) =>
    set((state) => ({
      quests: state.quests.map((q) =>
        q.id === id ? { ...q, status: 'declined' } : q
      ),
    })),

  completeQuest: (id) =>
    set((state) => ({
      quests: state.quests.map((q) =>
        q.id === id ? { ...q, status: 'completed' } : q
      ),
    })),
}));

export default useQuestStore;
