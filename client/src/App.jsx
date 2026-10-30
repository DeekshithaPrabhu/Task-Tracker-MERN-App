import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout.jsx';
import Dashboard from '@/pages/Dashboard.jsx';
import Board from '@/pages/Board.jsx';
import Tasks from '@/pages/Tasks.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="board" element={<Board />} />
        <Route path="tasks" element={<Tasks />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
