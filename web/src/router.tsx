import { createBrowserRouter } from 'react-router';

import { AppLayout } from '@/components/app-layout';
import { CategoriesPage } from '@/pages/categories-page';
import { DashboardPage } from '@/pages/dashboard-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { ProblemDetailPage } from '@/pages/problem-detail-page';
import { ProblemsPage } from '@/pages/problems-page';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'problems', element: <ProblemsPage /> },
      { path: 'problems/:problemId', element: <ProblemDetailPage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
