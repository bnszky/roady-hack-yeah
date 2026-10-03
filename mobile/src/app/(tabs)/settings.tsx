import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { API_URL, env } from '@/lib/env';
import { useAuth } from '@/hooks/use-auth';

export default function SettingsScreen() {
  const { session, loading, signIn, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setAuthError(null);
    const { error } = await signIn(email, password);
    if (error) setAuthError(error.message);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Settings
      </ThemedText>

      <ThemedView type="backgroundElement" style={styles.section}>
        <ThemedText type="smallBold">Backend</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {API_URL}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Supabase: {env.supabaseUrl || 'not configured'}
        </ThemedText>
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.section}>
        <ThemedText type="smallBold">Auth</ThemedText>
        {loading ? (
          <ThemedText type="small">Loading session…</ThemedText>
        ) : session ? (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              Signed in as {session.user.email}
            </ThemedText>
            <Pressable onPress={handleSignOut} style={({ pressed }) => pressed && styles.pressed}>
              <ThemedText type="linkPrimary">Sign out</ThemedText>
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#888"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Pressable onPress={handleSignIn} style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundSelected" style={styles.button}>
                <ThemedText type="smallBold">Sign in</ThemedText>
              </ThemedView>
            </Pressable>
            {authError && (
              <ThemedText type="small" style={styles.error}>
                {authError}
              </ThemedText>
            )}
          </>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    marginTop: Spacing.two,
  },
  section: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#999',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    color: '#000',
  },
  button: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  error: {
    color: '#d13438',
  },
});
