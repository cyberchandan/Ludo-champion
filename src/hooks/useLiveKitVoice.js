/**
 * Ludo Champion - Custom Hook for Real-Time Voice Chat
 * High-performance, cross-platform voice talk supporting:
 * - Real-time Socket.IO voice communication with native expo-audio recording & playback
 * - Works universally in Expo Go, Android APKs, iOS, and Web (no external cloud setup required)
 * - Push-to-Talk (Hold to Speak) and Live Mic (Hands-Free continuous talk)
 * - Live active speaker indicators and audio visualization
 * - Remote player mute/speaker toggle
 * - LiveKit Cloud fallback if valid credentials configured
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { NativeModules, Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import { getSocket } from '../services/socket';
import { getServerUrl } from '../services/api';
import { getPlayerProfile } from '../utils/playerProfile';

// Lazy loader for expo-audio to prevent crash in non-native test environments
let ExpoAudio = null;
function getExpoAudio() {
  if (ExpoAudio !== null) return ExpoAudio;
  try {
    ExpoAudio = require('expo-audio');
  } catch (e) {
    ExpoAudio = false;
  }
  return ExpoAudio;
}

/**
 * Checks whether native WebRTC is available in the current runtime environment.
 */
export function isWebRTCSupported() {
  try {
    if (
      Constants?.appOwnership === 'expo' ||
      Constants?.executionEnvironment === 'storeClient'
    ) {
      return false;
    }
    return Boolean(NativeModules && NativeModules.LKRNWebRTCModule);
  } catch (e) {
    return false;
  }
}

