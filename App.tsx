import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Study } from './pages/Study';
import { MyBatches } from './pages/MyBatches';
import { BatchDetails } from './pages/BatchDetails';
import { SubjectView } from './pages/SubjectView';
import { ChapterView } from './pages/ChapterView';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CreateBatch } from './pages/admin/CreateBatch';
import { ManageContent } from './pages/admin/ManageContent';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ProfilePage } from './pages/ProfilePage';
import { ExploreBatches } from './pages/ExploreBatches';
import { PlayerProvider } from './contexts/PlayerContext';


const AuthenticatedRoutes = () => {
  return (
    <PlayerProvider>
      <ProtectedRoute>
        <Layout>
          <Routes>
            <Route path="/" element={<Study />} />
            <Route path="/explore" element={<ExploreBatches />} />
            <Route path="/my-batches" element={<MyBatches />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/batch/:batchId" element={<BatchDetails />} />
            <Route path="/batch/:batchId/subject/:subjectId" element={<SubjectView />} />
            <Route path="/batch/:batchId/subject/:subjectId/chapter/:chapterId" element={<ChapterView />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/create-batch" element={<CreateBatch />} />
            <Route path="/admin/manage-content/:batchId" element={<ManageContent />} />

            {/* Other routes */}
            <Route path="/telegram" element={<div className="p-10 text-center text-gray-400">Telegram Redirect Mock</div>} />
            <Route path="/contact" element={<div className="p-10 text-center text-gray-400">Contact Form Mock</div>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </ProtectedRoute>
    </PlayerProvider>
  );
};

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          {/* Wrap all other routes in ProtectedRoute */}
          <Route path="/*" element={<AuthenticatedRoutes />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;