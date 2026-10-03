import { createContext, useContext } from 'react';

export const ReportSheetContext = createContext<() => void>(() => {});

/** Opens the "Co się dzieje?" sheet from any tab (tab bar, map FAB). */
export function useOpenReportSheet() {
  return useContext(ReportSheetContext);
}
