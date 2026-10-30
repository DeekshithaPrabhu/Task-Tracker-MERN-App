import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout.jsx';
import Dashboard from '@/pages/Dashboard.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
