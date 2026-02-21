import { useEffect, useRef } from 'react';
import { create } from 'zustand';
import { useChatStore, syncManager } from '@/stores';
import { webrtcManager } from '@/lib/webrtc';

// ── Speaking State (local, not synced via store) ────────────
// Kept separate from the main store to avoid triggering full
// state syncs every 100ms per user.
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

// ── Audio Elements for remote streams ───────────────────────
const remoteAudioElements = new Map<string, HTMLAudioElement>();

function playRemoteStream(userId: string, stream: MediaStream | null) {
  // Clean up existing element
  const existing = remoteAudioElements.get(userId);
  if (existing) {
    existing.srcObject = null;
    existing.remove();
    remoteAudioElements.delete(userId);
  }

  if (!stream) return;

  // Create a new audio element to play the remote stream
  const audio = document.createElement('audio');
  audio.srcObject = stream;
  audio.autoplay = true;
  audio.playsInline = true;
  // Append to DOM to ensure playback works on all browsers
  audio.style.display = 'none';
  document.body.appendChild(audio);
  audio.play().catch(() => {});
  remoteAudioElements.set(userId, audio);
}

// ── WebRTC Voice Hook ───────────────────────────────────────
// Replaces the old speaking simulation with real WebRTC audio
export function useSpeakingSimulation() {
  const { currentUser, voiceConnections, getVoiceChannel, getVoiceUsers } = useChatStore();
  const activeVoice = getVoiceChannel();
  const setSpeakingLocal = useSpeakingStore((s) => s.setSpeaking);
  const initializedRef = useRef(false);

  // Listen for speaking indicators from other users
  useEffect(() => {
    const unsub = syncManager.onSpeaking((data) => {
      setSpeakingLocal(data.userId, data.speaking);
    });
    return unsub;
  }, [setSpeakingLocal]);

  // Set up WebRTC callbacks
  useEffect(() => {
    // Register local speaking detection callback
    webrtcManager.onSpeaking((userId, isSpeaking) => {
      setSpeakingLocal(userId, isSpeaking);
      syncManager.sendSpeaking(userId, isSpeaking);
    });

    // Register remote stream callback (plays audio through hidden <audio> elements)
    webrtcManager.onRemoteStreamChange((userId, stream) => {
      playRemoteStream(userId, stream);
    });
  }, [setSpeakingLocal]);

  // Handle WebRTC signaling messages from the server
  useEffect(() => {
    const unsub = syncManager.onWebRTC(async (data) => {
      const type = data.type as string;
      const fromUserId = data.fromUserId as string;

      switch (type) {
        case 'webrtc:offer':
          await webrtcManager.handleOffer(fromUserId, data.offer as RTCSessionDescriptionInit);
          break;
        case 'webrtc:answer':
          await webrtcManager.handleAnswer(fromUserId, data.answer as RTCSessionDescriptionInit);
          break;
        case 'webrtc:ice-candidate':
          await webrtcManager.handleIceCandidate(fromUserId, data.candidate as RTCIceCandidateInit);
          break;
      }
    });
    return unsub;
  }, []);

  // Set up WebRTC when joining/leaving voice channel
  useEffect(() => {
    if (!currentUser) return;

    webrtcManager.setUserId(currentUser.id);
    webrtcManager.setSignaling((msg) => syncManager.send(msg));

    if (activeVoice && !initializedRef.current) {
      initializedRef.current = true;

      // Get other users already in the channel
      const otherUsers = voiceConnections
        .filter((vc) => vc.channelId === activeVoice && vc.userId !== currentUser.id)
        .map((vc) => vc.userId);

      webrtcManager.joinChannel(otherUsers);
    } else if (!activeVoice && initializedRef.current) {
      initializedRef.current = false;
      webrtcManager.leaveChannel();

      // Clean up all remote audio elements
      for (const [userId] of remoteAudioElements) {
        playRemoteStream(userId, null);
      }

      // Reset speaking state
      setSpeakingLocal(currentUser.id, false);
      syncManager.sendSpeaking(currentUser.id, false);
    }
  }, [activeVoice, currentUser?.id, currentUser, voiceConnections, setSpeakingLocal]);

  // Sync mute state to WebRTC
  const isMuted = voiceConnections.find((vc) => vc.userId === currentUser?.id)?.isMuted ?? true;
  const isDeafened = voiceConnections.find((vc) => vc.userId === currentUser?.id)?.isDeafened ?? false;

  useEffect(() => {
    webrtcManager.setMuted(isMuted);
    if (isMuted && currentUser) {
      setSpeakingLocal(currentUser.id, false);
    }
  }, [isMuted, currentUser, setSpeakingLocal]);

  useEffect(() => {
    webrtcManager.setDeafened(isDeafened);
  }, [isDeafened]);

  // When a new user joins the channel, create an offer to them
  useEffect(() => {
    const unsub = syncManager.onVoice((data) => {
      if (data.type === 'voice:join' && currentUser && activeVoice) {
        const joinedUserId = data.userId as string;
        if (joinedUserId !== currentUser.id) {
          // The new user will send us an offer, we just wait
          // (the joiner is the one who initiates offers to existing users)
        }
      }

      if (data.type === 'voice:leave') {
        const leftUserId = data.userId as string;
        webrtcManager.removePeer(leftUserId);
        playRemoteStream(leftUserId, null);
        setSpeakingLocal(leftUserId, false);
      }
    });
    return unsub;
  }, [currentUser, activeVoice, setSpeakingLocal]);
}
