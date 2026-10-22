import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { ToastProvider } from './components/Toast'
import Layout from './components/Layout'
import { Loading } from './components/ui'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import Tasks from './pages/Tasks'
import Parts from './pages/Parts'
import QC from './pages/QC'
import Attendance from './pages/Attendance'
import Messages from './pages/Messages'
import Team from './pages/Team'
import Admin from './pages/Admin'
import Inquiries from './pages/Inquiries'
import Technicians from './pages/Technicians'
import Inventory from './pages/Inventory'
import SiteLayout from './site/SiteLayout'
import Home from './site/Home'
import About from './site/About'
import Services from './site/Services'
import Contact from './site/Contact'
import Track from './site/Track'

function Protected() {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  return user ? <Layout /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="services" element={<Services />} />
              <Route path="track" element={<Track />} />
              <Route path="contact" element={<Contact />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route element={<Protected />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="jobs" element={<Jobs />} />
              <Route path="jobs/:id" element={<JobDetail />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="parts" element={<Parts />} />
              <Route path="qc" element={<QC />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="messages" element={<Messages />} />
              <Route path="team" element={<Team />} />
              <Route path="admin" element={<Admin />} />
              <Route path="inquiries" element={<Inquiries />} />
              <Route path="technicians" element={<Technicians />} />
              <Route path="inventory" element={<Inventory />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
