import React from 'react';
import {
  Radar,
  Database,
  History,
  ShieldBan,
  Activity,
  Sparkles,
  LogIn,
  LogOut,
  User,
  CheckCircle2,
} from 'lucide-react';
import { auth, googleProvider, signInWithPopup, fbSignOut } from '../lib/firebase';
import { FirebaseUser } from '../lib/firebase';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: FirebaseUser | null;
  authLoading: boolean;
  totalLeadsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  authLoading,
  totalLeadsCount,
}) => {
  const [signingIn, setSigningIn] = React.useState(false);

  const handleGoogleSignIn = async () => {
    if (signingIn) return;
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string };
      // User closed the popup window deliberately or another popup was active
      if (
        authErr?.code === 'auth/popup-closed-by-user' ||
        authErr?.code === 'auth/cancelled-popup-request' ||
        authErr?.message?.includes('popup-closed-by-user') ||
        authErr?.message?.includes('cancelled-popup-request')
      ) {
        // Normal user action - silently return without throwing an error
        return;
      }
      console.warn('Google sign-in was not completed:', authErr?.message || err);
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (err: unknown) {
      const authErr = err as { message?: string };
      console.warn('Sign-out notice:', authErr?.message || err);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Radar },
    { id: 'generate', label: 'Generate Leads', icon: Sparkles },
    {
      id: 'database',
      label: 'Leads Database',
      icon: Database,
      badge: totalLeadsCount > 0 ? String(totalLeadsCount) : undefined,
    },
    { id: 'history', label: 'Run History', icon: History },
    { id: 'suppression', label: 'Suppression', icon: ShieldBan },
    { id: 'diagnostics', label: 'Diagnostics', icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/20">
            <Radar className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white font-['Plus_Jakarta_Sans']">
                LeadPulse <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">AI</span>
              </span>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                Production Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Zero-Fabrication B2B Lead Intelligence
            </p>
          </div>
        </div>

        {/* Nav Tabs */}
        <nav className="hidden lg:flex items-center gap-1 rounded-xl bg-slate-900/80 p-1 border border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-1 rounded-full bg-blue-900/80 px-1.5 py-0.2 text-[10px] font-bold text-blue-200 border border-blue-700/50">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Auth Section */}
        <div className="flex items-center gap-3">
          {authLoading ? (
            <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-800" />
          ) : currentUser ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="h-6 w-6 rounded-full ring-1 ring-blue-500/40"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-slate-300">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-medium text-slate-200 max-w-[120px] truncate">
                    {currentUser.displayName || currentUser.email}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    <span>Isolated Workspace</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className={`flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition-all ${
                signingIn ? 'opacity-70 cursor-wait' : 'hover:bg-blue-500 cursor-pointer'
              }`}
            >
              <LogIn className={`h-4 w-4 ${signingIn ? 'animate-spin' : ''}`} />
              <span>{signingIn ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile sub-nav */}
      <div className="flex lg:hidden overflow-x-auto border-t border-slate-800/80 bg-slate-950 px-2 py-1.5 gap-1 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="rounded-full bg-blue-900/60 px-1 text-[10px] text-blue-300">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
