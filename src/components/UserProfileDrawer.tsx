import React, { useState, useEffect, useRef } from 'react';
import { User, Wish, Transaction, Offer, Review, WarningRecord } from '../types';
import { 
  X, CheckCircle2, ShieldCheck, Bell, Award, Star, Mail, Phone, 
  Calendar, ShoppingBag, ArrowLeftRight, Check, Sparkles, MessageSquare,
  Camera, Edit3, Image as ImageIcon, Upload, UserCheck, AlertCircle,
  History as HistoryIcon, Tag, Package, Clock, ArrowRight, CornerDownRight, Trash2,
  User as UserIcon, ShieldAlert, AlertTriangle, RotateCcw, Sun, Moon
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { validateAvatarFile, processAvatarFile } from '../utils/imageUtils';
import { formatBaht } from '../utils/currency';

interface UserProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  allUsers?: Record<string, User>;
  onUpdateNotifications?: (enabled: boolean, settings?: { offers: boolean; messages: boolean; orders: boolean }) => void;
  onUpdatePreferences?: (preferences: User['notificationPreferences']) => void;
  onUpdateProfile?: (updated: { name: string; avatar: string; avatarUrl?: string; email: string; phone: string }) => void;
  userWishes: Wish[];
  userOffers?: Offer[];
  userTransactions: Transaction[];
  reviews?: Review[];
  onSubmitReview?: (transactionId: string, rating: number, comment: string) => void;
  onAcceptOffer?: (offer: Offer) => void;
  onDeclineOffer?: (offerId: string) => void;
  onUndoDeclineOffer?: (offerId: string) => void;
  onOpenAuth: () => void;
  onOpenOrderChat?: (tx: Transaction) => void;
  onOpenOfferChat?: (offer: Offer) => void;
  onOpenAllChats?: () => void;
  onChangeView?: (view: 'browse' | 'post' | 'offers' | 'admin') => void;
  onEditWish?: (wish: Wish) => void;
  onDeleteWish?: (wishId: string) => void;
  onRequestDeleteWish?: (wish: Wish) => void;
  onViewUserProfile?: (userId: string, userFallback?: { id: string; name: string; avatar?: string; rating?: number; reviewCount?: number }) => void;
  onOpenWarningDetail?: (warning: WarningRecord) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onSelectTheme?: (theme: 'light' | 'dark') => void;
}

