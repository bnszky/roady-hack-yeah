import { useRouter } from 'expo-router';
import {
  ChatTextIcon,
  ListChecksIcon,
  MapPinIcon,
  MicrophoneIcon,
  type Icon,
} from 'phosphor-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { ModalSheet } from '@/components/roady/sheet';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useReportDraft, type DraftSource } from '@/context/report-draft';
import { useLocation } from '@/hooks/use-location';

const METHODS: { source: DraftSource; title: string; hint: string; icon: Icon }[] = [
  { source: 'voice', title: 'Powiedz', hint: 'Opisz, co się stało', icon: MicrophoneIcon },
  { source: 'text', title: 'Napisz', hint: 'Napisz nam, co się stało', icon: ChatTextIcon },
  { source: 'form', title: 'Formularz', hint: 'Wybierz szczegóły ręcznie', icon: ListChecksIcon },
];

export function ReportMethodSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const { start } = useReportDraft();
  const { location, label } = useLocation();

  const pick = (source: DraftSource) => {
    start(source, location);
    onClose();
    router.push(`/report/${source}`);
  };

  return (
    <ModalSheet visible={visible} onClose={onClose}>
      <ThemedText type="title">Co się dzieje?</ThemedText>
      <ThemedText type="body" themeColor="neutral700" style={styles.lead}>
        Wybierz, jak chcesz zgłosić problem. Lokalizację ustawimy sami.
      </ThemedText>
      <View style={styles.grid}>
        {METHODS.map(({ source, title, hint, icon: IconCmp }) => (
          <Pressable
            key={source}
            onPress={() => pick(source)}
            accessibilityRole="button"
            accessibilityLabel={`${title}: ${hint}`}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.cardIcon}>
              <IconCmp size={28} color={Colors.accent800} />
            </View>
            <View>
              <ThemedText type="heading" style={styles.cardTitle}>
                {title}
              </ThemedText>
              <ThemedText type="caption" style={styles.cardHint}>
                {hint}
              </ThemedText>
            </View>
          </Pressable>
        ))}
      </View>
      <View style={styles.location}>
        <MapPinIcon size={17} color={Colors.accent700} />
        <ThemedText type="caption">{label ?? 'Twoja okolica'} · Twoja lokalizacja</ThemedText>
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  lead: { marginTop: 4, fontSize: 15 },
  grid: { flexDirection: 'row', gap: 10, marginTop: 20 },
  card: {
    flex: 1,
    height: 168,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.bg,
    paddingVertical: 16,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  cardPressed: { backgroundColor: Colors.accent100, borderColor: Colors.accent },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accent200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 19 },
  cardHint: { lineHeight: 17, marginTop: 2 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 },
});
