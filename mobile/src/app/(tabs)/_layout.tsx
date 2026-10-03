import { Tabs } from 'expo-router/js-tabs';
import { useCallback, useState } from 'react';

import { ReportMethodSheet } from '@/components/roady/report-method-sheet';
import { TabBar } from '@/components/roady/tab-bar';
import { ReportSheetContext } from '@/context/report-sheet';

export default function TabsLayout() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const open = useCallback(() => setSheetOpen(true), []);

  return (
    <ReportSheetContext.Provider value={open}>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <TabBar {...props} onReport={open} />}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="activity" />
      </Tabs>
      <ReportMethodSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </ReportSheetContext.Provider>
  );
}
