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
  Moon,
  User as UserIcon,
  Star,
  ShieldAlert
} from 'lucide-react';
import { currentUser } from '../services/mockData';

interface LayoutProps {
  children?: React.ReactNode;
}

const Sidebar = ({ isOpen, closeMobile }: { isOpen: boolean, closeMobile: () => void }) => {
  const navigate = useNavigate();

  const menuItems = [
    { icon: BookOpen, label: 'Study', path: '/' },
    { icon: Layers, label: 'Batches', path: '/batches' },
    { icon: Layers, label: 'My Batches', path: '/my-batches' }, 
    { icon: ShieldAlert, label: 'Admin Panel', path: '/admin' }, // Added Admin Link
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
        fixed top-0 left-0 h-full w-64 bg-background border-r border-border z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 px-6 h-16 border-b border-border">
           {/* Logo Mock */}
           <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg font-serif">
             P
           </div>
           <span className="font-bold text-lg text-white tracking-wide">EDTECH PRO</span>
        </div>

        <nav className="mt-6 px-4 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeMobile}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                ${isActive 
                  ? 'bg-white text-black' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'}
              `}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

const Header = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 lg:px-8 fixed top-0 right-0 left-0 lg:left-64 z-30">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="lg:hidden text-white p-2">
          <Menu size={24} />
        </button>
        
        {!isHome && (
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-gray-300 hover:text-white text-sm font-medium"
          >
            <ChevronLeft size={18} />
            Back
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* XP Badge */}
        <div className="hidden sm:flex items-center gap-2 bg-[#2a2618] border border-[#554a1a] px-3 py-1.5 rounded-full">
          <Star size={14} className="text-accent fill-accent" />
          <span className="text-accent text-xs font-bold">{currentUser.xp} XP</span>
        </div>

        {/* Theme Toggle (Mock) */}
        <button className="text-gray-400 hover:text-white">
          <Moon size={20} />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right hidden md:block">
            <p className="text-sm text-white font-medium">Hi, {currentUser.name}</p>
          </div>
          <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-300">
            {currentUser.avatar}
          </div>
        </div>
      </div>
    </header>
  );
};

export const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-white font-sans">
      <Sidebar isOpen={sidebarOpen} closeMobile={() => setSidebarOpen(false)} />
      <Header toggleSidebar={() => setSidebarOpen(true)} />
      
      <main className="pt-16 lg:pl-64 min-h-screen">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};