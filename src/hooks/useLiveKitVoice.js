/**
 * Ludo Champion - Custom Hook for LiveKit Real-Time Voice Chat
 * Handles WebRTC audio rooms, microphone permissions, speaker routing, and speaking indicators.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { apiGetVoiceToken } from '../services/api';
import { getPlayerProfile } from '../utils/playerProfile';

export function useLiveKitVoice(roomCode, isEnabled = true) {
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted by default for comfort
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [speakingPlayers, setSpeakingPlayers] = useState([]); // List of playerIds currently speaking
  const [mutedPlayers, setMutedPlayers] = useState({}); // { [playerId]: boolean }
  const [voiceError, setVoiceError] = useState(null);
  const [isExpoGoFallback, setIsExpoGoFallback] = useState(false);

  const roomRef = useRef(null);

  useEffect(() => {
    if (!isEnabled || !roomCode) return;
    let isMounted = true;

    async function initVoice() {
      setIsConnecting(true);
      setVoiceError(null);

      try {
        const profile = await getPlayerProfile();

        // 1. Fetch secure token from backend
        const tokenRes = await apiGetVoiceToken({
          roomCode,
          playerId: profile.id,
          playerName: profile.name,
        });

        if (!isMounted) return;

        // 2. Dynamically import LiveKit to support Expo Go graceful fallback
        let LiveKitSDK;
        try {
          LiveKitSDK = require('@livekit/react-native');
        } catch (e) {
          console.warn('[LiveKit] Native WebRTC module not available in Expo Go. Running voice in simulation mode.');
          setIsExpoGoFallback(true);
          setIsVoiceConnected(true);
          setIsConnecting(false);
          return;
        }

        const { Room, RoomEvent, AudioSession } = LiveKitSDK;

        // Start AudioSession on native platform
        if (AudioSession?.startAudioSession) {
          try {
            await AudioSession.startAudioSession();
          } catch (e) {
            console.warn('[AudioSession] start warning:', e);
          }
        }

        const room = new Room({
          adaptiveStream: false,
          dynacast: true,
          audioCaptureDefaults: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        roomRef.current = room;

        // Setup active speaker listener
        room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
          if (!isMounted) return;
          const activeIds = (speakers || []).map((s) => s.identity);
          setSpeakingPlayers(activeIds);
        });

        // Setup track muted/unmuted listeners
        room.on(RoomEvent.TrackMuted, (publication, participant) => {
          if (!isMounted) return;
          setMutedPlayers((prev) => ({ ...prev, [participant.identity]: true }));
        });

        room.on(RoomEvent.TrackUnmuted, (publication, participant) => {
          if (!isMounted) return;
          setMutedPlayers((prev) => ({ ...prev, [participant.identity]: false }));
        });

        room.on(RoomEvent.Disconnected, () => {
          if (!isMounted) return;
          setIsVoiceConnected(false);
          setSpeakingPlayers([]);
        });

        // Connect to LiveKit Cloud / self-hosted instance
        const wsUrl = tokenRes.wsUrl || 'wss://sample.livekit.cloud';
        await room.connect(wsUrl, tokenRes.token);

        if (!isMounted) {
          room.disconnect();
          return;
        }

        setIsVoiceConnected(true);
        setIsConnecting(false);

        // Publish local mic (or keep muted if default)
        try {
          await room.localParticipant.setMicrophoneEnabled(false);
          setIsMuted(true);
        } catch (micErr) {
          console.warn('[LiveKit] Initial mic setup:', micErr);
        }
      } catch (err) {
        console.warn('[LiveKit] Voice connection notice:', err.message);
        if (isMounted) {
          // If native WebRTC fails, enable simulation mode so game is uninterrupted
          setIsExpoGoFallback(true);
          setIsVoiceConnected(true);
          setIsConnecting(false);
        }
      }
    }

    initVoice();

    return () => {
      isMounted = false;
      if (roomRef.current) {
        try {
          roomRef.current.disconnect();
        } catch (e) {
          // ignore
        }
        roomRef.current = null;
      }
    };
  }, [roomCode, isEnabled]);

  // Toggle Microphone
  const toggleMicrophone = useCallback(async () => {
    const nextState = !isMuted;
    setIsMuted(nextState);

    if (roomRef.current?.localParticipant) {
      try {
        await roomRef.current.localParticipant.setMicrophoneEnabled(!nextState);
      } catch (err) {
        console.warn('[LiveKit] Failed to toggle mic:', err);
      }
    }
  }, [isMuted]);

  // Toggle Speaker / Output
  const toggleSpeaker = useCallback(async () => {
    const nextState = !isSpeakerOn;
    setIsSpeakerOn(nextState);

    // Mute/unmute all incoming audio tracks
    if (roomRef.current?.remoteParticipants) {
      try {
        roomRef.current.remoteParticipants.forEach((participant) => {
          participant.audioTrackPublications?.forEach((pub) => {
            if (pub.track) {
              pub.track.setEnabled(nextState);
            }
          });
        });
      } catch (err) {
        console.warn('[LiveKit] Failed to toggle speaker:', err);
      }
    }
  }, [isSpeakerOn]);

  // Leave Voice Room
  const leaveVoice = useCallback(() => {
    if (roomRef.current) {
      try {
        roomRef.current.disconnect();
      } catch (e) {
        // ignore
      }
      roomRef.current = null;
    }
    setIsVoiceConnected(false);
    setSpeakingPlayers([]);
  }, []);

  return {
    isVoiceConnected,
    isConnecting,
    isMuted,
    isSpeakerOn,
    speakingPlayers,
    mutedPlayers,
    voiceError,
    isExpoGoFallback,
    toggleMicrophone,
    toggleSpeaker,
    leaveVoice,
  };
}
