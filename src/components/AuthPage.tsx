import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { 
  X, Lock, Mail, User as UserIcon, ArrowLeftRight, 
  CheckCircle2, Sparkles, ArrowRight, ShieldCheck, ShoppingBag,
  AlertCircle, Camera, Trash2, Eye, EyeOff, KeyRound, 
  ArrowLeft, Clock, Check, HelpCircle, RefreshCw
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { validateAvatarFile, processAvatarFile } from '../utils/imageUtils';
import { SocialAuthModal } from './SocialAuthModal';

export type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password';

interface AuthPageProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  allUsers: Record<string, User>;
  onLoginUser: (user: User) => void;
  onRegisterUser: (name: string, email: string, password?: string, avatarUrl?: string) => User;
  onUpdateUserPassword?: (email: string, newPassword: string) => boolean;
  onContinueAsGuest?: () => void;
  initialMode?: AuthMode;
  intendedActionMessage?: string | null;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  onLoginUser,
  onRegisterUser,
  onUpdateUserPassword,
  onContinueAsGuest,
  initialMode = 'login',
  intendedActionMessage,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  
  // Password Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Avatar Upload (Register)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status & Feedback
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Forgot Password Flow
  const [forgotEmailSent, setForgotEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [simulatedResetToken, setSimulatedResetToken] = useState<string | null>(null);
  const [resetTargetEmail, setResetTargetEmail] = useState<string>('');

  // Social Auth Notice Modal
  const [socialModalProvider, setSocialModalProvider] = useState<'Google' | 'Apple' | 'Facebook' | null>(null);

  // Sync mode with initialMode prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccessBanner(null);
      setForgotEmailSent(false);
    }
  }, [isOpen, initialMode]);

  // Rate-limiting resend countdown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Validation Helpers
  const isValidEmail = (str: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
  const hasMinLength = password.length >= 8;
  const hasLetterAndNumber = /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Avatar handling
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

  // Quick Demo Account Login
  const handleQuickLogin = (userId: string) => {
    const user = allUsers[userId];
    if (user) {
      setIsLoading(true);
      setTimeout(() => {
        onLoginUser(user);
        setIsLoading(false);
        onClose();
      }, 300);
    }
  };

  // LOGIN SUBMIT
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normEmail = email.trim().toLowerCase();
    if (!normEmail) {
      setError('Please enter your email address');
      return;
    }
    if (!isValidEmail(normEmail)) {
      setError('Please enter a valid email address (e.g. name@example.com)');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Find matching user in user store
      const found = Object.values(allUsers).find(
        (u) => u.email.trim().toLowerCase() === normEmail
      );

      if (found) {
        // If user has a registered password, check it
        if (found.password && found.password !== password) {
          setError('Incorrect password. For demo accounts (Sarah, Alex, Admin), password is "password123".');
          setIsLoading(false);
          return;
        }

        onLoginUser(found);
        setIsLoading(false);
        onClose();
      } else {
        // Fallback registered user
        const newUser: User = {
          id: `user-${Date.now()}`,
          name: normEmail.split('@')[0],
          email: normEmail,
          password: password,
          avatar: '',
          rating: 5.0,
          reviewCount: 0,
          verified: true,
          joinedDate: 'Just now',
          warningCount: 0,
          warnings: [],
        };
        onLoginUser(newUser);
        setIsLoading(false);
        onClose();
      }
    }, 400);
  };

  // REGISTER SUBMIT
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normEmail = email.trim().toLowerCase();
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!normEmail || !isValidEmail(normEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!hasMinLength) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (!hasLetterAndNumber) {
      setError('Password must contain at least one letter and one number');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Check if email already registered
    const existing = Object.values(allUsers).find(
      (u) => u.email.trim().toLowerCase() === normEmail
    );
    if (existing) {
      setError('An account with this email already exists. Please log in instead.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const created = onRegisterUser(name.trim(), normEmail, password, avatarPreview || undefined);
      setIsLoading(false);
      onClose();
    }, 450);
  };

  // FORGOT PASSWORD SUBMIT
  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normEmail = email.trim().toLowerCase();
    if (!normEmail || !isValidEmail(normEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setForgotEmailSent(true);
      setResendCooldown(60);
      setResetTargetEmail(normEmail);

      // Generate a simulated secure token for testing password recovery
      const testToken = `rst_${Math.random().toString(36).substring(2, 10)}`;
      setSimulatedResetToken(testToken);
    }, 500);
  };

  // RESET PASSWORD SUBMIT
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasMinLength) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (!hasLetterAndNumber) {
      setError('Password must contain at least one letter and one number');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      if (onUpdateUserPassword && resetTargetEmail) {
        onUpdateUserPassword(resetTargetEmail, password);
      }

      setSuccessBanner('Password successfully updated! You can now log in with your new password.');
      setMode('login');
      setPassword('');
      setConfirmPassword('');
      setEmail(resetTargetEmail);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      {/* Social Auth Setup Modal */}
      <SocialAuthModal
        isOpen={!!socialModalProvider}
        onClose={() => setSocialModalProvider(null)}
        provider={socialModalProvider}
      />

      <div 
        className="bg-white dark:bg-[#111827] w-full max-w-md rounded-2xl shadow-card-hover border border-[#E0E7F0] dark:border-slate-800 overflow-hidden flex flex-col my-auto transition-all animate-in zoom-in-95 duration-200 text-[#263244] dark:text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Brand Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#1A2B49] via-[#243B64] to-[#1A2B49] text-white relative border-b border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Close authentication dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4F86D9] flex items-center justify-center text-white shadow-soft shrink-0">
              <ArrowLeftRight className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-black tracking-tight text-white">Wish<span className="text-[#7CC4FA]">Market</span></span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#4F86D9]/30 text-sky-100 border border-[#7CC4FA]/40">
                  Reverse Marketplace
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5">
                {mode === 'login' && 'Where buyers post demand & sellers submit direct offers'}
                {mode === 'register' && 'Create your account to start buying and selling'}
                {mode === 'forgot-password' && 'Account recovery & password reset'}
                {mode === 'reset-password' && 'Securely set your new account password'}
              </p>
            </div>
          </div>
        </div>

        {/* Intended Action Alert (e.g. When prompted because user clicked Post a Wish or Make an Offer) */}
        {intendedActionMessage && (
          <div className="mx-5 sm:mx-6 mt-4 p-3 rounded-xl bg-[#EDF4FF] dark:bg-sky-950/50 border border-[#4F86D9]/40 dark:border-sky-800 text-xs text-[#1E293B] dark:text-sky-100 flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-[#4F86D9] dark:text-sky-400 shrink-0" />
            <span>{intendedActionMessage}</span>
          </div>
        )}

        {/* Success Banner */}
        {successBanner && (
          <div className="mx-5 sm:mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-100 flex items-center gap-2 animate-in fade-in font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successBanner}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mx-5 sm:mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-200 flex items-center gap-2 animate-in fade-in font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 1: LOGIN PAGE */}
        {/* ============================================================== */}
        {mode === 'login' && (
          <div className="p-5 sm:p-6 space-y-4">
            <div>
              <h2 id="auth-modal-title" className="text-xl font-extrabold text-[#1E293B] dark:text-white tracking-tight">
                Welcome back!
              </h2>
              <p className="text-xs text-[#475467] dark:text-slate-300 mt-1">
                Find buyer wishes, submit direct price offers, and manage orders.
              </p>
            </div>

            {/* Quick Demo Accounts 1-Click Bar */}
            <div className="bg-[#F8FAFC] dark:bg-slate-800/80 p-3 rounded-xl border border-[#E0E7F0] dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#1E293B] dark:text-slate-200 uppercase tracking-wide">
                  Quick Demo Accounts:
                </span>
                <span className="text-[#475467] dark:text-slate-300 text-[10px]">
                  Pass: <code className="bg-white dark:bg-slate-900 text-[#1E293B] dark:text-sky-300 px-1.5 py-0.5 rounded border border-[#CBD5E1] dark:border-slate-700 font-mono font-semibold">password123</code>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('user-sarah')}
                  className="p-2 rounded-lg border border-[#CBD5E1] dark:border-slate-700 hover:border-[#4F86D9] dark:hover:border-[#4F86D9] bg-white dark:bg-slate-900 hover:bg-[#EDF4FF]/60 dark:hover:bg-slate-800 transition text-left cursor-pointer group shadow-2xs"
                  title="Log in as Sarah Jenkins (Buyer)"
                >
                  <div className="flex items-center gap-1.5">
                    <UserAvatar user={allUsers['user-sarah']} size="xs" className="w-5 h-5 rounded-full object-cover" />
                    <span className="text-xs font-bold text-[#1E293B] dark:text-slate-100 group-hover:text-[#4F86D9] dark:group-hover:text-sky-400 truncate">
                      Sarah
                    </span>
                  </div>
                  <span className="text-[10px] text-[#475467] dark:text-slate-400 block mt-0.5 font-medium">Buyer</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('user-alex')}
                  className="p-2 rounded-lg border border-[#CBD5E1] dark:border-slate-700 hover:border-[#4F86D9] dark:hover:border-[#4F86D9] bg-white dark:bg-slate-900 hover:bg-[#EDF4FF]/60 dark:hover:bg-slate-800 transition text-left cursor-pointer group shadow-2xs"
                  title="Log in as Alex Miller (Seller)"
                >
                  <div className="flex items-center gap-1.5">
                    <UserAvatar user={allUsers['user-alex']} size="xs" className="w-5 h-5 rounded-full object-cover" />
                    <span className="text-xs font-bold text-[#1E293B] dark:text-slate-100 group-hover:text-[#4F86D9] dark:group-hover:text-sky-400 truncate">
                      Alex
                    </span>
                  </div>
                  <span className="text-[10px] text-[#475467] dark:text-slate-400 block mt-0.5 font-medium">Seller</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('user-admin')}
                  className="p-2 rounded-lg border border-[#4F86D9]/40 dark:border-sky-800 hover:border-[#4F86D9] bg-[#EDF4FF]/60 dark:bg-sky-950/40 hover:bg-[#EDF4FF] dark:hover:bg-sky-900/50 transition text-left cursor-pointer group shadow-2xs"
                  title="Log in as Marketplace Admin"
                >
                  <div className="flex items-center gap-1.5">
                    <UserAvatar user={allUsers['user-admin']} size="xs" className="w-5 h-5 rounded-full object-cover" />
                    <span className="text-xs font-bold text-[#243B64] dark:text-sky-200 group-hover:text-[#4F86D9] truncate">
                      Admin
                    </span>
                  </div>
                  <span className="text-[10px] text-[#3568B5] dark:text-sky-400 block mt-0.5 font-semibold">Moderator</span>
                </button>
              </div>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
              <div>
                <label htmlFor="login-email" className="block text-xs font-bold text-[#1E293B] dark:text-slate-200 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#64748B] dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-slate-700 focus:border-[#4F86D9] dark:focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 outline-none text-[#0F172A] dark:text-white placeholder:text-[#64748B] dark:placeholder:text-slate-400 bg-white dark:bg-slate-900 font-medium transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="login-password" className="block text-xs font-bold text-[#1E293B] dark:text-slate-200">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot-password');
                      setError(null);
                    }}
                    className="text-xs text-[#4F86D9] dark:text-sky-400 hover:text-[#3568B5] dark:hover:text-sky-300 font-bold cursor-pointer transition"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#64748B] dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-slate-700 focus:border-[#4F86D9] dark:focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 outline-none text-[#0F172A] dark:text-white placeholder:text-[#64748B] dark:placeholder:text-slate-400 bg-white dark:bg-slate-900 font-medium transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400 hover:text-[#1E293B] dark:hover:text-white p-1 cursor-pointer transition"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-[#4F86D9] hover:bg-[#3568B5] active:bg-[#243B64] text-white text-xs sm:text-sm font-bold shadow-soft hover:shadow-card-hover transition cursor-pointer flex items-center justify-center gap-2 min-h-[42px] disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Log In</span>
                )}
              </button>
            </form>

            {/* Social Divider */}
            <div className="flex items-center gap-2 py-1">
              <div className="h-px flex-1 bg-[#E0E7F0] dark:bg-slate-800" />
              <span className="text-[10px] uppercase font-bold text-[#64748B] dark:text-slate-400 tracking-wider">
                or continue with
              </span>
              <div className="h-px flex-1 bg-[#E0E7F0] dark:bg-slate-800" />
            </div>

            {/* Social Sign-in Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSocialModalProvider('Google')}
                className="py-2 px-3 rounded-xl border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1E293B] dark:text-slate-100 cursor-pointer shadow-2xs"
                title="Sign in with Google"
                aria-label="Sign in with Google"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => setSocialModalProvider('Apple')}
                className="py-2 px-3 rounded-xl border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1E293B] dark:text-slate-100 cursor-pointer shadow-2xs"
                title="Sign in with Apple"
                aria-label="Sign in with Apple"
              >
                <svg className="w-4 h-4 fill-current text-[#1E293B] dark:text-slate-100" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.42-9.8-11.35-20.73-14.79-32.8-3.44-12.06-5.16-23.47-5.16-34.22 0-14.34 3.58-26.31 10.74-35.91 7.16-9.6 16.14-14.49 26.94-14.67 4.89 0 10.22 1.25 15.99 3.75 5.76 2.5 9.77 3.82 12.02 3.96 1.74-.27 5.98-1.68 12.74-4.25 6.75-2.56 12.19-3.72 16.32-3.47 12.63.65 22.84 5.34 30.65 14.07-11.08 6.74-16.5 15.97-16.27 27.69.23 9.35 3.82 17.26 10.78 23.73 6.96 6.47 15.11 10.13 24.46 10.97-2.17 6.53-4.78 13.06-7.82 19.58zM119.22 31.05c0-7.39 2.62-14.34 7.86-20.85 5.24-6.52 11.69-10.2 19.34-11.05.22 1.09.33 2.06.33 2.93 0 7.28-2.67 14.28-8.02 21-5.35 6.72-11.83 10.4-19.43 11.05-.08-1.08-.08-2.1-.08-3.08z" />
                </svg>
                <span>Apple</span>
              </button>

              <button
                type="button"
                onClick={() => setSocialModalProvider('Facebook')}
                className="py-2 px-3 rounded-xl border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1E293B] dark:text-slate-100 cursor-pointer shadow-2xs"
                title="Sign in with Facebook"
                aria-label="Sign in with Facebook"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Facebook</span>
              </button>
            </div>

            {/* Bottom Switcher */}
            <div className="pt-2 text-center border-t border-[#E0E7F0] dark:border-slate-800">
              <p className="text-xs text-[#475467] dark:text-slate-300">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className="font-bold text-[#4F86D9] dark:text-sky-400 hover:text-[#3568B5] dark:hover:text-sky-300 cursor-pointer"
                >
                  Create account
                </button>
              </p>
            </div>

            {onContinueAsGuest && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onContinueAsGuest();
                    onClose();
                  }}
                  className="text-xs text-[#475467] dark:text-slate-400 hover:text-[#1E293B] dark:hover:text-white font-semibold transition cursor-pointer"
                >
                  Continue browsing as Guest →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: CREATE ACCOUNT (REGISTRATION) */}
        {/* ============================================================== */}
        {mode === 'register' && (
          <div className="p-5 sm:p-6 space-y-4">
            <div>
              <h2 id="auth-modal-title" className="text-xl font-extrabold text-[#1E293B] dark:text-white tracking-tight">
                Create an account
              </h2>
              <p className="text-xs text-[#475467] dark:text-slate-300 mt-1">
                Join WishMarket to post wishes, receive direct price offers, or sell your items.
              </p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              {/* Profile Photo (Optional) */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/80 border border-[#CBD5E1] dark:border-slate-700 space-y-2.5">
                <label className="block text-xs font-bold text-[#1E293B] dark:text-slate-100">
                  Profile Photo <span className="text-[#64748B] dark:text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl border border-[#CBD5E1] dark:border-slate-600 overflow-hidden bg-white dark:bg-slate-900 shrink-0 flex items-center justify-center shadow-2xs">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-6 h-6 text-[#64748B] dark:text-slate-400" />
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
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#1E293B] dark:text-slate-100 cursor-pointer"
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
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-600 hover:border-[#4F86D9] dark:hover:border-[#4F86D9] hover:text-[#4F86D9] dark:hover:text-sky-400 text-[#1E293B] dark:text-slate-100 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5 text-[#4F86D9] dark:text-sky-400" />
                          <span>Upload Photo</span>
                        </button>
                        <p className="text-[10px] text-[#64748B] dark:text-slate-400 font-medium">
                          JPG, PNG, WebP up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {avatarError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {avatarError}
                  </p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="reg-name" className="block text-xs font-bold text-[#1E293B] dark:text-slate-200 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#64748B] dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name (e.g. Jordan Lee)"
                    autoComplete="name"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-slate-700 focus:border-[#4F86D9] dark:focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 outline-none text-[#0F172A] dark:text-white placeholder:text-[#64748B] dark:placeholder:text-slate-400 bg-white dark:bg-slate-900 font-medium transition"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="reg-email" className="block text-xs font-bold text-[#1E293B] dark:text-slate-200 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#64748B] dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-slate-700 focus:border-[#4F86D9] dark:focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 outline-none text-[#0F172A] dark:text-white placeholder:text-[#64748B] dark:placeholder:text-slate-400 bg-white dark:bg-slate-900 font-medium transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="reg-password" className="block text-xs font-bold text-[#1E293B] dark:text-slate-200 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#64748B] dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-slate-700 focus:border-[#4F86D9] dark:focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 outline-none text-[#0F172A] dark:text-white placeholder:text-[#64748B] dark:placeholder:text-slate-400 bg-white dark:bg-slate-900 font-medium transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400 hover:text-[#1E293B] dark:hover:text-white p-1 cursor-pointer transition"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="reg-confirm-password" className="block text-xs font-bold text-[#1E293B] dark:text-slate-200 mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#64748B] dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="reg-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-slate-700 focus:border-[#4F86D9] dark:focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 outline-none text-[#0F172A] dark:text-white placeholder:text-[#64748B] dark:placeholder:text-slate-400 bg-white dark:bg-slate-900 font-medium transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400 hover:text-[#1E293B] dark:hover:text-white p-1 cursor-pointer transition"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              {password.length > 0 && (
                <div className="bg-[#F8FAFC] dark:bg-slate-800/80 p-2.5 rounded-xl border border-[#CBD5E1] dark:border-slate-700 space-y-1 text-[11px] animate-in fade-in">
                  <div className="flex items-center gap-1.5">
                    <span className={hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-[#475467] dark:text-slate-300'}>
                      {hasMinLength ? '✓' : '○'} At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={hasLetterAndNumber ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-[#475467] dark:text-slate-300'}>
                      {hasLetterAndNumber ? '✓' : '○'} Contains at least one letter and one number
                    </span>
                  </div>
                  {confirmPassword.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className={passwordsMatch ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
                        {passwordsMatch ? '✓ Passwords match' : '✕ Passwords do not match'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Dual Role Note */}
              <div className="text-[11px] text-[#334155] dark:text-slate-200 bg-[#EDF4FF] dark:bg-slate-800/90 p-3 rounded-xl border border-[#4F86D9]/30 dark:border-sky-500/30 leading-relaxed">
                💡 <strong className="text-[#1E293B] dark:text-sky-300 font-bold">Dual Buyer & Seller:</strong> Your WishMarket account can post demand wishes and submit direct price offers anytime.
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-[#4F86D9] hover:bg-[#3568B5] active:bg-[#243B64] text-white text-xs sm:text-sm font-bold shadow-soft hover:shadow-card-hover transition cursor-pointer flex items-center justify-center gap-2 min-h-[42px] disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>

            {/* Social Divider */}
            <div className="flex items-center gap-2 py-1">
              <div className="h-px flex-1 bg-[#E0E7F0] dark:bg-slate-800" />
              <span className="text-[10px] uppercase font-bold text-[#64748B] dark:text-slate-400 tracking-wider">
                or sign up with
              </span>
              <div className="h-px flex-1 bg-[#E0E7F0] dark:bg-slate-800" />
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSocialModalProvider('Google')}
                className="py-2 px-3 rounded-xl border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1E293B] dark:text-slate-100 cursor-pointer shadow-2xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => setSocialModalProvider('Apple')}
                className="py-2 px-3 rounded-xl border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1E293B] dark:text-slate-100 cursor-pointer shadow-2xs"
              >
                <svg className="w-4 h-4 fill-current text-[#1E293B] dark:text-slate-100" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.42-9.8-11.35-20.73-14.79-32.8-3.44-12.06-5.16-23.47-5.16-34.22 0-14.34 3.58-26.31 10.74-35.91 7.16-9.6 16.14-14.49 26.94-14.67 4.89 0 10.22 1.25 15.99 3.75 5.76 2.5 9.77 3.82 12.02 3.96 1.74-.27 5.98-1.68 12.74-4.25 6.75-2.56 12.19-3.72 16.32-3.47 12.63.65 22.84 5.34 30.65 14.07-11.08 6.74-16.5 15.97-16.27 27.69.23 9.35 3.82 17.26 10.78 23.73 6.96 6.47 15.11 10.13 24.46 10.97-2.17 6.53-4.78 13.06-7.82 19.58zM119.22 31.05c0-7.39 2.62-14.34 7.86-20.85 5.24-6.52 11.69-10.2 19.34-11.05.22 1.09.33 2.06.33 2.93 0 7.28-2.67 14.28-8.02 21-5.35 6.72-11.83 10.4-19.43 11.05-.08-1.08-.08-2.1-.08-3.08z" />
                </svg>
                <span>Apple</span>
              </button>

              <button
                type="button"
                onClick={() => setSocialModalProvider('Facebook')}
                className="py-2 px-3 rounded-xl border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1E293B] dark:text-slate-100 cursor-pointer shadow-2xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Facebook</span>
              </button>
            </div>

            {/* Bottom Switcher */}
            <div className="pt-2 text-center border-t border-[#E0E7F0] dark:border-slate-800">
              <p className="text-xs text-[#475467] dark:text-slate-300">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="font-bold text-[#4F86D9] dark:text-sky-400 hover:text-[#3568B5] dark:hover:text-sky-300 cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: FORGOT PASSWORD (RECOVER ACCOUNT) */}
        {/* ============================================================== */}
        {mode === 'forgot-password' && (
          <div className="p-5 sm:p-6 space-y-4">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className="text-xs font-semibold text-[#475467] dark:text-slate-300 hover:text-[#1E293B] dark:hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>

            <div>
              <h2 id="auth-modal-title" className="text-xl font-extrabold text-[#1E293B] dark:text-white tracking-tight">
                Reset your password
              </h2>
              <p className="text-xs text-[#475467] dark:text-slate-300 mt-1">
                Enter your registered email address. If an account matches, we'll send a secure password reset link.
              </p>
            </div>

            {!forgotEmailSent ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-xs">
                <div>
                  <label htmlFor="forgot-email" className="block text-xs font-bold text-[#1E293B] dark:text-slate-200 mb-1">
                    Registered Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#64748B] dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      autoComplete="email"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-slate-700 focus:border-[#4F86D9] dark:focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 outline-none text-[#0F172A] dark:text-white placeholder:text-[#64748B] dark:placeholder:text-slate-400 bg-white dark:bg-slate-900 font-medium transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-[#4F86D9] hover:bg-[#3568B5] active:bg-[#243B64] text-white text-xs sm:text-sm font-bold shadow-soft hover:shadow-card-hover transition cursor-pointer flex items-center justify-center gap-2 min-h-[42px] disabled:opacity-60"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Send Password Reset Link</span>
                  )}
                </button>
              </form>
            ) : (
              /* Security Confirmation Screen */
              <div className="space-y-4 animate-in fade-in">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-2 text-xs text-emerald-900 dark:text-emerald-200">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-950 dark:text-emerald-100">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Check your email</span>
                  </div>
                  <p className="leading-relaxed text-emerald-800 dark:text-emerald-200">
                    If an account is associated with <strong>{resetTargetEmail}</strong>, a secure password reset link has been sent. Please check your inbox and spam folder.
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 pt-1 border-t border-emerald-200/80 dark:border-emerald-800/60">
                    For security purposes, this notification does not reveal whether the email address has an active account.
                  </p>
                </div>

                {/* Resend with Rate Limiting */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[#475467] dark:text-slate-300">Didn't receive an email?</span>
                  <button
                    type="button"
                    disabled={resendCooldown > 0}
                    onClick={() => {
                      setResendCooldown(60);
                      setSuccessBanner(`Reset link resent to ${resetTargetEmail}`);
                    }}
                    className={`font-semibold cursor-pointer ${
                      resendCooldown > 0
                        ? 'text-[#64748B] dark:text-slate-500 cursor-not-allowed opacity-60'
                        : 'text-[#4F86D9] dark:text-sky-400 hover:text-[#3568B5] dark:hover:text-sky-300'
                    }`}
                  >
                    {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend reset email'}
                  </button>
                </div>

                {/* Simulated Delivery Verification Link for Prototype Testing */}
                <div className="bg-[#EDF4FF] dark:bg-sky-950/40 border border-[#4F86D9]/30 dark:border-sky-800/60 rounded-xl p-3.5 space-y-2 text-xs text-[#1E293B] dark:text-slate-100">
                  <div className="flex items-center gap-1.5 font-bold text-[#243B64] dark:text-sky-300">
                    <Sparkles className="w-4 h-4 text-[#4F86D9] dark:text-sky-400" />
                    <span>Interactive Prototype Verification</span>
                  </div>
                  <p className="text-[#475467] dark:text-slate-300 text-[11px] leading-relaxed">
                    In production, this link is delivered to the user's inbox via a configured email service (SMTP/SendGrid). You can test the password reset flow with this token:
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset-password');
                      setPassword('');
                      setConfirmPassword('');
                      setError(null);
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-[#4F86D9] hover:bg-[#3568B5] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Open Password Reset Link (Token: {simulatedResetToken})</span>
                  </button>
                </div>

                {/* Technical Note on Email Backend */}
                <div className="p-3 bg-[#F8FAFC] dark:bg-slate-800/80 rounded-xl border border-[#CBD5E1] dark:border-slate-700 text-[11px] text-[#475467] dark:text-slate-300 space-y-1">
                  <div className="flex items-center gap-1 font-semibold text-[#1E293B] dark:text-slate-100">
                    <HelpCircle className="w-3.5 h-3.5 text-[#4F86D9] dark:text-sky-400" />
                    <span>Production Email Backend Note:</span>
                  </div>
                  <p>
                    Real automated email delivery requires an outbound transactional email service (e.g. SendGrid, Postmark, AWS SES, or SMTP server) with SPF/DKIM verification.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 4: RESET PASSWORD (NEW PASSWORD CREATION) */}
        {/* ============================================================== */}
        {mode === 'reset-password' && (
          <div className="p-5 sm:p-6 space-y-4">
            <div>
              <h2 id="auth-modal-title" className="text-xl font-extrabold text-[#1E293B] dark:text-white tracking-tight">
                Set new password
              </h2>
              <p className="text-xs text-[#475467] dark:text-slate-300 mt-1">
                Enter and confirm your new secure password for <strong className="text-[#1E293B] dark:text-white">{resetTargetEmail}</strong>.
              </p>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5 text-xs">
              {/* New Password */}
              <div>
                <label htmlFor="new-password" className="block text-xs font-bold text-[#1E293B] dark:text-slate-200 mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#64748B] dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-slate-700 focus:border-[#4F86D9] dark:focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 outline-none text-[#0F172A] dark:text-white placeholder:text-[#64748B] dark:placeholder:text-slate-400 bg-white dark:bg-slate-900 font-medium transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400 hover:text-[#1E293B] dark:hover:text-white p-1 cursor-pointer transition"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label htmlFor="new-confirm-password" className="block text-xs font-bold text-[#1E293B] dark:text-slate-200 mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#64748B] dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="new-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-slate-700 focus:border-[#4F86D9] dark:focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 outline-none text-[#0F172A] dark:text-white placeholder:text-[#64748B] dark:placeholder:text-slate-400 bg-white dark:bg-slate-900 font-medium transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400 hover:text-[#1E293B] dark:hover:text-white p-1 cursor-pointer transition"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              {password.length > 0 && (
                <div className="bg-[#F8FAFC] dark:bg-slate-800/80 p-2.5 rounded-xl border border-[#CBD5E1] dark:border-slate-700 space-y-1 text-[11px] animate-in fade-in">
                  <div className="flex items-center gap-1.5">
                    <span className={hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-[#475467] dark:text-slate-300'}>
                      {hasMinLength ? '✓' : '○'} At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={hasLetterAndNumber ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-[#475467] dark:text-slate-300'}>
                      {hasLetterAndNumber ? '✓' : '○'} Contains at least one letter and one number
                    </span>
                  </div>
                  {confirmPassword.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className={passwordsMatch ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
                        {passwordsMatch ? '✓ Passwords match' : '✕ Passwords do not match'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-[#4F86D9] hover:bg-[#3568B5] active:bg-[#243B64] text-white text-xs sm:text-sm font-bold shadow-soft hover:shadow-card-hover transition cursor-pointer flex items-center justify-center gap-2 min-h-[42px] disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
