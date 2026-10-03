import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  BellIcon,
  CloudCheckIcon,
  CloudSlashIcon,
  EyeSlashIcon,
  SignOutIcon,
  TranslateIcon,
  type Icon,
} from 'phosphor-react-native';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { healthApi } from '@/api/health';
import { CategoryDisc } from '@/components/roady/markers';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useMyReports } from '@/hooks/use-my-reports';
import { API_URL } from '@/lib/env';
import { ago, countLabel } from '@/lib/format';

function SettingRow({
  icon: IconCmp,
  label,
  children,
  onPress,
  color = Colors.text,
}: {
  icon: Icon;
  label: string;
  children?: ReactNode;
  onPress?: () => void;
  color?: string;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.settingRow}>
      <IconCmp size={22} color={color === Colors.text ? Colors.neutral700 : color} />
      <ThemedText type="body" style={[styles.flex, { color }]}>
        {label}
      </ThemedText>
      {children}
    </Pressable>
  );
}

export default function ActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const mine = useMyReports();
  const health = useQuery({ queryKey: ['health'], queryFn: healthApi.get, retry: 0 });
  // Local-only preferences until the backend supports them.
  const [notifications, setNotifications] = useState(true);
  const [anonymous, setAnonymous] = useState(false);

  const email = session?.user.email ?? null;
  const displayName = email ? email.split('@')[0] : 'Gość';
  const initials = displayName.slice(0, 2).toUpperCase();
  const confirmations = mine.problems.reduce((s, p) => s + p.confirmations_count, 0);

  const switchColors = { false: Colors.neutral400, true: Colors.accent };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <ThemedText type="title" style={styles.avatarText}>
            {initials}
          </ThemedText>
        </View>
        <View style={styles.flex}>
          <ThemedText type="title" style={styles.name}>
            {displayName}
          </ThemedText>
          <ThemedText type="small" themeColor="neutral700">
            {countLabel(mine.problems.length, 'zgłoszenie', 'zgłoszenia', 'zgłoszeń')},{' '}
            {countLabel(confirmations, 'potwierdzenie', 'potwierdzenia', 'potwierdzeń')}
          </ThemedText>
        </View>
      </View>

      <ThemedText type="heading" style={styles.section}>
        Moje zgłoszenia
      </ThemedText>
      <View style={styles.list}>
        {mine.isPending ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 16 }} />
        ) : mine.problems.length === 0 ? (
          <ThemedText type="body" themeColor="neutral700" style={{ paddingVertical: 8 }}>
            Nie masz jeszcze zgłoszeń. Użyj „Zgłoś”, aby dodać pierwsze.
          </ThemedText>
        ) : (
          mine.problems.map((p) => {
            const resolved = p.status === 'resolved' || !p.is_observable;
            return (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/problem/${p.id}`)}
                style={({ pressed }) => [styles.reportRow, pressed && { opacity: 0.7 }]}
              >
                <CategoryDisc icon={p.category.icon} tier="neutral" size={44} />
                <View style={styles.flex}>
                  <ThemedText type="body" numberOfLines={1}>
                    {p.category.name}
                  </ThemedText>
                  <ThemedText type="caption" numberOfLines={1}>
                    {ago(p.first_reported_at)} ·{' '}
                    {countLabel(
                      p.confirmations_count,
                      'potwierdzenie',
                      'potwierdzenia',
                      'potwierdzeń',
                    )}
                  </ThemedText>
                </View>
                <View style={[styles.tag, resolved ? styles.tagNeutral : styles.tagAccent]}>
                  <ThemedText
                    type="caption"
                    style={{ fontSize: 11, color: resolved ? Colors.neutral800 : Colors.accent800 }}
                  >
                    {resolved ? 'Rozwiązane' : 'Aktywne'}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      <ThemedText type="heading" style={styles.section}>
        Ustawienia
      </ThemedText>
      <View style={styles.list}>
        <SettingRow icon={BellIcon} label="Powiadomienia w okolicy">
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={switchColors}
            thumbColor={Colors.neutral100}
          />
        </SettingRow>
        <SettingRow icon={EyeSlashIcon} label="Zgłaszaj anonimowo">
          <Switch
            value={anonymous}
            onValueChange={setAnonymous}
            trackColor={switchColors}
            thumbColor={Colors.neutral100}
          />
        </SettingRow>
        <SettingRow icon={TranslateIcon} label="Język">
          <ThemedText type="body" themeColor="neutral700">
            Polski
          </ThemedText>
        </SettingRow>
        <Pressable onPress={() => health.refetch()} style={styles.serverRow}>
          {health.isSuccess ? (
            <CloudCheckIcon size={22} color={Colors.accent700} />
          ) : (
            <CloudSlashIcon size={22} color={Colors.accent2_700} />
          )}
          <View style={styles.flex}>
            <ThemedText type="body">
              Serwer:{' '}
              {health.isFetching
                ? 'sprawdzam…'
                : health.isSuccess
                  ? 'połączono'
                  : 'brak połączenia'}
            </ThemedText>
            <ThemedText type="caption" numberOfLines={2}>
              {API_URL}
              {health.isError ? ` · ${health.error.message}` : ''}
            </ThemedText>
          </View>
        </Pressable>
        {session && (
          <SettingRow
            icon={SignOutIcon}
            label="Wyloguj się"
            color={Colors.accent2_700}
            onPress={signOut}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 22, paddingBottom: 32 },
  flex: { flex: 1, minWidth: 0 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.accent200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, color: Colors.accent800 },
  name: { fontSize: 24, lineHeight: 27 },
  section: { marginTop: 32 },
  list: { marginTop: 8 },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 64,
    paddingVertical: 8,
  },
  tag: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 2 },
  tagAccent: { backgroundColor: Colors.accent100 },
  tagNeutral: { backgroundColor: Colors.neutral100 },
  serverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 64,
    paddingVertical: 8,
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 56 },
});
