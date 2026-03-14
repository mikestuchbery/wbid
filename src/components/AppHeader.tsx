import React from 'react';
import { motion, AnimatePresence } from "motion/react";
import { Compass, LogIn, LogOut } from 'lucide-react';
import { User } from 'firebase/auth';

interface AppHeaderProps {
  isCameraActive: boolean;
  user: User | null;
  login: () => void;
  logout: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ isCameraActive, user, login, logout }) => {
  return (
    <AnimatePresence>
      {!isCameraActive && (
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          className="p-6 md:p-8 flex justify-between items-center bg-brand-bg/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center text-brand-bg shadow-[0_0_15px_rgba(212,175,55,0.4)]">
              <Compass className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tighter uppercase leading-none glow-text">WBID?</h1>
              <p className="text-[8px] uppercase tracking-widest opacity-40 font-bold">Welche Burg ist das?</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent">Explorer</p>
                  <p className="text-[8px] opacity-50 truncate max-w-[100px]">{user.displayName || user.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="flex items-center gap-2 px-4 py-2 bg-brand-accent text-brand-bg rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-transform"
              >
                <LogIn className="w-4 h-4" />
                Login
              </button>
            )}
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
};
