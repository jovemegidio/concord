import { useEffect } from 'react';
import { create } from 'zustand';
import { useChatStore, syncManager } from '@/stores';

// ── Speaking State (local, not synced via store) ────────────
// Kept separate from the main store to avoid triggering full
// state syncs every 1-3 seconds per user.
export interface SpeakingStore {
  speaking: Record<string, boolean>;
  setSpeaking: (userId: string, isSpeaking: boolean) => void;
}

export const useSpeakingStore = create<SpeakingStore>()((set) => ({
  speaking: {},
  setSpeaking: (userId, isSpeaking) =>
    set((s) => ({
      speaking: isSpeaking
        ? { ...s.speaking, [userId]: true }
        : Object.fromEntries(Object.entries(s.speaking).filter(([k]) => k !== userId)),
    })),
}));

// ── Speaking Simulation Hook ────────────────────────────────
export function useSpeakingSimulation() {
  const { currentUser, voiceConnections, getVoiceChannel } = useChatStore();
  const activeVoice = getVoiceChannel();
  const setSpeakingLocal = useSpeakingStore((s) => s.setSpeaking);

  // Listen for speaking indicators from other users
  useEffect(() => {
    const unsub = syncManager.onSpeaking((data) => {
      setSpeakingLocal(data.userId, data.speaking);
    });
    return unsub;
  }, [setSpeakingLocal]);

  // Simulate speaking for the local user
  const isMuted = voiceConnections.find((vc) => vc.userId === currentUser?.id)?.isMuted ?? true;
  useEffect(() => {
    if (!activeVoice || !currentUser) return;
    if (isMuted) {
      setSpeakingLocal(currentUser.id, false);
      syncManager.sendSpeaking(currentUser.id, false);
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;
    const cycle = () => {
      const isSpeaking = Math.random() > 0.45;
      setSpeakingLocal(currentUser.id, isSpeaking);
      syncManager.sendSpeaking(currentUser.id, isSpeaking);
      const delay = isSpeaking
        ? 800 + Math.random() * 2200
        : 1500 + Math.random() * 4000;
      timeout = setTimeout(cycle, delay);
    };
    timeout = setTimeout(cycle, 1000);

    return () => {
      clearTimeout(timeout);
      setSpeakingLocal(currentUser.id, false);
      syncManager.sendSpeaking(currentUser.id, false);
    };
  }, [activeVoice, currentUser?.id, isMuted, setSpeakingLocal, currentUser]);
}
