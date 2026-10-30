import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext.jsx';
import { Protected, Guest } from '@/routes/guards.jsx';
import Layout from '@/components/layout/Layout.jsx';
import Login from '@/pages/auth/Login.jsx';
import Register from '@/pages/auth/Register.jsx';
import ForgotPassword from '@/pages/auth/ForgotPassword.jsx';
import ResetPassword from '@/pages/auth/ResetPassword.jsx';
import Dashboard from '@/pages/Dashboard.jsx';
import Board from '@/pages/Board.jsx';
import Tasks from '@/pages/Tasks.jsx';
import Profile from '@/pages/Profile.jsx';
import NotFound from '@/pages/NotFound.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Guest><Login /></Guest>} />
        <Route path="/register" element={<Guest><Register /></Guest>} />
        <Route path="/forgot-password" element={<Guest><ForgotPassword /></Guest>} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route element={<Protected><Layout /></Protected>}>
          <Route index element={<Dashboard />} />
          <Route path="board" element={<Board />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
