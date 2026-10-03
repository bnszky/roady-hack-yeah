import { useRouter } from 'expo-router';
import { StopCircleIcon } from 'phosphor-react-native';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/roady/button';
import { ProcessingSteps } from '@/components/roady/processing-steps';
import { Waveform } from '@/components/roady/waveform';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts } from '@/constants/theme';
import { useReportDraft } from '@/context/report-draft';
import { useAnalyzeReport } from '@/hooks/use-analyze-report';
import { isSpeechRecognitionAvailable, useSpeechRecognition } from '@/hooks/use-speech-recognition';

type Phase = 'recording' | 'stopping' | 'processing';

/** Silence after the last recognised words that finishes the recording by itself. */
const SILENCE_MS = 2000;

function RecDot() {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.25, { duration: 600 }), -1, true);
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.recDot, style]} />;
}

function Spinner() {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1);
  }, [rotation]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
  return <Animated.View style={[styles.spinner, style]} />;
}

function useElapsed(running: boolean) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(iv);
  }, [running]);
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

export default function ReportVoiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { update } = useReportDraft();
  const analyze = useAnalyzeReport('voice');
  const [phase, setPhase] = useState<Phase>('recording');
  const phaseRef = useRef<Phase>('recording');
  const elapsed = useElapsed(phase === 'recording');

  const goTo = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const submit = (transcript: string) => {
    const text = transcript.trim();
    if (text.length < 3) {
      goTo('recording');
      return;
    }
    update({ transcript: text });
    goTo('processing');
    analyze.mutate(text);
  };

  // The final transcript lands just before recognition ends, so send it only then.
  const speech = useSpeechRecognition({
    onEnd: (transcript) => {
      if (phaseRef.current === 'stopping') submit(transcript);
    },
  });

  const { start, abort } = speech;
  useEffect(() => {
    start();
    return () => abort();
  }, [start, abort]);

  const finish = () => {
    // Recognition may already have ended by itself (e.g. long silence).
    if (!speech.isRecording) {
      submit(speech.transcript);
      return;
    }
    goTo('stopping');
    speech.stop();
  };

  // Auto-finish once the user pauses: every new word restarts the countdown.
  const hasWords = speech.transcript.trim().length >= 3;
  const canAutoFinish = phase === 'recording' && speech.hasStarted && hasWords;
  const autoFinish = useEffectEvent(() => finish());
  useEffect(() => {
    if (!canAutoFinish) return;
    const t = setTimeout(autoFinish, SILENCE_MS);
    return () => clearTimeout(t);
  }, [canAutoFinish, speech.transcript]);

  const cancel = () => {
    speech.abort();
    router.back();
  };

  const restart = () => {
    analyze.reset();
    goTo('recording');
    speech.start();
  };

  // Recognition reports "start" asynchronously; until then an idle mic is not "heard nothing".
  const idle = phase === 'recording' && !speech.isRecording;
  const heardNothing =
    idle && ((speech.hasStarted && speech.transcript.trim().length < 3) || !!speech.error);

  if (phase === 'processing') {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top + 56 }]}>
        {analyze.isError ? (
          <>
            <ThemedText type="title" style={styles.centerText}>
              Nie udało się przeanalizować
            </ThemedText>
            <ThemedText type="body" themeColor="neutral700" style={styles.centerText}>
              {analyze.error.message}
            </ThemedText>
            <View style={styles.errorActions}>
              <Button label="Nagraj ponownie" onPress={restart} />
              <Button
                variant="secondary"
                label="Wypełnij formularz"
                onPress={() => {
                  update({ description: speech.transcript, source: 'voice' });
                  router.replace('/report/form');
                }}
              />
            </View>
          </>
        ) : (
          <>
            <Spinner />
            <ThemedText type="title" style={styles.centerText}>
              Analizuję zgłoszenie…
            </ThemedText>
            <View style={{ minWidth: 240 }}>
              <ProcessingSteps done={analyze.isSuccess} />
            </View>
          </>
        )}
      </View>
    );
  }

  return (
    <View
      style={[styles.screen, { paddingTop: insets.top + 20, paddingBottom: 20 + insets.bottom }]}
    >
      <View style={styles.status}>
        <RecDot />
        <ThemedText type="body" themeColor="neutral800" style={{ fontSize: 15 }}>
          {phase === 'stopping' ? 'Kończę nagrywanie…' : 'Nagrywanie'}
        </ThemedText>
        <ThemedText type="subheading" style={styles.elapsed}>
          {elapsed}
        </ThemedText>
      </View>

      <View style={styles.body}>
        <Waveform levels={speech.levels} />
        <View>
          <ThemedText type="kicker" style={styles.hearing}>
            Słyszę
          </ThemedText>
          {speech.transcript ? (
            <ThemedText style={styles.transcript}>{speech.transcript}</ThemedText>
          ) : (
            <ThemedText italic style={[styles.transcript, styles.placeholder]}>
              {heardNothing
                ? 'Nic nie usłyszałem. Spróbuj jeszcze raz…'
                : 'Opisz, co się stało i gdzie…'}
            </ThemedText>
          )}
          {canAutoFinish && (
            <ThemedText type="caption" style={styles.autoHint}>
              Zakończę automatycznie po chwili ciszy
            </ThemedText>
          )}
          {speech.error && (
            <ThemedText type="small" style={styles.error}>
              {speech.error}
            </ThemedText>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          variant="secondary"
          label="Anuluj"
          height={58}
          style={{ flex: 1 }}
          onPress={cancel}
        />
        {!isSpeechRecognitionAvailable ? (
          <Button
            label="Napisz zamiast tego"
            height={58}
            style={{ flex: 1.6 }}
            onPress={() => {
              update({ source: 'text' });
              router.replace('/report/text');
            }}
          />
        ) : heardNothing ? (
          <Button label="Nagraj ponownie" height={58} style={{ flex: 1.6 }} onPress={restart} />
        ) : (
          <Button
            variant="dark"
            label="Zakończ"
            icon={StopCircleIcon}
            height={58}
            style={{ flex: 1.6 }}
            loading={phase === 'stopping'}
            onPress={finish}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 24 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 26 },
  centerText: { textAlign: 'center' },
  errorActions: { alignSelf: 'stretch', gap: 10 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent2_600 },
  elapsed: { marginLeft: 'auto', fontSize: 17, fontVariant: ['tabular-nums'] },
  body: { flex: 1, justifyContent: 'center', gap: 30 },
  hearing: { marginBottom: 12 },
  transcript: { fontFamily: Fonts.regular, fontSize: 26, lineHeight: 34, color: Colors.text },
  placeholder: { color: Colors.neutral600 },
  error: { color: Colors.accent2_700, marginTop: 10 },
  autoHint: { marginTop: 14 },
  actions: { flexDirection: 'row', gap: 10 },
  spinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: Colors.accent200,
    borderTopColor: Colors.accent,
  },
});
