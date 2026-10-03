import {
  SourceSerif4_400Regular,
  SourceSerif4_400Regular_Italic,
  SourceSerif4_600SemiBold,
  useFonts,
} from '@expo-google-fonts/source-serif-4';
import { QueryClientProvider } from '@tanstack/react-query';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { IconContext } from 'phosphor-react-native';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { initMapbox } from '@/components/roady/map';
import { Colors } from '@/constants/theme';
import { ReportDraftProvider } from '@/context/report-draft';
import { queryClient } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync();
initMapbox();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.bg,
    primary: Colors.accent,
    text: Colors.text,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SourceSerif4_400Regular,
    SourceSerif4_400Regular_Italic,
    SourceSerif4_600SemiBold,
  });
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={navigationTheme}>
        <QueryClientProvider client={queryClient}>
          <IconContext.Provider value={{ weight: 'duotone', color: Colors.text }}>
            <ReportDraftProvider>
              <Stack
                screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="problem/[id]" />
                <Stack.Screen
                  name="report"
                  options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
                />
              </Stack>
              <StatusBar style="dark" />
            </ReportDraftProvider>
          </IconContext.Provider>
        </QueryClientProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
