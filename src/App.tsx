import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SiteFooter, SiteHeader } from './components/layout/SiteChrome';
import { rememberLastAppPath } from './lib/navigation';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClassroomPage } from './pages/ClassroomPage';
import { ConferencesPage } from './pages/ConferencesPage';
import { PracticePage } from './pages/PracticePage';
import { SetupPage } from './pages/SetupPage';
import { ProfilePage } from './pages/ProfilePage';
import { WelcomeSetupPage } from './pages/WelcomeSetupPage';
import { ChooseUsernamePage } from './pages/ChooseUsernamePage';
import CommitteeRoomPage from './pages/CommitteeRoomPage';
import RoomsPage from './pages/RoomsPage';
import { AdminStatsPage } from './pages/AdminStatsPage';
import { FamilyPage } from './pages/FamilyPage';
import { ProgressPage } from './pages/ProgressPage';
import { MotionsPage } from './pages/MotionsPage';
import { TermsAndConditionsPage } from './pages/TermsAndConditionsPage';

function LastPathTracker() {
  const location = useLocation();
  useEffect(() => {
    rememberLastAppPath(location.pathname, location.search);
  }, [location.pathname, location.search]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-frame">
          <LastPathTracker />
          <SiteHeader />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/conferences" element={<ConferencesPage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/choose-username" element={<ChooseUsernamePage />} />
              <Route path="/welcome" element={<WelcomeSetupPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/motions" element={<MotionsPage />} />
              <Route path="/family" element={<FamilyPage />} />
              <Route path="/admin" element={<AdminStatsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/classroom/:classroomId" element={<ClassroomPage />} />
              <Route path="/room/:roomId" element={<CommitteeRoomPage />} />
            </Route>
          </Routes>
          <SiteFooter />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
