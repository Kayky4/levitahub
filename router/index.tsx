import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import Dashboard from '../pages/dashboard';
import NotFound from '../pages/not-found/NotFound';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../hooks/useAuth';

// User & Settings
import UserProfile from '../pages/user/UserProfile';

// Phase 2 Pages
import CreateBand from '../pages/band/CreateBand';
import JoinBand from '../pages/band/JoinBand';
import BandDashboard from '../pages/band/BandDashboard';
import BandMembers from '../pages/band/BandMembers';
import EditBand from '../pages/band/EditBand';
import BillingDashboard from '../pages/billing/BillingDashboard';

// Phase 3 Pages (Songs)
import SongList from '../pages/songs/SongList';
import SongCreate from '../pages/songs/SongCreate';
import SongEdit from '../pages/songs/SongEdit';
import SongView from '../pages/songs/SongView';

// Phase 3 Pages (Playlists)
import PlaylistList from '../pages/playlists/PlaylistList';
import PlaylistCreate from '../pages/playlists/PlaylistCreate';
import PlaylistDetail from '../pages/playlists/PlaylistDetail';
import PlaylistEdit from '../pages/playlists/PlaylistEdit';

// Phase 4 Pages (Regency)
import RegencyController from '../pages/regency/RegencyController';
import RegencyViewer from '../pages/regency/RegencyViewer';

// Phase 5 Pages (Billing - Mock)
import MockCheckout from '../pages/billing/MockCheckout';

// Animation variants for smoother transitions
const pageVariants = {
  initial: { opacity: 0, filter: 'blur(8px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(8px)' }
};

// Wrapper for page animation
const PageTransition = ({ children }: { children?: React.ReactNode }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="w-full h-full"
  >
    {children}
  </motion.div>
);

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While checking auth status, we don't render anything to prevent redirect flicker
  if (loading) return null;

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            user ? <Navigate to="/dashboard" replace /> : <PageTransition><Login /></PageTransition>
          }
        />
        <Route
          path="/signup"
          element={
            user ? <Navigate to="/dashboard" replace /> : <PageTransition><Signup /></PageTransition>
          }
        />

        {/* Mock Checkout */}
        <Route
          path="/mock-checkout"
          element={
            <PageTransition>
              <MockCheckout />
            </PageTransition>
          }
        />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />

          {/* User Routes */}
          <Route path="/profile" element={<PageTransition><UserProfile /></PageTransition>} />

          {/* Band Routes */}
          <Route path="/band/create" element={<PageTransition><CreateBand /></PageTransition>} />
          <Route path="/band/join" element={<PageTransition><JoinBand /></PageTransition>} />
          <Route path="/band/:bandId/dashboard" element={<PageTransition><BandDashboard /></PageTransition>} />
          <Route path="/band/:bandId/members" element={<PageTransition><BandMembers /></PageTransition>} />
          <Route path="/band/:bandId/edit" element={<PageTransition><EditBand /></PageTransition>} />
          <Route path="/band/:bandId/billing" element={<PageTransition><BillingDashboard /></PageTransition>} />

          {/* Song Routes */}
          <Route path="/band/:bandId/songs" element={<PageTransition><SongList /></PageTransition>} />
          <Route path="/band/:bandId/songs/create" element={<PageTransition><SongCreate /></PageTransition>} />
          <Route path="/band/:bandId/songs/:songId" element={<PageTransition><SongView /></PageTransition>} />
          <Route path="/band/:bandId/songs/:songId/edit" element={<PageTransition><SongEdit /></PageTransition>} />

          {/* Playlist Routes */}
          <Route path="/band/:bandId/playlists" element={<PageTransition><PlaylistList /></PageTransition>} />
          <Route path="/band/:bandId/playlists/create" element={<PageTransition><PlaylistCreate /></PageTransition>} />
          <Route path="/band/:bandId/playlists/:playlistId" element={<PageTransition><PlaylistDetail /></PageTransition>} />
          <Route path="/band/:bandId/playlists/:playlistId/edit" element={<PageTransition><PlaylistEdit /></PageTransition>} />

          {/* Regency Routes */}
          <Route path="/band/:bandId/regency" element={<PageTransition><RegencyController /></PageTransition>} />
          <Route path="/band/:bandId/regency/playlist/:playlistId" element={<PageTransition><RegencyController /></PageTransition>} />
          <Route path="/band/:bandId/regency/view" element={<PageTransition><RegencyViewer /></PageTransition>} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

export default AppRoutes;