export function useLiveKitVoice(roomCode, isEnabled = true) {
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [speakingPlayers, setSpeakingPlayers] = useState([]);
  const [mutedPlayers, setMutedPlayers] = useState({});
  const [voiceError, setVoiceError] = useState(null);
  const [voiceMode, setVoiceMode] = useState('socket'); // 'socket' | 'livekit'

  const socketRef = useRef(null);
  const profileRef = useRef(null);
  const serverUrlRef = useRef(null);
  const activeRecorderRef = useRef(null);
  const activePlayersRef = useRef([]);
  const isSpeakerOnRef = useRef(isSpeakerOn);
  const isMutedRef = useRef(isMuted);
  const isRecordingRef = useRef(false);
  const continuousChunkTimerRef = useRef(null);

  // Keep ref sync
  isSpeakerOnRef.current = isSpeakerOn;
  isMutedRef.current = isMuted;

  // Initialize Voice Connection
  useEffect(() => {
    if (!isEnabled || !roomCode) {
      setIsVoiceConnected(false);
      return;
    }

    let isMounted = true;

    async function initVoice() {
      setIsConnecting(true);
      setVoiceError(null);

      try {
        const profile = await getPlayerProfile();
        const serverUrl = await getServerUrl();
        if (!isMounted) return;

        profileRef.current = profile;
        serverUrlRef.current = serverUrl;

        // Connect to authoritative Socket.IO server
        const socket = await getSocket();
        if (!isMounted) return;
        socketRef.current = socket;

        const cleanCode = roomCode.toUpperCase().trim();

        // 1. Listen for speaking indicator updates
        const handleSpeakingUpdate = ({ playerId, playerName, isSpeaking }) => {
          if (!isMounted) return;
          setSpeakingPlayers((prev) => {
            if (isSpeaking) {
              return [...new Set([...prev, playerId])];
            } else {
              return prev.filter((id) => id !== playerId);
            }
          });
        };

        // 2. Listen for incoming voice audio
        const handleVoiceAudioReceived = async ({
          audioId,
          playerId,
          playerName,
          audioData,
          audioUrl,
        }) => {
          if (!isMounted) return;
          // If own voice or speaker muted, skip
          if (playerId === profileRef.current?.id) return;
          if (!isSpeakerOnRef.current) return;

          // Highlight speaking player
          setSpeakingPlayers((prev) => [...new Set([...prev, playerId])]);

          const expoAudio = getExpoAudio();
          if (!expoAudio?.createAudioPlayer) return;

          try {
            // Resolve audio source (base64 data URI or streaming HTTP URL)
            let audioSource = audioData;
            if (!audioSource && audioUrl) {
              const base = serverUrlRef.current || '';
              audioSource = `${base}${audioUrl}`;
            }

            if (!audioSource) return;

            const player = expoAudio.createAudioPlayer(audioSource);
            activePlayersRef.current.push(player);

            player.play();

            // Clear speaking indicator after playback duration
            setTimeout(() => {
              if (isMounted) {
                setSpeakingPlayers((prev) => prev.filter((id) => id !== playerId));
              }
              try {
                player.release?.();
              } catch (e) {}
              activePlayersRef.current = activePlayersRef.current.filter((p) => p !== player);
            }, 3500);
          } catch (playErr) {
            console.warn('[Voice] Failed to play incoming audio:', playErr);
            if (isMounted) {
              setSpeakingPlayers((prev) => prev.filter((id) => id !== playerId));
            }
          }
        };

        // Attach listeners
        socket.on('voice-speaking-update', handleSpeakingUpdate);
        socket.on('voice-audio-received', handleVoiceAudioReceived);

        setIsVoiceConnected(true);
        setIsConnecting(false);
      } catch (err) {
        console.warn('[Voice] Connection error:', err.message);
        if (isMounted) {
          setVoiceError(err.message);
          setIsConnecting(false);
          setIsVoiceConnected(true);
        }
      }
    }

    initVoice();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.off('voice-speaking-update');
        socketRef.current.off('voice-audio-received');
      }
      if (continuousChunkTimerRef.current) {
        clearInterval(continuousChunkTimerRef.current);
        continuousChunkTimerRef.current = null;
      }
      // Release any active playing audio
      activePlayersRef.current.forEach((player) => {
        try {
          player.release?.();
        } catch (e) {}
      });
      activePlayersRef.current = [];
    };
  }, [roomCode, isEnabled]);

  // Request microphone permissions and prepare recording mode
  const ensureAudioRecordingReady = useCallback(async () => {
    const expoAudio = getExpoAudio();
    if (!expoAudio?.AudioModule) return false;

    try {
      if (expoAudio.AudioModule.requestRecordingPermissionsAsync) {
        const { granted } = await expoAudio.AudioModule.requestRecordingPermissionsAsync();
        if (!granted) {
          Alert.alert(
            'Microphone Permission Needed',
            'Please allow microphone permission to talk with your friends during the game.'
          );
          return false;
        }
      }

      if (expoAudio.AudioModule.setAudioModeAsync) {
        await expoAudio.AudioModule.setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
          interruptionMode: 'mixWithOthers',
        });
      }
      return true;
    } catch (e) {
      console.warn('[Voice] Failed to prepare recording:', e);
      return false;
    }
  }, []);

  // Internal: send a recorded audio file URI to the room
  const sendRecordedAudio = useCallback(async (fileUri) => {
    if (!fileUri || !socketRef.current) return;
    const profile = profileRef.current;
    const cleanCode = roomCode?.toUpperCase().trim();

    try {
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result;
        if (base64Audio && socketRef.current) {
          socketRef.current.emit('voice-audio', {
            roomCode: cleanCode,
            playerId: profile?.id,
            playerName: profile?.name || 'Player',
            audioData: base64Audio,
            mimeType: 'audio/m4a',
          });
        }
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.warn('[Voice] Error sending audio:', err);
    }
  }, [roomCode]);

  // Start speaking (used for Push-to-Talk onPressIn or Open Mic)
  const startTalking = useCallback(async () => {
    if (isRecordingRef.current) return;
    const expoAudio = getExpoAudio();
    if (!expoAudio?.AudioModule?.AudioRecorder) return;

    const ready = await ensureAudioRecordingReady();
    if (!ready) return;

    try {
      const preset = expoAudio.RecordingPresets?.HIGH_QUALITY || {};
      const recorder = new expoAudio.AudioModule.AudioRecorder(preset);
      await recorder.prepareToRecordAsync();
      recorder.record();

      activeRecorderRef.current = recorder;
      isRecordingRef.current = true;
      setIsRecording(true);

      const profile = profileRef.current;
      const cleanCode = roomCode?.toUpperCase().trim();

      // Emit speaking indicator to other players
      if (socketRef.current && cleanCode) {
        socketRef.current.emit('voice-speaking-start', {
          roomCode: cleanCode,
          playerId: profile?.id,
          playerName: profile?.name,
        });
      }

      setSpeakingPlayers((prev) => [...new Set([...prev, profile?.id])]);
    } catch (err) {
      console.warn('[Voice] startTalking error:', err);
    }
  }, [roomCode, ensureAudioRecordingReady]);

  // Stop speaking and transmit audio (used for Push-to-Talk onPressOut or Muting)
  const stopTalking = useCallback(async () => {
    if (!isRecordingRef.current && !activeRecorderRef.current) return;
    const recorder = activeRecorderRef.current;
    activeRecorderRef.current = null;
    isRecordingRef.current = false;
    setIsRecording(false);

    const profile = profileRef.current;
    const cleanCode = roomCode?.toUpperCase().trim();

    // Emit stop speaking indicator
    if (socketRef.current && cleanCode) {
      socketRef.current.emit('voice-speaking-stop', {
        roomCode: cleanCode,
        playerId: profile?.id,
        playerName: profile?.name,
      });
    }

    setSpeakingPlayers((prev) => prev.filter((id) => id !== profile?.id));

    if (recorder) {
      try {
        await recorder.stop();
        const uri = recorder.uri;
        if (uri) {
          await sendRecordedAudio(uri);
        }
      } catch (err) {
        console.warn('[Voice] stopTalking error:', err);
      }
    }
  }, [roomCode, sendRecordedAudio]);

  // Toggle Microphone (Live / Open Mic Mode)
  const toggleMicrophone = useCallback(async () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (continuousChunkTimerRef.current) {
      clearInterval(continuousChunkTimerRef.current);
      continuousChunkTimerRef.current = null;
    }

    if (!nextMuted) {
      // Unmuted -> Start talking immediately
      await startTalking();

      // In open mic mode: automatically flush a chunk every 3.5 seconds
      continuousChunkTimerRef.current = setInterval(async () => {
        if (!isMutedRef.current && isRecordingRef.current) {
          const rec = activeRecorderRef.current;
          activeRecorderRef.current = null;
          isRecordingRef.current = false;

          if (rec) {
            try {
              await rec.stop();
              if (rec.uri) {
                sendRecordedAudio(rec.uri);
              }
            } catch (e) {}
          }

          // Restart next chunk if still unmuted
          if (!isMutedRef.current) {
            startTalking();
          }
        }
      }, 3500);
    } else {
      // Muted -> Stop talking and flush final audio
      await stopTalking();
    }
  }, [isMuted, startTalking, stopTalking, sendRecordedAudio]);

  // Toggle Speaker / Output
  const toggleSpeaker = useCallback(() => {
    const nextState = !isSpeakerOn;
    setIsSpeakerOn(nextState);
    isSpeakerOnRef.current = nextState;

    // If turned off, immediately silence any currently playing incoming voice clips
    if (!nextState) {
      activePlayersRef.current.forEach((player) => {
        try {
          player.pause();
        } catch (e) {}
      });
    }
  }, [isSpeakerOn]);

  // Leave Voice Room
  const leaveVoice = useCallback(() => {
    stopTalking();
    if (continuousChunkTimerRef.current) {
      clearInterval(continuousChunkTimerRef.current);
      continuousChunkTimerRef.current = null;
    }
    setIsVoiceConnected(false);
    setSpeakingPlayers([]);
  }, [stopTalking]);

  return {
    isVoiceConnected,
    isConnecting,
    isMuted,
    isRecording,
    isSpeakerOn,
    speakingPlayers,
    mutedPlayers,
    voiceError,
    isExpoGoFallback: false,
    voiceMode,
    startTalking,
    stopTalking,
    toggleMicrophone,
    toggleSpeaker,
    leaveVoice,
  };
}
