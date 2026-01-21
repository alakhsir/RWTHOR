import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Layers,
  Send,
  Heart,
  Phone,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Moon,
  User as UserIcon,
  Star,
  ShieldAlert,
  PanelLeftClose,
  PanelLeftOpen,
  Compass
} from 'lucide-react';
import { api } from '../services/api';

interface LayoutProps {
  children?: React.ReactNode;
}

const Sidebar = ({ isOpen, closeMobile, collapsed, toggleCollapsed }: { isOpen: boolean, closeMobile: () => void, collapsed: boolean, toggleCollapsed: () => void }) => {
  const navigate = useNavigate();

  const menuItems = [
    { icon: BookOpen, label: 'Study', path: '/' },
    { icon: Compass, label: 'Explore Batches', path: '/explore' },
    { icon: Layers, label: 'My Batches', path: '/my-batches' },
    { icon: Send, label: 'Join Telegram', path: '/telegram' },
    { icon: Heart, label: 'Donate Batch', path: '/donate' },
    { icon: Phone, label: 'Contact Us', path: '/contact' },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full bg-background/80 backdrop-blur-md border-r border-border z-50 transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${collapsed ? 'w-20' : 'w-64'}
      `}>
        <div className={`flex items-center gap-3 h-16 border-b border-border ${collapsed ? 'justify-center px-0' : 'px-6'}`}>
          {/* Logo Mock */}
          <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg font-serif flex-shrink-0">
            R
          </div>
          {!collapsed && <span className="font-bold text-lg text-foreground tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300">RW Thor</span>}
        </div>

        <nav className="mt-6 px-3 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : ''}
              onClick={closeMobile}
              className={({ isActive }) => `
                flex items-center gap-4 px-3 py-3 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'}
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {!collapsed && <span className="whitespace-nowrap overflow-hidden transition-all duration-300">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse Toggle Button (Desktop Only) */}
        <div className="absolute bottom-4 right-0 left-0 px-3 hidden lg:flex justify-end">
          <button
            onClick={toggleCollapsed}
            className={`p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all ${collapsed ? 'mx-auto' : ''}`}
          >
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>
      </aside>
    </>
  );
};

import { useAuth } from '../contexts/AuthContext';

const Header = ({ toggleSidebar, collapsed }: { toggleSidebar: () => void, collapsed: boolean }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { profile, signOut, user } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = profile?.full_name || user?.phone || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className={`h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-8 fixed top-0 right-0 z-30 transition-all duration-300 left-0 ${collapsed ? 'lg:left-20' : 'lg:left-64'}`}>
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="lg:hidden text-foreground p-2">
          <Menu size={24} />
        </button>

        {!isHome && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium"
          >
            <ChevronLeft size={18} />
            Back
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* User Profile Dropdown */}
        <div className="flex items-center gap-4 pl-4 border-l border-border relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="group flex items-center gap-3 text-left hover:bg-white/5 p-2 rounded-xl transition-all"
          >
            <div className="hidden md:block">
              <p className="text-sm text-foreground font-medium group-hover:text-indigo-400 transition-colors">{displayName}</p>
              <p className="text-xs text-muted-foreground">{profile?.role || 'student'}</p>
            </div>
            <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center text-xs font-bold text-foreground overflow-hidden border border-border group-hover:border-indigo-500/50 transition-colors">
              {initial}
            </div>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute top-full right-0 mt-2 w-48 bg-[#16161a] border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-1">
                  <button
                    onClick={() => { setIsDropdownOpen(false); navigate('/profile'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <UserIcon size={16} />
                    View Profile
                  </button>
                  <div className="h-px bg-white/10 my-1 mx-2" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

import { usePlayer } from '../contexts/PlayerContext';
import { VideoPlayer } from './VideoPlayer';

import { createPortal } from 'react-dom';

const GlobalPlayer = () => {
  const { activeVideo, isMinimized, closeVideo, minimizeVideo, maximizeVideo } = usePlayer();

  if (!activeVideo) return null;

  return createPortal(
    <VideoPlayer
      url={activeVideo.url}
      title={activeVideo.title}
      thumbnailUrl={activeVideo.thumbnailUrl}
      onClose={closeVideo}
      isMinimized={isMinimized}
      onMinimize={minimizeVideo}
      onMaximize={maximizeVideo}
    />,
    document.body
  );
};

export const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background text-white font-sans">
      <Sidebar
        isOpen={sidebarOpen}
        closeMobile={() => setSidebarOpen(false)}
        collapsed={collapsed}
        toggleCollapsed={() => setCollapsed(!collapsed)}
      />
      <Header
        toggleSidebar={() => setSidebarOpen(true)}
        collapsed={collapsed}
      />

      <main className={`pt-16 min-h-screen transition-all duration-300 ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Global Video Player */}
      <GlobalPlayer />
    </div>
  );
};
