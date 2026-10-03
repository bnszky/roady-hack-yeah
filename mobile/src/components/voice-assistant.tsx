import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';

import { API_URL } from '@/lib/env';

/** Number of recent volume samples drawn in the level meter. */
const LEVEL_SAMPLES = 32;
/** expo-speech-recognition reports volume in the range -2..10 (below 0 is inaudible). */
const MIN_VOLUME = -2;
const MAX_VOLUME = 10;

const emptyLevels = () => Array<number>(LEVEL_SAMPLES).fill(MIN_VOLUME);

export default function VoiceAssistant() {
  const [transcript, setTranscript] = useState('');
  const [isFinal, setIsFinal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [levels, setLevels] = useState(emptyLevels);
  const [error, setError] = useState<string | null>(null);
  const player = useAudioPlayer();

  const playResponse = async (text: string) => {
    // The backend returns the spoken answer as MP3, so the player can stream it directly.
    await setAudioModeAsync({ playsInSilentMode: true });
    player.replace({ uri: `${API_URL}/process-command?text=${encodeURIComponent(text)}` });
    player.play();
  };

  useSpeechRecognitionEvent('start', () => setIsRecording(true));
  useSpeechRecognitionEvent('end', () => {
    setIsRecording(false);
    setLevels(emptyLevels());
  });
  useSpeechRecognitionEvent('volumechange', (event) => {
    setLevels((prev) => [...prev.slice(1), event.value]);
  });
  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    setTranscript(text);
    setIsFinal(event.isFinal);
    if (event.isFinal && text) {
      playResponse(text);
    }
  });
  useSpeechRecognitionEvent('error', (event) => {
    setError(`${event.error}: ${event.message}`);
  });

  const startRecording = async () => {
    setError(null);
    setTranscript('');
    setIsFinal(false);
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      setError('Brak uprawnień do mikrofonu');
      return;
    }
    ExpoSpeechRecognitionModule.start({
      lang: 'pl-PL',
      interimResults: true,
      volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
    });
  };

  const stopRecording = () => {
    ExpoSpeechRecognitionModule.stop();
  };

  const currentLevel = levels[levels.length - 1];

  return (
    <View style={styles.container}>
      <View style={[styles.badge, isRecording ? styles.badgeOn : styles.badgeOff]}>
        <View style={[styles.dot, isRecording && styles.dotOn]} />
        <Text style={styles.badgeText}>{isRecording ? 'NAGRYWANIE' : 'Mikrofon wyłączony'}</Text>
      </View>

      <View style={styles.meter}>
        {levels.map((value, i) => {
          const ratio = (Math.max(value, MIN_VOLUME) - MIN_VOLUME) / (MAX_VOLUME - MIN_VOLUME);
          return (
            <View
              key={i}
              style={[
                styles.bar,
                { height: `${Math.max(ratio, 0.03) * 100}%` },
                value > 0 && styles.barAudible,
              ]}
            />
          );
        })}
      </View>
      <Text style={styles.levelText}>
        Poziom: {isRecording ? currentLevel.toFixed(1) : '—'} / {MAX_VOLUME}
      </Text>

      <View style={styles.transcriptBox}>
        <Text style={styles.transcriptLabel}>
          {isRecording ? 'Transkrypcja na żywo' : 'Powiedziałeś'}
        </Text>
        <Text style={[styles.transcript, !isFinal && styles.transcriptInterim]}>
          {transcript || (isRecording ? '…' : '')}
        </Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable onPressIn={startRecording} onPressOut={stopRecording} style={styles.button}>
        <Text style={styles.buttonText}>{isRecording ? 'Słucham...' : 'Przytrzymaj i mów'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 16 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeOn: { backgroundColor: '#ffe3e3' },
  badgeOff: { backgroundColor: '#eeeeee' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#999' },
  dotOn: { backgroundColor: '#e53935' },
  badgeText: { fontWeight: 'bold', color: '#333' },
  meter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 80,
    width: '100%',
    justifyContent: 'center',
  },
  bar: { width: 6, borderRadius: 3, backgroundColor: '#cfcfcf' },
  barAudible: { backgroundColor: '#ff5252' },
  levelText: { color: '#666', fontVariant: ['tabular-nums'] },
  transcriptBox: {
    width: '100%',
    minHeight: 100,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  transcriptLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase' },
  transcript: { fontSize: 18, color: '#111' },
  transcriptInterim: { color: '#777', fontStyle: 'italic' },
  error: { color: '#d13438', textAlign: 'center' },
  button: { backgroundColor: '#ff5252', padding: 20, borderRadius: 50 },
  buttonText: { color: 'white', fontWeight: 'bold' },
});
