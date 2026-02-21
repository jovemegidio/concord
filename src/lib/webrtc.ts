// ============================================================
// Concord — WebRTC Voice Chat Manager
// Peer-to-peer mesh audio using browser WebRTC APIs
// Signaling via existing WebSocket connection
// ============================================================

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

// Threshold for voice activity detection (0-255 range from AnalyserNode)
const SPEAKING_THRESHOLD = 25;
const SPEAKING_CHECK_INTERVAL = 100; // ms

export type SpeakingCallback = (userId: string, isSpeaking: boolean) => void;
export type RemoteStreamCallback = (userId: string, stream: MediaStream | null) => void;

interface PeerEntry {
  pc: RTCPeerConnection;
  remoteStream: MediaStream;
}

class WebRTCManager {
  private peers = new Map<string, PeerEntry>();
  private localStream: MediaStream | null = null;
  private localUserId: string | null = null;
  private sendSignal: ((msg: Record<string, unknown>) => void) | null = null;

  // Audio analysis for speaking detection
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private speakingCheckTimer: ReturnType<typeof setInterval> | null = null;
  private isSpeaking = false;

  // Callbacks
  private onSpeakingChange: SpeakingCallback | null = null;
  private onRemoteStream: RemoteStreamCallback | null = null;

  // Mute state
  private _isMuted = false;
  private _isDeafened = false;

  // ── Initialization ────────────────────────────────────────

  /**
   * Set up the signaling function (sends messages via WebSocket)
   */
  setSignaling(sendFn: (msg: Record<string, unknown>) => void) {
    this.sendSignal = sendFn;
  }

  /**
   * Set local user ID
   */
  setUserId(userId: string) {
    this.localUserId = userId;
  }

  /**
   * Register speaking state change callback
   */
  onSpeaking(cb: SpeakingCallback) {
    this.onSpeakingChange = cb;
  }

  /**
   * Register remote stream callback (for audio playback)
   */
  onRemoteStreamChange(cb: RemoteStreamCallback) {
    this.onRemoteStream = cb;
  }

  // ── Microphone & Audio Analysis ───────────────────────────

  /**
   * Acquire microphone and set up voice activity detection
   */
  async acquireMicrophone(): Promise<boolean> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      // Apply current mute state
      this.localStream.getAudioTracks().forEach((t) => {
        t.enabled = !this._isMuted;
      });

      // Set up voice activity detection
      this.setupVoiceActivityDetection();

