import { useRouter } from 'expo-router';
import {
  ArrowUpIcon,
  LightbulbIcon,
  MapPinIcon,
  MicrophoneIcon,
  SparkleIcon,
} from 'phosphor-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/roady/button';
import { ProcessingSteps } from '@/components/roady/processing-steps';
import { ScreenHeader } from '@/components/roady/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Shadows } from '@/constants/theme';
import { useReportDraft } from '@/context/report-draft';
import { useAnalyzeReport } from '@/hooks/use-analyze-report';
import { useLocation } from '@/hooks/use-location';

const EXAMPLE =
  'Winda obok przejścia podziemnego jest zepsuta i osoby na wózkach nie mogą przejść.';

export default function ReportTextScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { update } = useReportDraft();
  const { label } = useLocation();
  const [text, setText] = useState('');
  const analyze = useAnalyzeReport('text');
  const sent = analyze.isPending || analyze.isSuccess;
  const hasText = text.trim().length >= 3;

  const send = () => {
    if (hasText) analyze.mutate(text.trim());
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Napisz zgłoszenie" kind="close" onBack={() => router.back()} />

      <View style={styles.conversation}>
        {!sent && !analyze.isError ? (
          <>
            <ThemedText type="title" style={styles.question}>
              Co się stało?
            </ThemedText>
            <ThemedText type="body" themeColor="neutral700">
              Napisz własnymi słowami. Kategorię i ważność uzupełnimy za Ciebie, a Ty je sprawdzisz.
            </ThemedText>
            {!text && (
              <Pressable
                onPress={() => setText(EXAMPLE)}
                style={({ pressed }) => [
                  styles.example,
                  pressed && { backgroundColor: Colors.neutral200 },
                ]}
              >
                <LightbulbIcon size={18} color={Colors.neutral800} />
                <ThemedText type="small" themeColor="neutral800" style={{ flexShrink: 1 }}>
                  Np. „Winda obok przejścia podziemnego jest zepsuta…”
                </ThemedText>
              </Pressable>
            )}
          </>
        ) : (
          <>
            <View style={styles.userBubble}>
              <ThemedText type="body" style={styles.userText}>
                {text}
              </ThemedText>
            </View>
            <View style={styles.aiBubble}>
              <View style={styles.aiHead}>
                <SparkleIcon size={20} color={Colors.accent700} />
                <ThemedText type="body" bold style={{ fontSize: 15 }}>
                  {analyze.isError ? 'Nie udało się przeanalizować' : 'Rozumiem Twoje zgłoszenie…'}
                </ThemedText>
              </View>
              {analyze.isError ? (
                <>
                  <ThemedText type="small" themeColor="neutral700">
                    {analyze.error.message}
                  </ThemedText>
                  <Button variant="secondary" label="Spróbuj ponownie" height={44} onPress={send} />
                  <Button
                    variant="secondary"
                    label="Wypełnij formularz"
                    height={44}
                    onPress={() => {
                      update({ description: text.trim(), source: 'form' });
                      router.replace('/report/form');
                    }}
                  />
                </>
              ) : (
                <ProcessingSteps done={analyze.isSuccess} size="small" />
              )}
            </View>
          </>
        )}
      </View>

      <View style={[styles.composer, { paddingBottom: 14 + insets.bottom }]}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            multiline
            value={text}
            onChangeText={(t) => {
              setText(t);
              if (analyze.isError) analyze.reset();
            }}
            placeholder="Opisz, co się stało…"
            placeholderTextColor={Colors.neutral600}
            editable={!analyze.isPending}
            autoFocus
          />
          {hasText ? (
            <Pressable
              onPress={send}
              disabled={analyze.isPending}
              accessibilityLabel="Wyślij"
              style={({ pressed }) => [
                styles.send,
                pressed && { backgroundColor: Colors.accent600 },
              ]}
            >
              <ArrowUpIcon size={22} weight="fill" color={Colors.neutral100} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => {
                update({ source: 'voice' });
                router.replace('/report/voice');
              }}
              accessibilityLabel="Powiedz zamiast pisać"
              style={({ pressed }) => [
                styles.mic,
                pressed && { backgroundColor: Colors.neutral300 },
              ]}
            >
              <MicrophoneIcon size={22} />
            </Pressable>
          )}
        </View>
        <View style={styles.location}>
          <MapPinIcon size={16} color={Colors.accent700} />
          <ThemedText type="caption">{label ?? 'Twoja okolica'} · Twoja lokalizacja</ThemedText>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  conversation: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  question: { fontSize: 30, lineHeight: 35 },
  example: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.neutral500,
  },
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '84%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderBottomRightRadius: 6,
    backgroundColor: Colors.text,
  },
  userText: { color: Colors.neutral100, lineHeight: 23 },
  aiBubble: {
    alignSelf: 'flex-start',
    minWidth: 230,
    maxWidth: '90%',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    backgroundColor: Colors.neutral100,
    ...Shadows.sm,
  },
  aiHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  composer: {
    paddingTop: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.neutral100,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.divider,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 6,
    paddingLeft: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    backgroundColor: Colors.bg,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 72,
    maxHeight: 140,
    paddingVertical: 8,
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text,
    textAlignVertical: 'top',
  },
  send: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.neutral200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  location: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingLeft: 6 },
});
