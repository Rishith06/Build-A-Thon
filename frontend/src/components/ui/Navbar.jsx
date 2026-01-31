import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from './Button';

const Navbar = () => {
  const location = useLocation();
  const isLoggedIn = localStorage.getItem('access_token'); // Simple check for now

  // In a real app, use a context or global state for auth
  // For now, we'll rely on what's likely there or a simple prop if we passed it.
  // Actually, let's just create a static-ish navbar that conditionally shows things.
  
  const isActive = (path) => {
    return location.pathname === path ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-white';
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  };

  return (
    <nav className="glass-panel sticky top-0 z-50 border-b border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold tracking-tighter hover:opacity-80 transition-opacity">
          HACK<span className="text-[var(--primary)]">ATHON</span><span className="text-[var(--secondary)]">2K26</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className={`text-sm font-medium transition-colors ${isActive('/')}`}>
            Home
          </Link>
          <Link to="/dashboard" className={`text-sm font-medium transition-colors ${isActive('/dashboard')}`}>
            Dashboard
          </Link>
          {isLoggedIn ? (
             <Button variant="ghost" onClick={handleLogout} className="!py-2 !px-4">Logout</Button>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="!py-2 !px-4">Login</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" className="!py-2 !px-4">Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