      return true;
    } catch (err) {
      console.error('❌ Falha ao acessar microfone:', err);
      return false;
    }
  }

  private setupVoiceActivityDetection() {
    if (!this.localStream) return;

    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(this.localStream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.3;
    source.connect(this.analyser);

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    this.speakingCheckTimer = setInterval(() => {
      if (!this.analyser || this._isMuted) {
        if (this.isSpeaking) {
          this.isSpeaking = false;
          this.onSpeakingChange?.(this.localUserId!, false);
        }
        return;
      }

      this.analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
      const nowSpeaking = average > SPEAKING_THRESHOLD;

      if (nowSpeaking !== this.isSpeaking) {
        this.isSpeaking = nowSpeaking;
        this.onSpeakingChange?.(this.localUserId!, nowSpeaking);
      }
    }, SPEAKING_CHECK_INTERVAL);
  }

  /**
   * Release microphone and clean up audio analysis
   */
  releaseMicrophone() {
    if (this.speakingCheckTimer) {
      clearInterval(this.speakingCheckTimer);
      this.speakingCheckTimer = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
      this.analyser = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }

    this.isSpeaking = false;
  }

  // ── Peer Connection Management ────────────────────────────

  /**
   * Create a peer connection to a remote user and send an offer
   * (called by the user who is joining and finds existing users)
   */
  async createOffer(remoteUserId: string) {
    if (this.peers.has(remoteUserId)) return;

    const entry = this.createPeerConnection(remoteUserId);

    // Add local audio track to the connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        entry.pc.addTrack(track, this.localStream!);
      });
    }

    // Create and send offer
    const offer = await entry.pc.createOffer();
    await entry.pc.setLocalDescription(offer);

    this.sendSignal?.({
      type: 'webrtc:offer',
      targetUserId: remoteUserId,
      offer: entry.pc.localDescription,
    });
  }

  /**
   * Handle an incoming SDP offer from a remote peer
   */
  async handleOffer(fromUserId: string, offer: RTCSessionDescriptionInit) {
    // Remove existing connection if any (renegotiation)
    if (this.peers.has(fromUserId)) {
      this.removePeer(fromUserId);
    }

    const entry = this.createPeerConnection(fromUserId);

    // Add local audio track
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        entry.pc.addTrack(track, this.localStream!);
      });
    }

    await entry.pc.setRemoteDescription(new RTCSessionDescription(offer));

    // Create and send answer
    const answer = await entry.pc.createAnswer();
    await entry.pc.setLocalDescription(answer);

    this.sendSignal?.({
      type: 'webrtc:answer',
      targetUserId: fromUserId,
      answer: entry.pc.localDescription,
    });
  }

  /**
   * Handle an incoming SDP answer from a remote peer
   */
  async handleAnswer(fromUserId: string, answer: RTCSessionDescriptionInit) {
    const entry = this.peers.get(fromUserId);
    if (!entry) return;

    await entry.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  /**
   * Handle an incoming ICE candidate from a remote peer
   */
  async handleIceCandidate(fromUserId: string, candidate: RTCIceCandidateInit) {
    const entry = this.peers.get(fromUserId);
    if (!entry) return;

    try {
      await entry.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('⚠️ Erro ao adicionar ICE candidate:', err);
    }
  }

  private createPeerConnection(remoteUserId: string): PeerEntry {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    const remoteStream = new MediaStream();

    const entry: PeerEntry = { pc, remoteStream };
    this.peers.set(remoteUserId, entry);

    // ICE candidate gathering — relay to remote peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal?.({
          type: 'webrtc:ice-candidate',
          targetUserId: remoteUserId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Receive remote audio tracks
    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
      this.onRemoteStream?.(remoteUserId, remoteStream);
      this.applyDeafenState();
    };

    // Connection state monitoring
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        console.warn(`🔌 Peer ${remoteUserId} desconectou (${pc.connectionState})`);
        this.removePeer(remoteUserId);
      }
    };

    return entry;
  }

  /**
   * Remove a peer connection and clean up
   */
  removePeer(userId: string) {
    const entry = this.peers.get(userId);
    if (entry) {
      entry.pc.close();
      this.peers.delete(userId);
      this.onRemoteStream?.(userId, null);
    }
  }

  // ── Mute / Deafen ────────────────────────────────────────

  /**
   * Mute/unmute local microphone (disables audio track)
   */
  setMuted(muted: boolean) {
    this._isMuted = muted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((t) => {
        t.enabled = !muted;
      });
    }
    if (muted && this.isSpeaking) {
      this.isSpeaking = false;
      this.onSpeakingChange?.(this.localUserId!, false);
    }
  }

  /**
   * Deafen: mute all remote audio playback
   */
  setDeafened(deafened: boolean) {
    this._isDeafened = deafened;
    this.applyDeafenState();
  }

  private applyDeafenState() {
    for (const [, entry] of this.peers) {
      entry.remoteStream.getAudioTracks().forEach((t) => {
        t.enabled = !this._isDeafened;
      });
    }
  }

  // ── Join / Leave Voice Channel ────────────────────────────

  /**
   * Join a voice channel: acquire mic and connect to all existing peers
   * @param existingUserIds - IDs of users already in the channel
   */
  async joinChannel(existingUserIds: string[]) {
    const acquired = await this.acquireMicrophone();
    if (!acquired) return false;

    // Create offers to all existing users in the channel
    for (const userId of existingUserIds) {
      if (userId !== this.localUserId) {
        await this.createOffer(userId);
      }
    }

    return true;
  }

  /**
   * Leave the voice channel: close all peer connections and release mic
   */
  leaveChannel() {
    // Close all peer connections
    for (const [userId] of this.peers) {
      this.removePeer(userId);
    }
    this.peers.clear();

    // Release microphone
    this.releaseMicrophone();

    // Reset state
    this._isMuted = false;
    this._isDeafened = false;
  }

  // ── Getters ───────────────────────────────────────────────

  get connectedPeers(): string[] {
    return Array.from(this.peers.keys());
  }

  get hasLocalStream(): boolean {
    return this.localStream !== null;
  }

  get isCurrentlyMuted(): boolean {
    return this._isMuted;
  }
}

// Singleton instance
export const webrtcManager = new WebRTCManager();
