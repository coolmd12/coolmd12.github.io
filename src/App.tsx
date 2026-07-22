import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SiteFooter, SiteHeader } from './components/layout/SiteChrome';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClassroomPage } from './pages/ClassroomPage';
import { ConferencesPage } from './pages/ConferencesPage';
import { PracticePage } from './pages/PracticePage';
import { SetupPage } from './pages/SetupPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-frame">
          <SiteHeader />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/conferences" element={<ConferencesPage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/classroom/:classroomId" element={<ClassroomPage />} />
            </Route>
          </Routes>
          <SiteFooter />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
