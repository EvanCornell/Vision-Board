import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useStore } from './store/useStore';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const VisionBoard = lazy(() => import('./pages/VisionBoard'));
const Goals = lazy(() => import('./pages/Goals'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Documents = lazy(() => import('./pages/Documents'));
const AICoach = lazy(() => import('./pages/AICoach'));
const Manifestation = lazy(() => import('./pages/Manifestation'));
const Settings = lazy(() => import('./pages/Settings'));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

function AppInner() {
  const checkAndUpdateStreak = useStore((s) => s.checkAndUpdateStreak);

  useEffect(() => {
    checkAndUpdateStreak();
  }, [checkAndUpdateStreak]);

  return (
    <div className="dark">
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="vision" element={<VisionBoard />} />
            <Route path="goals" element={<Goals />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="documents" element={<Documents />} />
            <Route path="ai" element={<AICoach />} />
            <Route path="manifestation" element={<Manifestation />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
