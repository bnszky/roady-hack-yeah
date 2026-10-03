import { requireOptionalNativeModule } from 'expo';
import type { ExpoSpeechRecognitionModuleType } from 'expo-speech-recognition/build/ExpoSpeechRecognitionModule.types';
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { Platform } from 'react-native';

// Looked up optionally instead of importing `expo-speech-recognition`, whose import throws
// when the native module is missing (Expo Go, or a dev build made before it was added).
// Expo Router loads every route eagerly, so that throw would crash the whole app.
const SpeechModule =
  requireOptionalNativeModule<ExpoSpeechRecognitionModuleType>('ExpoSpeechRecognition');

/** False in Expo Go: voice reports need a dev build (`npx expo run:android`). */
export const isSpeechRecognitionAvailable = SpeechModule != null;

/** Number of recent volume samples drawn in the waveform. */
export const LEVEL_SAMPLES = 30;
/** expo-speech-recognition reports volume in the range -2..10 (below 0 is inaudible). */
const MIN_VOLUME = -2;
const MAX_VOLUME = 10;

const emptyLevels = () => Array<number>(LEVEL_SAMPLES).fill(0);

/** Maps a raw volume sample to a 0..1 bar height. */
function toRatio(value: number) {
  return (Math.max(value, MIN_VOLUME) - MIN_VOLUME) / (MAX_VOLUME - MIN_VOLUME);
}

/**
 * Live Polish speech recognition with a rolling volume buffer for the waveform.
 * Recording runs until `stop()`; `onEnd` fires with the final transcript once recognition ends.
 */
export function useSpeechRecognition({ onEnd }: { onEnd?: (transcript: string) => void } = {}) {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [levels, setLevels] = useState(emptyLevels);
  const [error, setError] = useState<string | null>(null);
  // Android emits one final result per utterance in continuous mode; iOS keeps
  // the whole session in each result, so only Android needs to accumulate.
  const committed = useRef('');
  const latest = useRef('');

  const handleEnd = useEffectEvent(() => onEnd?.(latest.current));

  useEffect(() => {
    if (!SpeechModule) return;
    const subscriptions = [
      SpeechModule.addListener('start', () => {
        setIsRecording(true);
        setHasStarted(true);
      }),
      SpeechModule.addListener('end', () => {
        setIsRecording(false);
        setLevels(emptyLevels());
        handleEnd();
      }),
      SpeechModule.addListener('volumechange', (event) => {
        setLevels((prev) => [...prev.slice(1), toRatio(event.value)]);
      }),
      SpeechModule.addListener('result', (event) => {
        const text = event.results[0]?.transcript?.trim() ?? '';
        const full = [committed.current, text].filter(Boolean).join(' ');
        latest.current = full;
        setTranscript(full);
        if (event.isFinal && Platform.OS === 'android') committed.current = full;
      }),
      SpeechModule.addListener('error', (event) => {
        // "no-speech" just means silence; the screen shows the empty state for that.
        if (event.error !== 'no-speech') setError(event.message || event.error);
      }),
    ];
    return () => subscriptions.forEach((s) => s.remove());
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setTranscript('');
    setHasStarted(false);
    committed.current = '';
    latest.current = '';
    if (!SpeechModule) {
      setError('Rozpoznawanie mowy wymaga dev buildu aplikacji (nie działa w Expo Go).');
      return;
    }
    const { granted } = await SpeechModule.requestPermissionsAsync();
    if (!granted) {
      setError('Brak uprawnień do mikrofonu');
      return;
    }
    SpeechModule.start({
      lang: 'pl-PL',
      interimResults: true,
      continuous: true,
      volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
    });
  }, []);

  const stop = useCallback(() => SpeechModule?.stop(), []);
  const abort = useCallback(() => SpeechModule?.abort(), []);

  return { transcript, isRecording, hasStarted, levels, error, start, stop, abort };
}
