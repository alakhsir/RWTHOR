import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Study } from './pages/Study';
import { Batches } from './pages/Batches';
import { MyBatches } from './pages/MyBatches';
import { BatchDetails } from './pages/BatchDetails';
import { SubjectView } from './pages/SubjectView';
import { ChapterView } from './pages/ChapterView';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CreateBatch } from './pages/admin/CreateBatch';
import { ManageContent } from './pages/admin/ManageContent';

function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Study />} />
          <Route path="/batches" element={<Batches />} />
          <Route path="/my-batches" element={<MyBatches />} />
          <Route path="/batch/:batchId" element={<BatchDetails />} />
          <Route path="/batch/:batchId/subject/:subjectId" element={<SubjectView />} />
          <Route path="/batch/:batchId/subject/:subjectId/chapter/:chapterId" element={<ChapterView />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/create-batch" element={<CreateBatch />} />
          <Route path="/admin/manage-content/:batchId" element={<ManageContent />} />
          
          {/* Fallback routes for demo completeness */}
          <Route path="/telegram" element={<div className="p-10 text-center text-gray-400">Telegram Redirect Mock</div>} />
          <Route path="/contact" element={<div className="p-10 text-center text-gray-400">Contact Form Mock</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;