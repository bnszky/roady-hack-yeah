import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function ReportLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }} />
  );
}