const AVATAR_PRESETS = [
  { label: 'Sarah (Default)', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { label: 'Alex (Default)', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { label: 'Professional', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { label: 'Creative', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
  { label: 'Modern Casual', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
  { label: 'Urban Minimal', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80' },
];

export const UserProfileDrawer: React.FC<UserProfileDrawerProps> = ({
  isOpen,
  onClose,
  user,
  allUsers,
  onUpdateNotifications,
  onUpdatePreferences,
  onUpdateProfile,
  userWishes,
  userOffers = [],
  userTransactions,
  reviews = [],
  onSubmitReview,
  onAcceptOffer,
  onDeclineOffer,
  onUndoDeclineOffer,
  onOpenAuth,
  onOpenOrderChat,
  onOpenOfferChat,
  onOpenAllChats,
  onChangeView,
  onEditWish,
  onDeleteWish,
  onRequestDeleteWish,
  onViewUserProfile,
  onOpenWarningDetail,
  theme = 'light',
  onToggleTheme,
  onSelectTheme,
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    user?.notificationsEnabled !== undefined ? user.notificationsEnabled : true
  );
  const [notificationSettings, setNotificationSettings] = useState({
    offers: user?.notificationSettings?.offers ?? true,
    messages: user?.notificationSettings?.messages ?? true,
    orders: user?.notificationSettings?.orders ?? true,
  });
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'reviews' | 'wishes' | 'offers' | 'history'>('profile');
  const [reviewsSubTab, setReviewsSubTab] = useState<'received' | 'given'>('received');
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { rating: number; comment: string; isSubmitted?: boolean }>>({});
  const [leavingReviewFor, setLeavingReviewFor] = useState<string | null>(null);

  // Edit Profile Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editError, setEditError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when user changes or drawer opens
  useEffect(() => {
    if (user) {
      setNotificationsEnabled(user.notificationsEnabled !== undefined ? user.notificationsEnabled : true);
      setNotificationSettings({
        offers: user.notificationSettings?.offers ?? true,
        messages: user.notificationSettings?.messages ?? true,
        orders: user.notificationSettings?.orders ?? true,
      });
      setEditName(user.name);
      setEditAvatar(user.avatarUrl || user.avatar || '');
      setEditEmail(user.email);
      setEditPhone(user.phone || '');
      setIsEditing(false);
      setEditError(null);
      setPhotoError(null);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in">
        <div
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
        <div className="fixed inset-y-0 right-0 w-full sm:max-w-md flex">
          <div className="w-full max-w-full bg-white dark:bg-[#111827] text-[#263244] dark:text-slate-100 shadow-2xl sm:border-l border-[#E0E7F0] dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center space-y-4 min-w-0 overflow-hidden">
            <div className="w-full flex justify-end absolute top-4 right-4">
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close account drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-lg font-bold text-[#263244] dark:text-white">You are browsing as Guest</h3>
            <p className="text-xs text-[#5B6B82] dark:text-slate-400">Sign in or create an account to view your profile and manage wishes.</p>
            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="px-6 py-2.5 rounded-xl bg-[#4F86D9] hover:bg-[#3568B5] active:bg-[#243B64] text-white text-xs font-bold transition cursor-pointer shadow-soft"
            >
              Sign In or Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Consistent reviews calculation
  const receivedReviews = reviews.filter((r) => r.toUserId === user.id);
  const givenReviews = reviews.filter((r) => r.fromUserId === user.id);
  const effectiveReviewCount = receivedReviews.length > 0 ? receivedReviews.length : (user.reviewCount || 0);
  const effectiveRating = receivedReviews.length > 0
    ? receivedReviews.reduce((sum, r) => sum + r.rating, 0) / receivedReviews.length
    : user.rating;

  const handleToggleNotifications = () => {
    const nextVal = !notificationsEnabled;
    setNotificationsEnabled(nextVal);
    if (onUpdateNotifications) {
      onUpdateNotifications(nextVal, notificationSettings);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleToggleChannel = (channel: 'offers' | 'messages' | 'orders') => {
    const nextSettings = {
      ...notificationSettings,
      [channel]: !notificationSettings[channel],
    };
    setNotificationSettings(nextSettings);
    if (onUpdateNotifications) {
      onUpdateNotifications(notificationsEnabled, nextSettings);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handlePhotoUpload = async (file: File, isFormMode = false) => {
    const errorMsg = validateAvatarFile(file);
    if (errorMsg) {
      if (isFormMode) {
        setEditError(errorMsg);
      } else {
        setPhotoError(errorMsg);
      }
      return;
    }

    if (isFormMode) setEditError(null);
    else setPhotoError(null);

    setIsProcessingPhoto(true);
    try {
      const croppedDataUrl = await processAvatarFile(file);
      setEditAvatar(croppedDataUrl);

      if (!isFormMode && onUpdateProfile && user) {
        onUpdateProfile({
          name: user.name,
          avatar: croppedDataUrl,
          avatarUrl: croppedDataUrl,
          email: user.email,
          phone: user.phone || '+1 (555) 234-8901',
        });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2500);
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to process image.';
      if (isFormMode) setEditError(msg);
      else setPhotoError(msg);
    } finally {
      setIsProcessingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (isFormMode = false) => {
    setPhotoError(null);
    setEditAvatar('');
    if (!isFormMode && onUpdateProfile && user) {
      onUpdateProfile({
        name: user.name,
        avatar: '',
        avatarUrl: '',
        email: user.email,
        phone: user.phone || '+1 (555) 234-8901',
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditError('Please enter your name');
      return;
    }
    if (!editEmail.trim() || !editEmail.includes('@')) {
      setEditError('Please enter a valid email address');
      return;
    }

    const normalizedEditEmail = editEmail.trim().toLowerCase();
    const isDuplicate = Object.values(allUsers || {}).some(
      (u) => u.id !== user.id && u.email.trim().toLowerCase() === normalizedEditEmail
    );
    if (isDuplicate) {
      setEditError(`The email "${editEmail.trim()}" is already associated with another account.`);
      return;
    }

    if (onUpdateProfile) {
      onUpdateProfile({
        name: editName.trim(),
        avatar: editAvatar.trim(),
        avatarUrl: editAvatar.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim() || '+1 (555) 234-8901',
      });
    }

    setIsEditing(false);
    setEditError(null);
    setPhotoError(null);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleCancelEdit = () => {
    setEditName(user.name);
    setEditAvatar(user.avatar);
    setEditEmail(user.email);
    setEditPhone(user.phone || '');
    setEditError(null);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 w-full sm:max-w-md flex">
        <div className="w-full max-w-full bg-white dark:bg-[#111827] text-[#263244] dark:text-slate-100 shadow-2xl sm:border-l border-[#E0E7F0] dark:border-slate-800 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-[#243B64] dark:bg-slate-900 text-white flex items-center justify-between gap-2 min-w-0 shrink-0 border-b border-white/10">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="relative group shrink-0">
                <UserAvatar
                  user={user}
                  src={isEditing ? editAvatar : (user.avatarUrl || user.avatar)}
                  name={isEditing ? (editName || user.name) : user.name}
                  size="xl"
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover ring-2 ring-[#4F86D9] shadow-sm"
                />
                {user.verified && !isEditing && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute -bottom-1 -right-1 fill-[#243B64] dark:fill-slate-900" />
                )}
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center pointer-events-none">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-full">
                    {isEditing ? (editName || 'Edit Profile') : user.name}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 shrink-0">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-slate-300 truncate mt-0.5">{isEditing ? editEmail : user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#4F86D9] hover:bg-[#3568B5] text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs"
                  title="Edit profile and contact information"
                >
                  <Edit3 className="w-3.5 h-3.5 shrink-0" />
                  <span>Edit</span>
                </button>
              ) : (
                <button
                  onClick={handleCancelEdit}
                  className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-slate-200 hover:text-white text-xs font-semibold transition cursor-pointer shrink-0"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="Close account drawer"
                className="p-1.5 rounded-lg text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 pb-8 sm:pb-5 space-y-5 min-w-0">
            {/* Success indicator */}
            {isSaved && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            {/* EDIT PROFILE FORM MODE */}
            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-5 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-[#E0E7F0] dark:border-slate-800">
                  <h4 className="text-sm font-bold text-[#263244] dark:text-white flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#4F86D9] dark:text-sky-400" />
                    <span>Edit Profile & Contact Details</span>
                  </h4>
                  <span className="text-[11px] text-[#5B6B82] dark:text-slate-400">Live preview enabled</span>
                </div>

                {editError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
                    <span>{editError}</span>
                  </div>
                )}

                {/* 1. EDIT PROFILE PICTURE */}
                <div className="space-y-3 p-4 bg-[#F7F9FC] dark:bg-slate-800/50 rounded-2xl border border-[#E0E7F0] dark:border-slate-700/80">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#263244] dark:text-white flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#4F86D9] dark:text-sky-400" />
                      <span>Profile Picture</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPresets(!showPresets)}
                      className="text-[11px] text-[#4F86D9] dark:text-sky-400 hover:text-[#3568B5] dark:hover:text-sky-300 font-semibold cursor-pointer underline"
                    >
                      {showPresets ? 'Hide presets' : 'Choose from presets'}
                    </button>
                  </div>

                  {/* Avatar Preview + Actions */}
                  <div className="flex items-center gap-3.5">
                    <div className="relative w-16 h-16 shrink-0">
                      <UserAvatar
                        src={editAvatar}
                        name={editName || user.name}
                        size="2xl"
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-[#4F86D9]/60 shadow-xs"
                      />
                      {isProcessingPhoto && (
                        <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-[#EDF4FF] dark:hover:bg-slate-800 text-[#263244] dark:text-white text-xs font-semibold border border-[#E0E7F0] dark:border-slate-700 shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5 text-[#4F86D9] dark:text-sky-400" />
                          <span>Change Photo</span>
                        </button>
                        {editAvatar && (
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(true)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800/60 transition cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                        <input
                          ref={editFileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handlePhotoUpload(f, true);
                          }}
                          className="hidden"
                        />
                      </div>
                      <p className="text-[10px] text-[#5B6B82] dark:text-slate-400">
                        JPG, PNG, WebP up to 5MB (Auto-cropped to square, 512x512)
                      </p>
                    </div>
                  </div>

                  {/* Preset Avatars Grid */}
                  {showPresets && (
                    <div className="pt-2 border-t border-[#E0E7F0] dark:border-slate-700/80 space-y-1.5">
                      <span className="text-[11px] text-[#5B6B82] dark:text-slate-400 block font-medium">
                        Quick Avatars (Click to select):
                      </span>
                      <div className="grid grid-cols-6 gap-2">
                        {AVATAR_PRESETS.map((p, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => setEditAvatar(p.url)}
                            className={`p-0.5 rounded-xl border-2 transition cursor-pointer group ${
                              editAvatar === p.url ? 'border-[#4F86D9] ring-2 ring-[#4F86D9]/30' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                            title={p.label}
                          >
                            <img
                              src={p.url}
                              alt={p.label}
                              className="w-full h-10 rounded-lg object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. EDIT CONTACT INFO */}
                <div className="space-y-3 p-4 bg-[#F7F9FC] dark:bg-slate-800/50 rounded-2xl border border-[#E0E7F0] dark:border-slate-700/80">
                  <label className="text-xs font-bold text-[#263244] dark:text-white flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#4F86D9] dark:text-sky-400" />
                    <span>Contact Information</span>
                  </label>

                  {/* Full Name */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-[#5B6B82] dark:text-slate-300">Full Name</span>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#E0E7F0] dark:border-slate-700 bg-white dark:bg-[#0B0F19] focus:outline-none focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 font-semibold text-[#263244] dark:text-white"
                    />
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-[#5B6B82] dark:text-slate-300">Email Address</span>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="e.g. sarah@example.com"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#E0E7F0] dark:border-slate-700 bg-white dark:bg-[#0B0F19] focus:outline-none focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 text-[#263244] dark:text-white"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-[#5B6B82] dark:text-slate-300">Phone Number</span>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="e.g. +1 (555) 234-8901"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#E0E7F0] dark:border-slate-700 bg-white dark:bg-[#0B0F19] focus:outline-none focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 text-[#263244] dark:text-white font-mono"
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-xs font-semibold text-[#5B6B82] dark:text-slate-300 hover:text-[#263244] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#4F86D9] hover:bg-[#3568B5] active:bg-[#243B64] text-white text-xs font-bold shadow-soft flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            ) : (
              /* VIEW PROFILE MODE */
              <>
                {/* Warning Alert Banner & History if user has any active warnings */}
                {user.warningCount && user.warningCount > 0 ? (
                  <div className="p-3.5 sm:p-4 bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/70 rounded-2xl space-y-3 animate-in fade-in min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-amber-200 dark:border-amber-800/60">
                      <div className="flex items-center gap-1.5 text-amber-950 dark:text-amber-200 font-bold text-xs min-w-0">
                        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="truncate">Account Moderation Notices ({user.warningCount})</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 uppercase whitespace-nowrap shrink-0">
                        Policy Compliance
                      </span>
                    </div>

                    <p className="text-[11px] text-amber-900 dark:text-amber-200/90 leading-relaxed">
                      A moderator has issued official guidance regarding community rules. Please review the notice details below to keep your account in good standing.
                    </p>

                    {user.warnings && user.warnings.length > 0 && (
                      <div className="space-y-2 pt-1">
                        {user.warnings.map((w) => {
                          const isFinal = w.severity === 'FINAL_WARNING';
                          const isPolicy = w.severity === 'POLICY_WARNING';

                          const cardBg = isFinal
                            ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/70'
                            : isPolicy
                            ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/70'
                            : 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/70';

                          const badgeStyle = isFinal
                            ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700'
                            : isPolicy
                            ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                            : 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 border-sky-300 dark:border-sky-700';

                          const severityTitle = isFinal
                            ? 'Final Notice'
                            : isPolicy
                            ? 'Policy Warning'
                            : 'Moderator Notice';

                          return (
                            <div
                              key={w.id}
                              className={`p-3 rounded-xl border text-xs space-y-1.5 transition min-w-0 ${cardBg}`}
                            >
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider whitespace-nowrap ${badgeStyle}`}
                                  >
                                    {severityTitle}
                                  </span>
                                  {!w.read && (
                                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 whitespace-nowrap">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400 animate-pulse" />
                                      <span>Unread</span>
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-[#5B6B82] dark:text-slate-400 font-medium whitespace-nowrap">
                                  {w.issuedAt}
                                </span>
                              </div>

                              <div className="min-w-0">
                                <p className="font-bold text-[#263244] dark:text-white text-[11px] break-words">
                                  Violation: <span className="font-semibold text-slate-800 dark:text-slate-200">{w.reason}</span>
                                </p>
                                {w.details && (
                                  <p className="text-[11px] text-[#5B6B82] dark:text-slate-300 mt-0.5 line-clamp-2 break-words">
                                    <span className="font-semibold text-[#263244] dark:text-white">Explanation: </span>
                                    {w.details}
                                  </p>
                                )}
                              </div>

                              {w.targetWishTitle && (
                                <p className="text-[10px] text-[#5B6B82] dark:text-slate-300 bg-white/80 dark:bg-slate-900/70 p-1.5 rounded border border-slate-200/70 dark:border-slate-700/70 truncate">
                                  <span className="font-semibold text-[#263244] dark:text-white">Listing: </span>
                                  <span>{w.targetWishTitle}</span>
                                </p>
                              )}

                              <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-[10px] font-mono text-[#5B6B82] dark:text-slate-400">
                                  Ref: {w.id}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onOpenWarningDetail?.(w)}
                                  className="text-[11px] font-bold text-[#4F86D9] dark:text-sky-400 hover:text-[#3568B5] hover:underline cursor-pointer flex items-center gap-1 shrink-0"
                                >
                                  <span>Review Official Notice</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Navigation Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold w-full max-w-full min-w-0 overflow-x-auto scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer shrink-0 ${
                      activeTab === 'profile' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    Profile & Settings
                  </button>
                  {!user?.isAdmin && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('reviews')}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1 shrink-0 ${
                        activeTab === 'reviews' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <span>Reviews</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">{effectiveReviewCount}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab('wishes')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1 shrink-0 ${
                      activeTab === 'wishes' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <span>Wishes</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">{userWishes.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('offers')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1 shrink-0 ${
                      activeTab === 'offers' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <span>Offers</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold">{userOffers.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1 shrink-0 ${
                      activeTab === 'history' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <span>History</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">{userTransactions.length}</span>
                  </button>
                </div>

                {/* TAB 1: Profile & Settings */}
                {(activeTab === 'profile') && (
                  <>
                    {/* Rating & Trust Badges */}
                    <div className="space-y-3 min-w-0">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Reputation & Badges
                      </h4>

                      {!user.isAdmin ? (
                        <div className="grid grid-cols-2 gap-2.5 min-w-0">
                          <div 
                            onClick={() => setActiveTab('reviews')}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500/60 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition group min-w-0"
                            title="View all community reviews"
                          >
                            <div className="flex items-center gap-1 text-amber-500 font-bold text-base">
                              <Star className="w-4 h-4 fill-amber-500 shrink-0" />
                              <span>{effectiveRating.toFixed(1)}</span>
                              <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center justify-between gap-1">
                              <span className="truncate">{effectiveReviewCount} Reviews</span>
                              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition shrink-0" />
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-center min-w-0">
                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 truncate">Verified Member</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">100% on-time fulfillment</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 space-y-1">
                          <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 font-bold text-xs">
                            <ShieldCheck className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                            <span>System Administrator & Governance Console</span>
                          </div>
                          <p className="text-[11px] text-purple-700 dark:text-purple-300 leading-relaxed">
                            Official marketplace moderator account. Handles community guidelines, user warnings, and listing reviews. Administrators do not buy, sell, or receive marketplace trading reviews.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Profile Photo Management (Change Photo & Remove Photo) */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Profile Photo</span>
                        </h4>
                        {(user.avatarUrl || user.avatar) && (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Custom Photo
                          </span>
                        )}
                      </div>

                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-14 h-14 shrink-0">
                            <UserAvatar
                              user={user}
                              size="2xl"
                              className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-500/30 shadow-xs"
                            />
                            {isProcessingPhoto && (
                              <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {(user.avatarUrl || user.avatar) ? 'Photo Active' : 'No Photo (Initials Fallback)'}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              JPG, PNG, WebP up to 5MB (Max 512×512)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handlePhotoUpload(f, false);
                            }}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                          >
                            <Camera className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>Change Photo</span>
                          </button>

                          {(user.avatarUrl || user.avatar) && (
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(false)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800/60 transition cursor-pointer flex items-center gap-1"
                              title="Remove custom photo and use initials fallback"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove Photo</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {photoError && (
                        <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5 animate-in fade-in">
                          <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                          <span>{photoError}</span>
                        </div>
                      )}
                    </div>

                    {/* Contact Details Card with Edit Shortcut */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Contact Information
                        </h4>
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Contact Info</span>
                        </button>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 space-y-2.5 text-xs text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 min-w-0">
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-800 dark:text-slate-100 truncate">{user.email}</span>
                          </div>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 font-semibold shrink-0">
                            Verified
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="font-mono text-slate-800 dark:text-slate-100 truncate">{user.phone || '+1 (555) 234-8901'}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0">Direct SMS/Call</span>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400">
                          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate">Member since {user.joinedDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Member Reviews Preview in Profile (Only for trading members, never admin) */}
                    {!user.isAdmin && (
                      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>Reviews & Feedback ({effectiveReviewCount})</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => setActiveTab('reviews')}
                            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold cursor-pointer flex items-center gap-1"
                          >
                            <span>See All ({effectiveReviewCount})</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>

                        {receivedReviews.length === 0 ? (
                          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
                            No reviews received yet for this member.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {receivedReviews.slice(0, 3).map((rev) => (
                              <div
                                key={rev.id}
                                className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex items-center gap-0.5">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                          key={s}
                                          className={`w-3 h-3 ${
                                            s <= rev.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200 dark:text-slate-700'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="font-bold text-slate-800 dark:text-slate-100">{rev.fromUserName}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400">{rev.createdAt}</span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 italic leading-relaxed text-[11px]">
                                  "{rev.comment}"
                                </p>
                              </div>
                            ))}

                            {receivedReviews.length > 3 && (
                              <button
                                type="button"
                                onClick={() => setActiveTab('reviews')}
                                className="w-full py-2 text-center text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl border border-indigo-100 dark:border-indigo-900/50 transition cursor-pointer"
                              >
                                View all {receivedReviews.length} member reviews →
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Appearance & Theme Settings */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          {theme === 'dark' ? (
                            <Moon className="w-3.5 h-3.5 text-indigo-400" />
                          ) : (
                            <Sun className="w-3.5 h-3.5 text-amber-500" />
                          )}
                          <span>Appearance & Theme</span>
                        </h4>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 space-y-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectTheme) onSelectTheme('light');
                              else if (theme === 'dark' && onToggleTheme) onToggleTheme();
                            }}
                            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              theme === 'light'
                                ? 'bg-white text-slate-900 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                                : 'bg-slate-900/50 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-800'
                            }`}
                          >
                            <Sun className={`w-4 h-4 ${theme === 'light' ? 'text-amber-500' : 'text-slate-400'}`} />
                            <span>Light Mode</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectTheme) onSelectTheme('dark');
                              else if (theme === 'light' && onToggleTheme) onToggleTheme();
                            }}
                            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              theme === 'dark'
                                ? 'bg-slate-900 text-white border-indigo-500 ring-2 ring-indigo-500/30 shadow-xs'
                                : 'bg-white/60 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-white'
                            }`}
                          >
                            <Moon className={`w-4 h-4 ${theme === 'dark' ? 'text-indigo-400' : 'text-slate-500'}`} />
                            <span>Dark Mode</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Your theme preference is saved automatically across sessions.
                        </p>
                      </div>
                    </div>

                    {/* Notifications Settings (Replaces Category Wish Alerts with Notification ON / OFF) */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Bell className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Notifications</span>
                        </h4>
                        {isSaved && (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Saved
                          </span>
                        )}
                      </div>

                      {/* Master Toggle Card */}
                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Notifications</span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                notificationsEnabled 
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' 
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}>
                                {notificationsEnabled ? 'ON' : 'OFF'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {notificationsEnabled 
                                ? 'Alerts active for incoming offers, direct chats, and order fulfillment.'
                                : 'All notifications are currently muted.'}
                            </p>
                          </div>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={notificationsEnabled}
                            onClick={handleToggleNotifications}
                            className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                              notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                            title={`Turn notifications ${notificationsEnabled ? 'off' : 'on'}`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs ${
                                notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Channels when ON */}
                        {notificationsEnabled ? (
                          <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-700 dark:text-slate-300 font-medium">Offers & Price Proposals</span>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={notificationSettings.offers}
                                onClick={() => handleToggleChannel('offers')}
                                className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                                  notificationSettings.offers ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                    notificationSettings.offers ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-700 dark:text-slate-300 font-medium">Direct Messages & Chats</span>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={notificationSettings.messages}
                                onClick={() => handleToggleChannel('messages')}
                                className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                                  notificationSettings.messages ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                    notificationSettings.messages ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-700 dark:text-slate-300 font-medium">Order Status & Tracking</span>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={notificationSettings.orders}
                                onClick={() => handleToggleChannel('orders')}
                                className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                                  notificationSettings.orders ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                    notificationSettings.orders ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </>
                )}

                {/* TAB: REVIEWS (Dedicated full reviews view, regular users only) */}
                {(activeTab === 'reviews' && !user.isAdmin) && (
                  <div className="space-y-4 animate-in fade-in">
                    {/* Rating Overview Card */}
                    <div className="p-4 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider block">
                            Marketplace Standing
                          </span>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-2xl font-black">{effectiveRating.toFixed(1)}</span>
                            <span className="text-xs text-slate-400">out of 5.0</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-0.5 text-amber-400 justify-end">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-4 h-4 ${
                                  s <= Math.round(effectiveRating)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-600'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-slate-300 mt-0.5 block">
                            {effectiveReviewCount} total verified {effectiveReviewCount === 1 ? 'review' : 'reviews'}
                          </span>
                        </div>
                      </div>

                      {/* Rating Distribution Bar */}
                      <div className="pt-2 border-t border-white/10 space-y-1.5 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="w-12 text-slate-300 font-medium">5 Stars</span>
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full"
                              style={{
                                width: `${
                                  receivedReviews.length > 0
                                    ? (receivedReviews.filter((r) => r.rating === 5).length / receivedReviews.length) * 100
                                    : 100
                                }%`,
                              }}
                            />
                          </div>
                          <span className="w-6 text-right font-mono text-slate-300">
                            {receivedReviews.filter((r) => r.rating === 5).length}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-12 text-slate-300 font-medium">4 Stars</span>
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400/80 rounded-full"
                              style={{
                                width: `${
                                  receivedReviews.length > 0
                                    ? (receivedReviews.filter((r) => r.rating === 4).length / receivedReviews.length) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                          <span className="w-6 text-right font-mono text-slate-300">
                            {receivedReviews.filter((r) => r.rating === 4).length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sub-tabs: Received vs Given */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setReviewsSubTab('received')}
                          className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                            reviewsSubTab === 'received'
                              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                          }`}
                        >
                          Received ({receivedReviews.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewsSubTab('given')}
                          className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                            reviewsSubTab === 'given'
                              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                          }`}
                        >
                          Given ({givenReviews.length})
                        </button>
                      </div>

                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        Verified Trades Only
                      </span>
                    </div>

                    {/* Reviews List */}
                    {reviewsSubTab === 'received' ? (
                      receivedReviews.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                          <Star className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No reviews received yet</p>
                          <p className="text-[11px] text-slate-400">
                            Complete wishes and orders to receive feedback from fellow community members.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {receivedReviews.map((rev) => (
                            <div
                              key={rev.id}
                              className="p-3.5 bg-white dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/50">
                                    {rev.fromUserName.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onViewUserProfile) {
                                          onClose();
                                          onViewUserProfile(rev.fromUserId, {
                                            id: rev.fromUserId,
                                            name: rev.fromUserName,
                                          });
                                        }
                                      }}
                                      className="text-xs font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer block text-left"
                                    >
                                      {rev.fromUserName}
                                    </button>
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                      Verified Trade
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star
                                        key={s}
                                        className={`w-3 h-3 ${
                                          s <= rev.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200 dark:text-slate-700'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-medium ml-1">
                                    {rev.createdAt}
                                  </span>
                                </div>
                              </div>

                              <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/60 leading-relaxed italic">
                                "{rev.comment}"
                              </p>
                            </div>
                          ))}
                        </div>
                      )
                    ) : (
                      givenReviews.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                          <Star className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No written reviews yet</p>
                          <p className="text-[11px] text-slate-400">
                            When you finish orders in History, you can leave reviews for your sellers and buyers.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {givenReviews.map((rev) => (
                            <div
                              key={rev.id}
                              className="p-3.5 bg-white dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                  Review for <strong className="text-slate-900 dark:text-slate-100">{rev.toUserName}</strong>
                                </span>
                                <div className="flex items-center gap-1">
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star
                                        key={s}
                                        className={`w-3 h-3 ${
                                          s <= rev.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200 dark:text-slate-700'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-medium ml-1">
                                    {rev.createdAt}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/60 italic">
                                "{rev.comment}"
                              </p>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* TAB 2: Your Wishes */}
                {(activeTab === 'wishes') && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Your Wishes ({userWishes.length})
                      </h4>
                      {onChangeView && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onChangeView('post');
                          }}
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 cursor-pointer"
                        >
                          + Post New Wish
                        </button>
                      )}
                    </div>
                    {userWishes.length === 0 ? (
                      <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                        <ShoppingBag className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">You haven't posted any wishes yet</p>
                        <p className="text-[11px] text-slate-400">Post what you want to buy, set your budget, and sellers will offer it to you.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {userWishes.map((w) => (
                          <div
                            key={w.id}
                            className="p-3.5 bg-white dark:bg-slate-800/70 rounded-xl text-xs border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <h5 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {w.title}
                                </h5>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  <span>Category: <strong className="text-slate-700 dark:text-slate-200">{w.category}</strong></span>
                                  <span>•</span>
                                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{w.offersCount} offer(s)</span>
                                </div>
                              </div>
                              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold shrink-0 text-sm">
                                {formatBaht(w.budget)}
                              </span>
                            </div>

                            {w.description && (
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg line-clamp-2">
                                {w.description}
                              </p>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                              {onEditWish && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onEditWish(w);
                                  }}
                                  className="px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                                  title="Edit your wish details"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit Wish</span>
                                </button>
                              )}
                              {(onRequestDeleteWish || onDeleteWish) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onRequestDeleteWish) {
                                      onRequestDeleteWish(w);
                                    } else if (onDeleteWish) {
                                      onDeleteWish(w.id);
                                    }
                                  }}
                                  className="px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg transition cursor-pointer flex items-center gap-1.5 border border-rose-100 dark:border-rose-800/60"
                                  title="Delete this wish"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Wish</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: Offers (Separated from History / Orders) */}
                {(activeTab === 'offers') && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Offers ({userOffers.length})</span>
                      </h4>
                      {onChangeView && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onChangeView('offers');
                          }}
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>Manage Offers</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {userOffers.length === 0 ? (
                      <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                        <Tag className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No active offers yet</p>
                        <p className="text-[11px] text-slate-400">
                          When sellers respond to your posted wishes with pricing proposals, they will appear right here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {userOffers.map((off) => {
                          const isBuyer = user.id === off.buyerId;
                          const otherPerson = isBuyer ? off.sellerName : off.buyerName;
                          const otherRole = isBuyer ? 'Seller' : 'Buyer';

                          return (
                            <div
                              key={off.id}
                              className="p-3.5 bg-white dark:bg-slate-800/70 rounded-xl text-xs border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                      {off.wishTitle}
                                    </span>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${
                                        off.status === 'ACCEPTED'
                                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                          : off.status === 'DECLINED'
                                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                      }`}>
                                        {off.status}
                                      </span>
                                      {off.status === 'DECLINED' && off.declinedAt && (
                                        <span className="text-[10px] text-slate-400">
                                          {off.declinedAt}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {isBuyer ? 'Offered by' : 'Sent to'}:{' '}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const otherId = isBuyer ? off.sellerId : off.buyerId;
                                        if (onViewUserProfile) {
                                          onClose();
                                          onViewUserProfile(otherId, {
                                            id: otherId,
                                            name: otherPerson,
                                            rating: isBuyer ? off.sellerRating : undefined,
                                          });
                                        }
                                      }}
                                      className="font-bold text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer inline-flex items-center gap-0.5"
                                    >
                                      <span>{otherPerson}</span>
                                    </button>{' '}
                                    ({otherRole})
                                  </p>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold block text-sm">
                                    {formatBaht(off.offeredPrice)}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    Target: {formatBaht(off.targetBudget)}
                                  </span>
                                </div>
                              </div>

                              {off.details && (
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-700/60">
                                  "{off.details}"
                                </p>
                              )}

                              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60 gap-2 flex-wrap">
                                {onOpenOfferChat && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onOpenOfferChat(off);
                                      onClose();
                                    }}
                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>Chat</span>
                                  </button>
                                )}

                                {isBuyer && off.status === 'PENDING' && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {onDeclineOffer && (
                                      <button
                                        type="button"
                                        onClick={() => onDeclineOffer(off.id)}
                                        className="px-2.5 py-1 rounded-lg text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-800/60 transition"
                                      >
                                        Decline
                                      </button>
                                    )}
                                    {onAcceptOffer && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onAcceptOffer(off);
                                          onClose();
                                        }}
                                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                                      >
                                        Accept Offer
                                      </button>
                                    )}
                                  </div>
                                )}

                                {isBuyer && off.status === 'DECLINED' && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {onUndoDeclineOffer && (
                                      <button
                                        type="button"
                                        onClick={() => onUndoDeclineOffer(off.id)}
                                        className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs font-semibold cursor-pointer flex items-center gap-1 transition"
                                      >
                                        <RotateCcw className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                                        <span>Cancel Decline</span>
                                      </button>
                                    )}
                                    {onAcceptOffer && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onAcceptOffer(off);
                                          onClose();
                                        }}
                                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                                      >
                                        Accept Offer
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: History (Paired with Reviews) */}
                {(activeTab === 'history') && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <HistoryIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>History ({userTransactions.length})</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Orders paired with reviews and fulfillment status
                        </p>
                      </div>
                      {onChangeView && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onChangeView('offers');
                          }}
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 cursor-pointer"
                        >
                          View Orders
                        </button>
                      )}
                    </div>

                    {userTransactions.length === 0 ? (
                      <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                        <HistoryIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No transaction history yet</p>
                        <p className="text-[11px] text-slate-400">
                          Completed orders and their reviews will be recorded here permanently.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {userTransactions.map((tx) => {
                          const pairedReviews = reviews.filter((r) => r.transactionId === tx.id);
                          const isReviewedByUser = (user.id === tx.buyerId && tx.buyerReviewed) || 
                            (user.id === tx.sellerId && tx.sellerReviewed) ||
                            pairedReviews.some((r) => r.fromUserId === user.id);
                          const isReviewFormOpen = leavingReviewFor === tx.id;
                          const currentDraft = reviewDrafts[tx.id] || { rating: 5, comment: '' };

                          return (
                            <div
                              key={tx.id}
                              className="p-3.5 bg-white dark:bg-slate-800/70 rounded-xl text-xs border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-3"
                            >
                              {/* Order Summary */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                      {tx.wishTitle}
                                    </span>
                                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${
                                      tx.status === 'COMPLETED'
                                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                        : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                                    }`}>
                                      {tx.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    <span>
                                      Seller:{' '}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (onViewUserProfile) {
                                            onClose();
                                            onViewUserProfile(tx.sellerId, { id: tx.sellerId, name: tx.sellerName });
                                          }
                                        }}
                                        className="font-bold text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer"
                                      >
                                        {tx.sellerName}
                                      </button>
                                    </span>
                                    <span>•</span>
                                    <span>
                                      Buyer:{' '}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (onViewUserProfile) {
                                            onClose();
                                            onViewUserProfile(tx.buyerId, { id: tx.buyerId, name: tx.buyerName });
                                          }
                                        }}
                                        className="font-bold text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer"
                                      >
                                        {tx.buyerName}
                                      </button>
                                    </span>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold block text-sm">
                                    {formatBaht(tx.agreedPrice)}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {tx.completedAt ? `Completed ${tx.completedAt}` : tx.createdAt}
                                  </span>
                                </div>
                              </div>

                              {/* Tracking information if present */}
                              {tx.trackingNumber && (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700/60 font-mono">
                                  <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span>Tracking: {tx.trackingNumber}</span>
                                </div>
                              )}

                              {/* PAIRED REVIEWS SECTION */}
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                    <span>Paired Reviews ({pairedReviews.length})</span>
                                  </span>

                                  {!isReviewedByUser && !isReviewFormOpen && onSubmitReview && !user?.isAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => setLeavingReviewFor(tx.id)}
                                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 cursor-pointer"
                                    >
                                      + Leave Review
                                    </button>
                                  )}
                                </div>

                                {/* Existing Reviews Display */}
                                {pairedReviews.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {pairedReviews.map((rev) => (
                                      <div
                                        key={rev.id}
                                        className="p-2.5 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-800/50 space-y-1"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                              <Star
                                                key={s}
                                                className={`w-3 h-3 ${
                                                  s <= rev.rating
                                                    ? 'text-amber-500 fill-amber-500'
                                                    : 'text-slate-300 dark:text-slate-600'
                                                }`}
                                              />
                                            ))}
                                            <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 ml-1">
                                              {rev.fromUserName}
                                            </span>
                                          </div>
                                          <span className="text-[10px] text-amber-800/70 dark:text-amber-400/70 font-medium">
                                            {rev.createdAt}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-700 dark:text-slate-300 italic">
                                          "{rev.comment}"
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  !isReviewFormOpen && (
                                    <p className="text-[11px] text-slate-400 italic">
                                      No reviews written yet for this order.
                                    </p>
                                  )
                                )}

                                {/* Interactive Leave Review Box */}
                                {isReviewFormOpen && (
                                  <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-xl space-y-2.5 animate-in fade-in">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                        Your Rating & Review:
                                      </span>
                                      <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <button
                                            key={star}
                                            type="button"
                                            onClick={() =>
                                              setReviewDrafts((prev) => ({
                                                ...prev,
                                                [tx.id]: {
                                                  ...(prev[tx.id] || { rating: 5, comment: '' }),
                                                  rating: star,
                                                },
                                              }))
                                            }
                                            className="p-0.5 cursor-pointer hover:scale-110 transition"
                                          >
                                            <Star
                                              className={`w-4 h-4 ${
                                                star <= (currentDraft.rating || 5)
                                                  ? 'text-amber-500 fill-amber-500'
                                                  : 'text-slate-300 dark:text-slate-600'
                                              }`}
                                            />
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    <textarea
                                      rows={2}
                                      value={currentDraft.comment}
                                      onChange={(e) =>
                                        setReviewDrafts((prev) => ({
                                          ...prev,
                                          [tx.id]: {
                                            ...(prev[tx.id] || { rating: 5, comment: '' }),
                                            comment: e.target.value,
                                          },
                                        }))
                                      }
                                      placeholder="Share your experience (shipping speed, item condition, communication)..."
                                      className="w-full text-xs p-2 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                                    />

                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setLeavingReviewFor(null)}
                                        className="px-2.5 py-1 text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (onSubmitReview && !user?.isAdmin) {
                                            onSubmitReview(
                                              tx.id,
                                              currentDraft.rating || 5,
                                              currentDraft.comment.trim() || 'Item arrived safely and was in great condition!'
                                            );
                                            setLeavingReviewFor(null);
                                            setIsSaved(true);
                                            setTimeout(() => setIsSaved(false), 2000);
                                          }
                                        }}
                                        className="px-3 py-1 rounded-lg bg-[#5B4BEE] hover:bg-[#4035C8] text-white text-xs font-bold cursor-pointer"
                                      >
                                        Post Review
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Footer Actions */}
                              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                                <span className="text-[10px] text-slate-400 font-mono">
                                  #{tx.id}
                                </span>
                                {!user?.isAdmin && onOpenOrderChat && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onOpenOrderChat(tx);
                                      onClose();
                                    }}
                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>Chat</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
