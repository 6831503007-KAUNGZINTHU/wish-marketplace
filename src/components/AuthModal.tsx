import React, { useState, useRef } from 'react';
import { User } from '../types';
import { 
  X, Lock, Mail, User as UserIcon, ArrowLeftRight, 
  CheckCircle2, Sparkles, ArrowRight, ShieldCheck, ShoppingBag,
  AlertCircle, Camera, Trash2 
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { validateAvatarFile, processAvatarFile } from '../utils/imageUtils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginUser: (user: User) => void;
  allUsers: Record<string, User>;
  onRegisterUser: (name: string, email: string, avatarUrl?: string) => User;
  onContinueAsGuest?: () => void;
  isInitialScreen?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginUser,
  allUsers,
  onRegisterUser,
  onContinueAsGuest,
  isInitialScreen = false,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (tab === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }
      if (!password || password.length < 4) {
        setError('Password must be at least 4 characters');
        return;
      }

      const created = onRegisterUser(name.trim(), normalizedEmail, avatarPreview || undefined);
      onClose();
    } else {
      if (!email.trim()) {
        setError('Please enter your email');
        return;
      }

      const found = Object.values(allUsers).find(
        (u) => u.email.trim().toLowerCase() === normalizedEmail
      );

      if (found) {
        onLoginUser(found);
        onClose();
      } else {
        const fallbackUser: User = {
          id: `user-${Date.now()}`,
          name: email.split('@')[0],
          email: normalizedEmail,
          avatar: '',
          rating: 5.0,
          reviewCount: 0,
          verified: true,
          joinedDate: 'Just now',
          warningCount: 0,
          warnings: [],
        };
        onLoginUser(fallbackUser);
        onClose();
      }
    }
  };

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    const validationError = validateAvatarFile(file);
    if (validationError) {
      setAvatarError(validationError);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsProcessingAvatar(true);
      const dataUrl = await processAvatarFile(file);
      setAvatarPreview(dataUrl);
    } catch (err: any) {
      setAvatarError(err.message || 'Failed to process avatar image');
    } finally {
      setIsProcessingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleQuickLogin = (userId: string) => {
    const u = allUsers[userId];
    if (u) {
      onLoginUser(u);
      onClose();
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in ${
      isInitialScreen ? 'bg-slate-900/80' : ''
    }`}>
      <div className="bg-white dark:bg-[#111827] text-[#263244] dark:text-slate-100 w-full max-w-md rounded-2xl shadow-card-hover border border-[#E0E7F0] dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-[#243B64] dark:bg-slate-900 text-white relative border-b border-white/10">
          {!isInitialScreen && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4F86D9] flex items-center justify-center text-white shadow-soft">
              <ArrowLeftRight className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight">WishMarket</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#4F86D9]/25 text-sky-200 border border-[#4F86D9]/40">
                  Reverse Shopping
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {tab === 'login' ? 'Sign in to post wishes or submit offers' : 'Create an account to start buying and selling'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 bg-[#F7F9FC] dark:bg-slate-800/60 border-b border-[#E0E7F0] dark:border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`py-2 rounded-xl transition cursor-pointer ${
              tab === 'login' ? 'bg-white dark:bg-slate-900 text-[#263244] dark:text-white shadow-soft' : 'text-[#5B6B82] dark:text-slate-400 hover:text-[#263244] dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`py-2 rounded-xl transition cursor-pointer ${
              tab === 'register' ? 'bg-white dark:bg-slate-900 text-[#263244] dark:text-white shadow-soft' : 'text-[#5B6B82] dark:text-slate-400 hover:text-[#263244] dark:hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Quick 1-Click Sign In */}
        <div className="px-5 pt-4">
          <p className="text-[11px] font-semibold text-[#5B6B82] dark:text-slate-400 uppercase tracking-wider mb-2">
            Quick Demo Accounts:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('user-sarah')}
              className="p-2 rounded-xl border border-[#E0E7F0] dark:border-slate-700 hover:border-[#4F86D9] bg-[#F7F9FC] dark:bg-slate-800/50 hover:bg-[#EDF4FF]/50 dark:hover:bg-slate-800 transition text-left cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <UserAvatar
                  user={allUsers['user-sarah']}
                  size="xs"
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="text-xs font-bold text-[#263244] dark:text-white group-hover:text-[#4F86D9] dark:group-hover:text-sky-400 truncate">
                  Sarah
                </span>
              </div>
              <span className="text-[10px] text-[#5B6B82] dark:text-slate-400 block">Buyer</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('user-alex')}
              className="p-2 rounded-xl border border-[#E0E7F0] dark:border-slate-700 hover:border-[#4F86D9] bg-[#F7F9FC] dark:bg-slate-800/50 hover:bg-[#EDF4FF]/50 dark:hover:bg-slate-800 transition text-left cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <UserAvatar
                  user={allUsers['user-alex']}
                  size="xs"
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="text-xs font-bold text-[#263244] dark:text-white group-hover:text-[#4F86D9] dark:group-hover:text-sky-400 truncate">
                  Alex
                </span>
              </div>
              <span className="text-[10px] text-[#5B6B82] dark:text-slate-400 block">Seller</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('user-admin')}
              className="p-2 rounded-xl border border-purple-200 dark:border-purple-800/60 hover:border-purple-400 bg-purple-50/40 dark:bg-purple-950/30 hover:bg-purple-50 dark:hover:bg-purple-900/40 transition text-left cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <UserAvatar
                  user={allUsers['user-admin']}
                  size="xs"
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="text-xs font-bold text-purple-900 dark:text-purple-200 group-hover:text-purple-700 truncate">
                  Admin
                </span>
              </div>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold block">Moderator</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="px-5 my-3 flex items-center gap-2">
          <div className="h-px flex-1 bg-[#E0E7F0] dark:bg-slate-800" />
          <span className="text-[10px] uppercase font-bold text-[#5B6B82] dark:text-slate-400 tracking-wider">
            Or continue with email
          </span>
          <div className="h-px flex-1 bg-[#E0E7F0] dark:bg-slate-800" />
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3.5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-rose-950/50 border border-red-200 dark:border-rose-800 rounded-xl text-xs text-red-700 dark:text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'register' && (
            <>
              {/* Profile Avatar Upload */}
              <div className="p-3 rounded-2xl bg-[#F7F9FC] dark:bg-slate-800/40 border border-[#E0E7F0] dark:border-slate-700/80 space-y-2">
                <label className="block text-xs font-semibold text-[#263244] dark:text-white">
                  Profile Photo (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl border border-[#E0E7F0] dark:border-slate-700 overflow-hidden bg-white dark:bg-[#0B0F19] shrink-0 flex items-center justify-center shadow-soft">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-6 h-6 text-[#5B6B82] dark:text-slate-400" />
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarFileSelect}
                    className="hidden"
                  />

                  <div className="flex-1">
                    {avatarPreview ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-[#E0E7F0] dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#263244] dark:text-white cursor-pointer"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-[#E0E7F0] dark:border-slate-700 hover:bg-[#EDF4FF] dark:hover:bg-slate-800 hover:text-[#3568B5] dark:hover:text-sky-300 text-[#263244] dark:text-white shadow-soft flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5 text-[#4F86D9] dark:text-sky-400" />
                          <span>Upload Photo</span>
                        </button>
                        <p className="text-[10px] text-[#5B6B82] dark:text-slate-400">
                          JPG, PNG, WebP only. Max 5MB.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {avatarError && (
                  <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-[11px] flex items-center gap-1.5 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{avatarError}</span>
                  </div>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-[#263244] dark:text-white mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#5B6B82] dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name (e.g. Sarah Jenkins)"
                    className="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E0E7F0] dark:border-slate-700 bg-white dark:bg-[#0B0F19] focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 outline-none transition text-[#263244] dark:text-white"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#263244] dark:text-white mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#5B6B82] dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E0E7F0] dark:border-slate-700 bg-white dark:bg-[#0B0F19] focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 outline-none transition text-[#263244] dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#263244] dark:text-white mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#5B6B82] dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E0E7F0] dark:border-slate-700 bg-white dark:bg-[#0B0F19] focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 outline-none transition text-[#263244] dark:text-white"
              />
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#4F86D9] hover:bg-[#3568B5] active:bg-[#243B64] text-white text-xs sm:text-sm font-semibold shadow-soft transition cursor-pointer"
            >
              {tab === 'register' ? 'Create Free Account' : 'Sign In'}
            </button>
          </div>

          {onContinueAsGuest && (
            <div className="pt-2 text-center border-t border-[#E0E7F0] dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  onContinueAsGuest();
                  onClose();
                }}
                className="text-xs text-[#5B6B82] dark:text-slate-400 hover:text-[#4F86D9] dark:hover:text-sky-400 font-medium transition cursor-pointer"
              >
                Continue as Guest (Browse Only) →
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
