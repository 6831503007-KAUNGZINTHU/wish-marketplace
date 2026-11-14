import React, { useState, useRef, useCallback } from 'react';
import { Wish, User, Offer } from '../types';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, DollarSign, MessageSquare, 
  Send, CheckCircle2, ShieldCheck, AlertTriangle, Edit3, Trash2, 
  Share2, Eye, Tag, Clock, Check, ArrowRight, User as UserIcon,
  Sparkles, ExternalLink, Shield, PackageCheck, AlertCircle, Info, RotateCcw
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { formatBaht } from '../utils/currency';

interface WishDetailsPageProps {
  wish: Wish;
  allWishes?: Wish[];
  currentUser: User | null;
  allUsers?: Record<string, User>;
  offers?: Offer[];
  onBackToBrowse: () => void;
  onSelectCategory?: (category: string) => void;
  onSelectWish: (wish: Wish) => void;
  onOpenChat: (wish: Wish) => void;
  onSubmitOffer: (wish: Wish, offeredPrice: number, details: string) => void;
  onRequireAuth: () => void;
  onEditWish?: (wish: Wish) => void;
  onEditOffer?: (offer: Offer) => void;
  onRequestDeleteWish?: (wish: Wish) => void;
  onDeleteWish?: (wishId: string) => void;
  onToggleFlagWish?: (wishId: string) => void;
  onWarnBuyer?: (wish: Wish) => void;
  onViewUserProfile?: (userId: string, userFallback?: { id: string; name: string; avatar?: string; rating?: number; reviewCount?: number }) => void;
  onAcceptOffer?: (offer: Offer) => void;
  onDeclineOffer?: (offerId: string) => void;
  onUndoDeclineOffer?: (offerId: string) => void;
}

export const WishDetailsPage: React.FC<WishDetailsPageProps> = ({
  wish,
  allWishes = [],
  currentUser,
  allUsers,
  offers = [],
  onBackToBrowse,
  onSelectCategory,
  onSelectWish,
  onOpenChat,
  onSubmitOffer,
  onRequireAuth,
  onEditWish,
  onEditOffer,
  onRequestDeleteWish,
  onDeleteWish,
  onToggleFlagWish,
  onWarnBuyer,
  onViewUserProfile,
  onAcceptOffer,
  onDeclineOffer,
  onUndoDeclineOffer,
}) => {
  // Gallery state
  const wishImages = wish.images && wish.images.length > 0 
    ? wish.images 
    : (wish.imageUrl ? [wish.imageUrl] : []);
  
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const totalPhotos = wishImages.length;

  // Touch swiping refs for iPad and mobile
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);

  // Offer form state
  const [isOfferFormOpen, setIsOfferFormOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState<string>(wish.budget > 0 ? (wish.budget % 1 === 0 ? wish.budget.toString() : wish.budget.toFixed(2)) : '');
  const [offerDetails, setOfferDetails] = useState<string>('');
  const [offerError, setOfferError] = useState<string | null>(null);
  const [offerSubmitted, setOfferSubmitted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isOwner = currentUser && wish.buyerId === currentUser.id;
  const isAdmin = currentUser?.isAdmin || false;

  // Relevant offers for this wish
  const wishOffers = offers.filter((o) => o.wishId === wish.id);
  const userOffer = currentUser ? wishOffers.find((o) => o.sellerId === currentUser.id) : null;

  // Related wishes in the same category
  const relatedWishes = allWishes
    .filter((w) => w.id !== wish.id && w.category === wish.category)
    .slice(0, 3);

  // Gallery previous/next
  const handlePrevPhoto = useCallback(() => {
    if (totalPhotos <= 1) return;
    setActivePhotoIdx((prev) => (prev === 0 ? totalPhotos - 1 : prev - 1));
  }, [totalPhotos]);

  const handleNextPhoto = useCallback(() => {
    if (totalPhotos <= 1) return;
    setActivePhotoIdx((prev) => (prev === totalPhotos - 1 ? 0 : prev + 1));
  }, [totalPhotos]);

  // Touch gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (totalPhotos <= 1) return;
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    const duration = Date.now() - touchStartTime.current;

    // Swipe threshold: >35px horizontal and predominantly horizontal
    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1 && duration < 750) {
      if (deltaX < 0) {
        handleNextPhoto();
      } else {
        handlePrevPhoto();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Keyboard navigation for image gallery
  const handleGalleryKeyDown = (e: React.KeyboardEvent) => {
    if (totalPhotos <= 1) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrevPhoto();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNextPhoto();
    }
  };

  // Submit offer
  const handleSendOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (currentUser.isAdmin) {
      return;
    }

    const price = parseFloat(offerPrice);
    if (isNaN(price) || price <= 0) {
      setOfferError('Please enter an offer price greater than ฿0');
      return;
    }

    onSubmitOffer(
      wish,
      price,
      offerDetails.trim() || 'Available in excellent condition, ready for prompt dispatch.'
    );

    setOfferSubmitted(true);
    setIsOfferFormOpen(false);
    setOfferError(null);

    setTimeout(() => {
      setOfferSubmitted(false);
    }, 6000);
  };

  const handleShare = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const buyerAvatar = wish.buyerAvatarUrl || allUsers?.[wish.buyerId]?.avatarUrl || wish.buyerAvatar || allUsers?.[wish.buyerId]?.avatar;
  const buyerUser = allUsers?.[wish.buyerId];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. TOP BREADCRUMB & BACK BUTTON NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 text-xs text-[#667085] dark:text-slate-400 flex-wrap">
          <button
            type="button"
            onClick={onBackToBrowse}
            className="inline-flex items-center gap-1.5 font-bold text-[#243B64] dark:text-sky-300 hover:text-[#4F86D9] dark:hover:text-sky-200 py-1 px-2.5 rounded-xl bg-white dark:bg-[#111827] border border-[#E0E7F0] dark:border-slate-800 hover:border-[#4F86D9]/40 shadow-soft transition-all duration-150 cursor-pointer min-h-[38px]"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Back to Browse</span>
          </button>
          <span className="text-[#E0E7F0] dark:text-slate-700">/</span>
          <button
            type="button"
            onClick={() => {
              if (onSelectCategory) {
                onSelectCategory('All');
              }
              onBackToBrowse();
            }}
            className="hover:text-[#263244] dark:hover:text-slate-100 transition-colors cursor-pointer"
          >
            All Wishes
          </button>
          <span className="text-[#E0E7F0] dark:text-slate-700">/</span>
          <button
            type="button"
            onClick={() => {
              if (onSelectCategory) {
                onSelectCategory(wish.category);
              }
              onBackToBrowse();
            }}
            className="hover:text-[#263244] dark:hover:text-slate-100 transition-colors font-medium cursor-pointer"
          >
            {wish.category}
          </button>
          <span className="text-[#E0E7F0] dark:text-slate-700">/</span>
          <span className="text-[#263244] dark:text-slate-200 font-semibold truncate max-w-xs sm:max-w-md">
            {wish.id}
          </span>
        </div>

        {/* Share & Quick Moderation Status */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {wish.isFlagged && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-[#FEF7EC] dark:bg-amber-950/50 text-[#B7791F] dark:text-amber-300 border border-[#B7791F]/30">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Flagged Listing</span>
            </span>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#111827] hover:bg-[#F7F9FC] dark:hover:bg-slate-800 text-xs font-semibold text-[#667085] dark:text-slate-300 hover:text-[#263244] dark:hover:text-slate-100 border border-[#E0E7F0] dark:border-slate-800 shadow-soft transition-colors cursor-pointer min-h-[36px]"
            title="Copy link to wish"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#287A55] dark:text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* SUCCESS BANNER FOR SUBMITTED OFFER */}
      {offerSubmitted && (
        <div className="p-4 bg-[#EAF6F0] dark:bg-emerald-950/40 border border-[#287A55]/30 dark:border-emerald-700/50 rounded-2xl text-xs text-[#287A55] dark:text-emerald-300 flex items-center gap-3 animate-in slide-in-from-top-2 shadow-soft">
          <CheckCircle2 className="w-5 h-5 text-[#287A55] dark:text-emerald-400 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">Your direct offer has been sent to {wish.buyerName}!</span>
            <p className="mt-0.5 text-[#287A55]/90 dark:text-emerald-300/90">
              You can track conversation updates, price counters, and order progress anytime in your <strong>Offers</strong> tab.
            </p>
          </div>
        </div>
      )}

      {/* 2. MAIN 2-COLUMN PRODUCT DETAILS LAYOUT */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl sm:rounded-3xl border border-[#E0E7F0] dark:border-slate-800 p-4 sm:p-7 lg:p-8 shadow-soft">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10">
          
          {/* ================= LEFT SIDE: GALLERY (5/12 on LG) ================= */}
          <div className="lg:col-span-6 xl:col-span-5 space-y-4">
            {/* Primary Large Image Viewport */}
            <div
              tabIndex={0}
              role="region"
              aria-label={`${wish.title} image gallery`}
              onKeyDown={handleGalleryKeyDown}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: 'pan-y' }}
              className="relative aspect-4/3 sm:aspect-1/1 bg-[#F7F9FC] dark:bg-slate-800/80 rounded-2xl border border-[#E0E7F0] dark:border-slate-800 overflow-hidden flex items-center justify-center select-none group shadow-inner focus:outline-none focus:ring-2 focus:ring-[#4F86D9]"
            >
              {totalPhotos > 0 ? (
                <img
                  src={wishImages[activePhotoIdx]}
                  alt={`${wish.title} - photo ${activePhotoIdx + 1} of ${totalPhotos}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-all duration-200"
                  draggable={false}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-[#667085] dark:text-slate-400 p-6 text-center">
                  <Tag className="w-12 h-12 stroke-[1.5] text-[#667085]/40 dark:text-slate-500 mb-2" />
                  <span className="text-xs font-semibold text-[#263244] dark:text-slate-200">No reference photo provided</span>
                  <span className="text-[11px] text-[#667085] dark:text-slate-400 mt-1">Buyer provided detailed description specifications</span>
                </div>
              )}

              {/* Top Floating Category and Owner Badges */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-white/95 dark:bg-slate-900/90 text-[#243B64] dark:text-sky-300 shadow-soft backdrop-blur-xs border border-white/50 dark:border-slate-700">
                  {wish.category}
                </span>

                <div className="flex items-center gap-1.5">
                  {isOwner && (
                    <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-[#243B64] dark:bg-[#4F86D9] text-white shadow-soft">
                      Your Wish
                    </span>
                  )}
                  {wish.isFlagged && (
                    <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-[#B7791F] text-white shadow-soft">
                      Flagged
                    </span>
                  )}
                </div>
              </div>

              {/* Prev / Next Controls (Accessible touch targets >= 44x44px) */}
              {totalPhotos > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevPhoto}
                    aria-label="Previous photo"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#243B64]/75 hover:bg-[#243B64] active:bg-[#1A2B49] text-white flex items-center justify-center transition-all duration-150 backdrop-blur-xs shadow-md z-20 cursor-pointer active:scale-95"
                  >
                    <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextPhoto}
                    aria-label="Next photo"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#243B64]/75 hover:bg-[#243B64] active:bg-[#1A2B49] text-white flex items-center justify-center transition-all duration-150 backdrop-blur-xs shadow-md z-20 cursor-pointer active:scale-95"
                  >
                    <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                  </button>

                  {/* Photo Counter Pill */}
                  <div className="absolute bottom-3 right-3 bg-[#243B64]/80 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow-sm pointer-events-none">
                    {activePhotoIdx + 1} of {totalPhotos}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Navigation Row */}
            {totalPhotos > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                {wishImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all duration-150 shrink-0 cursor-pointer ${
                      activePhotoIdx === idx
                        ? 'border-[#4F86D9] ring-2 ring-[#4F86D9]/30 scale-102 shadow-sm'
                        : 'border-[#E0E7F0] dark:border-slate-700 opacity-70 hover:opacity-100 hover:border-[#667085]'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Buyer Trust Assurance Strip */}
            <div className="p-3.5 rounded-2xl bg-[#F7F9FC] dark:bg-slate-800/70 border border-[#E0E7F0] dark:border-slate-800 flex items-center gap-3 text-xs text-[#667085] dark:text-slate-400">
              <ShieldCheck className="w-5 h-5 text-[#287A55] dark:text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-[#263244] dark:text-slate-100 block">Verified Buyer Demand Request</span>
                <span>Direct price proposals are protected under the WishMarket Escrow & Safe Exchange policy.</span>
              </div>
            </div>
          </div>

          {/* ================= RIGHT SIDE: DETAILS & PURCHASE/OFFER MODULE (7/12 on LG) ================= */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              
              {/* Category & Status Strip */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#4F86D9]">
                    {wish.category}
                  </span>
                  <span className="text-[#667085] dark:text-slate-500">·</span>
                  <span className="text-xs text-[#667085] dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Posted {wish.createdAt}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EDF4FF] dark:bg-[#4F86D9]/15 text-[#243B64] dark:text-sky-300 border border-[#4F86D9]/25">
                    {wish.offersCount === 0 ? 'No offers yet' : `${wish.offersCount} offer${wish.offersCount > 1 ? 's' : ''} received`}
                  </span>
                </div>
              </div>

              {/* Full Wish Title */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#263244] dark:text-slate-100 tracking-tight leading-tight">
                {wish.title}
              </h1>

              {/* Target Budget Highlighting Box (Amazon/Shopee style price module) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#EDF4FF]/50 dark:bg-[#1A2436] border border-[#4F86D9]/20 dark:border-[#4F86D9]/30 space-y-2">
                <div className="text-xs font-semibold text-[#667085] dark:text-slate-400 uppercase tracking-wider">
                  Buyer's Target Budget
                </div>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#287A55] dark:text-emerald-400 tabular-nums tracking-tight">
                    {formatBaht(wish.budget)}
                  </span>
                  <span className="text-xs text-[#667085] dark:text-slate-400 font-medium">
                    (Buyer willingness to pay for item in desired condition)
                  </span>
                </div>
                <p className="text-xs text-[#667085] dark:text-slate-400 pt-1">
                  Sellers can match this budget or propose a competitive price offer based on exact item condition and included accessories.
                </p>
              </div>

              {/* Buyer's Requirements & Full Description */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-[#263244] dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-[#4F86D9]" />
                  <span>Buyer Description & Condition Requirements</span>
                </h3>
                <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-slate-800/70 border border-[#E0E7F0] dark:border-slate-800 text-sm text-[#263244] dark:text-slate-200 leading-relaxed whitespace-pre-line">
                  {wish.description || 'No additional notes provided by buyer.'}
                </div>
              </div>

              {/* Wish Owner Profile Card */}
              <div className="p-4 rounded-2xl border border-[#E0E7F0] dark:border-slate-800 bg-white dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div
                  onClick={() => {
                    if (onViewUserProfile) {
                      onViewUserProfile(wish.buyerId, {
                        id: wish.buyerId,
                        name: wish.buyerName,
                        avatar: buyerAvatar,
                        rating: wish.buyerRating,
                        reviewCount: buyerUser?.reviewCount,
                      });
                    }
                  }}
                  className="flex items-center gap-3 cursor-pointer group/buyer"
                  title="View complete buyer reputation & reviews"
                >
                  <UserAvatar
                    src={buyerAvatar}
                    name={wish.buyerName}
                    size="md"
                    className="w-12 h-12 rounded-xl object-cover border border-[#E0E7F0] dark:border-slate-700 shrink-0 shadow-2xs"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#263244] dark:text-slate-100 group-hover/buyer:text-[#4F86D9] dark:group-hover/buyer:text-sky-400 group-hover/buyer:underline transition-colors">
                        {wish.buyerName}
                      </span>
                      {buyerUser?.isAdmin ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#EDF4FF] dark:bg-[#4F86D9]/20 text-[#243B64] dark:text-sky-300 border border-[#4F86D9]/30 font-bold uppercase">
                          Admin
                        </span>
                      ) : (
                        <span className="text-xs text-[#B7791F] dark:text-amber-400 font-bold">
                          ★ {wish.buyerRating.toFixed(1)} {buyerUser?.reviewCount !== undefined ? `(${buyerUser.reviewCount} reviews)` : ''}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#667085] dark:text-slate-400 block mt-0.5">
                      Verified Member {buyerUser?.joinedDate ? `· Joined ${buyerUser.joinedDate}` : ''}
                    </span>
                  </div>
                </div>

                {onViewUserProfile && (
                  <button
                    type="button"
                    onClick={() =>
                      onViewUserProfile(wish.buyerId, {
                        id: wish.buyerId,
                        name: wish.buyerName,
                        avatar: buyerAvatar,
                        rating: wish.buyerRating,
                        reviewCount: buyerUser?.reviewCount,
                      })
                    }
                    className="text-xs font-semibold text-[#4F86D9] hover:text-[#3568B5] flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                  >
                    <span>View Public Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* EXISTING USER PROPOSAL ALERT IF SELLER ALREADY OFFERED */}
              {userOffer && !isOwner && (
                <div className="p-4 rounded-2xl bg-[#FEF7EC] dark:bg-amber-950/30 border border-[#B7791F]/30 dark:border-amber-800/50 text-xs text-[#B7791F] dark:text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#263244] dark:text-slate-100">
                        You previously submitted an offer of {formatBaht(userOffer.offeredPrice)} on this wish.
                      </span>
                      <p className="mt-0.5 text-[#667085] dark:text-slate-400">
                        Status: <strong className="uppercase">{userOffer.status}</strong> · {userOffer.details}
                      </p>
                    </div>
                  </div>
                  {onEditOffer && userOffer.status !== 'ACCEPTED' && (
                    <button
                      type="button"
                      onClick={() => onEditOffer(userOffer)}
                      className="px-3.5 py-2 rounded-xl bg-[#4F86D9] hover:bg-[#3568B5] text-white text-xs font-bold flex items-center gap-1.5 shadow-soft transition cursor-pointer shrink-0 self-start sm:self-center"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit My Offer</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ================= PRIMARY ACTION CONTROLS ================= */}
            <div className="pt-5 border-t border-[#E0E7F0] dark:border-slate-800 space-y-4">
              
              {/* CASE A: USER IS THE OWNER OF THE WISH */}
              {isOwner ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-[#EDF4FF] dark:bg-[#4F86D9]/15 border border-[#4F86D9]/30 flex items-center gap-2.5 text-xs text-[#243B64] dark:text-sky-200">
                    <CheckCircle2 className="w-4 h-4 text-[#4F86D9] shrink-0" />
                    <span className="font-medium">
                      This is your active demand post. When sellers submit price proposals, you will receive notifications and can review them in the Offers tab.
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {onEditWish && (
                      <button
                        type="button"
                        onClick={() => onEditWish(wish)}
                        className="flex-1 min-w-[140px] px-5 py-3 rounded-2xl bg-[#243B64] dark:bg-[#4F86D9] hover:bg-[#1A2B49] dark:hover:bg-[#3568B5] text-white text-xs font-bold shadow-soft flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit Wish Details</span>
                      </button>
                    )}

                    {(onRequestDeleteWish || onDeleteWish) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onRequestDeleteWish) onRequestDeleteWish(wish);
                          else if (onDeleteWish) onDeleteWish(wish.id);
                        }}
                        className="px-5 py-3 rounded-2xl bg-[#FDF2F2] dark:bg-rose-950/40 hover:bg-[#FBE4E4] dark:hover:bg-rose-900/50 text-[#C0392B] dark:text-rose-400 border border-[#C0392B]/30 dark:border-rose-800/50 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Wish</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : isAdmin ? (
                /* CASE B: ADMINISTRATOR CONTROLS */
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-[#F7F9FC] dark:bg-slate-800/70 border border-[#E0E7F0] dark:border-slate-700 text-xs text-[#667085] dark:text-slate-400 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#243B64] dark:text-[#4F86D9]" />
                    <span>Administrator Mode: Oversee listing compliance and moderate community content.</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {onToggleFlagWish && (
                      <button
                        type="button"
                        onClick={() => onToggleFlagWish(wish.id)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[42px] ${
                          wish.isFlagged
                            ? 'bg-[#FEF7EC] dark:bg-amber-950/40 text-[#B7791F] dark:text-amber-300 border border-[#B7791F]/40 dark:border-amber-800/50'
                            : 'bg-white dark:bg-slate-800 text-[#667085] dark:text-slate-300 hover:text-[#263244] dark:hover:text-white border border-[#E0E7F0] dark:border-slate-700'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{wish.isFlagged ? 'Unflag' : 'Flag Listing'}</span>
                      </button>
                    )}

                    {onWarnBuyer && (
                      <button
                        type="button"
                        onClick={() => onWarnBuyer(wish)}
                        className="px-3 py-2.5 rounded-xl bg-[#FEF7EC] dark:bg-amber-950/40 text-[#B7791F] dark:text-amber-300 hover:bg-[#FDEED9] dark:hover:bg-amber-900/50 border border-[#B7791F]/40 dark:border-amber-800/50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[42px]"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Warn Buyer</span>
                      </button>
                    )}

                    {onEditWish && (
                      <button
                        type="button"
                        onClick={() => onEditWish(wish)}
                        className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-[#F7F9FC] dark:hover:bg-slate-700 text-[#263244] dark:text-slate-200 border border-[#E0E7F0] dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[42px]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    )}

                    {(onRequestDeleteWish || onDeleteWish) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onRequestDeleteWish) onRequestDeleteWish(wish);
                          else if (onDeleteWish) onDeleteWish(wish.id);
                        }}
                        className="px-3 py-2.5 rounded-xl bg-[#FDF2F2] dark:bg-rose-950/40 hover:bg-[#FBE4E4] dark:hover:bg-rose-900/50 text-[#C0392B] dark:text-rose-400 border border-[#C0392B]/30 dark:border-rose-800/50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[42px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* CASE C: POTENTIAL SELLER (DEFAULT VIEW) */
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-stretch gap-3">
                    {/* Make an Offer Button (Primary Sky Blue #4F86D9) */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentUser) {
                          onRequireAuth();
                          return;
                        }
                        setIsOfferFormOpen(!isOfferFormOpen);
                      }}
                      className={`flex-1 px-6 py-3.5 rounded-2xl text-sm font-bold shadow-soft flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer min-h-[48px] ${
                        isOfferFormOpen
                          ? 'bg-[#243B64] dark:bg-slate-800 hover:bg-[#1A2B49] dark:hover:bg-slate-700 text-white'
                          : 'bg-[#4F86D9] hover:bg-[#3568B5] active:bg-[#3568B5] text-white hover:shadow-card-hover'
                      }`}
                    >
                      <DollarSign className="w-4 h-4 stroke-[2.5]" />
                      <span>{isOfferFormOpen ? 'Close Offer Form' : 'Make an Offer'}</span>
                    </button>

                    {/* Chat with Buyer Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentUser) onRequireAuth();
                        else onOpenChat(wish);
                      }}
                      className="px-6 py-3.5 rounded-2xl text-sm font-bold text-[#243B64] dark:text-sky-300 bg-[#EDF4FF] dark:bg-[#4F86D9]/15 hover:bg-[#EDF4FF]/80 dark:hover:bg-[#4F86D9]/25 active:bg-[#D9E8FF] border border-[#4F86D9]/30 flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[48px]"
                    >
                      <MessageSquare className="w-4 h-4 text-[#4F86D9]" />
                      <span>Chat with Buyer</span>
                    </button>
                  </div>

                  {/* INLINE EXPANDABLE MAKE AN OFFER FORM */}
                  {isOfferFormOpen && (
                    <form
                      onSubmit={handleSendOffer}
                      className="p-4 sm:p-5 rounded-2xl bg-[#EDF4FF]/60 dark:bg-slate-800/80 border border-[#4F86D9]/30 space-y-4 animate-in fade-in duration-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-[#4F86D9] shrink-0" />
                          <h4 className="text-xs font-bold text-[#263244] dark:text-slate-100 uppercase tracking-wider">
                            Submit Direct Proposal to {wish.buyerName}
                          </h4>
                        </div>
                        <span className="text-xs text-[#667085] dark:text-slate-400">
                          Target Budget: <strong className="text-[#287A55] dark:text-emerald-400 font-mono">{formatBaht(wish.budget)}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#263244] dark:text-slate-200 mb-1.5">
                            Your Offered Price (฿) *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#667085] dark:text-slate-400 font-semibold text-sm">
                              ฿
                            </span>
                            <input
                              type="text"
                              inputMode="decimal"
                              required
                              value={offerPrice}
                              onFocus={(e) => {
                                if (e.target.value === '0.00' || e.target.value === '0') {
                                  e.target.select();
                                }
                              }}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                                  setOfferPrice(val);
                                  if (offerError) setOfferError(null);
                                }
                              }}
                              placeholder="0.00"
                              className="w-full pl-8 pr-4 py-2.5 text-sm rounded-xl border border-[#E0E7F0] dark:border-slate-700 focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 outline-none text-[#263244] dark:text-slate-100 font-mono bg-white dark:bg-slate-900 font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#263244] dark:text-slate-200 mb-1.5">
                            Condition & Inclusions Note
                          </label>
                          <input
                            type="text"
                            value={offerDetails}
                            onChange={(e) => setOfferDetails(e.target.value)}
                            placeholder="e.g. Mint condition with original box and cable, ready to ship..."
                            className="w-full px-4 py-2.5 text-xs rounded-xl border border-[#E0E7F0] dark:border-slate-700 focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 outline-none text-[#263244] dark:text-slate-100 placeholder:text-[#667085] dark:placeholder:text-slate-500 bg-white dark:bg-slate-900"
                          />
                        </div>
                      </div>

                      {offerError && (
                        <p className="text-xs text-[#C0392B] dark:text-rose-400 font-semibold">
                          ⚠ {offerError}
                        </p>
                      )}

                      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#4F86D9]/20 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => setIsOfferFormOpen(false)}
                          className="px-4 py-2 text-xs font-semibold text-[#667085] dark:text-slate-400 hover:text-[#263244] dark:hover:text-slate-200 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 rounded-xl bg-[#4F86D9] hover:bg-[#3568B5] text-white text-xs font-bold shadow-soft flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Proposal</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* 3. RECEIVED OFFERS SECTION (Displayed for Owner or Relevant Users) */}
      {isOwner && wishOffers.length > 0 && (
        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#E0E7F0] dark:border-slate-800 p-5 sm:p-7 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-[#E0E7F0] dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-[#4F86D9]" />
              <h2 className="text-base font-bold text-[#263244] dark:text-slate-100">
                Proposals Received for this Wish ({wishOffers.length})
              </h2>
            </div>
            <span className="text-xs text-[#667085] dark:text-slate-400">
              Target: <strong className="text-[#287A55] dark:text-emerald-400 font-mono">{formatBaht(wish.budget)}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wishOffers.map((off) => (
              <div
                key={off.id}
                className="p-4 rounded-2xl border border-[#E0E7F0] dark:border-slate-700 bg-[#F7F9FC] dark:bg-slate-800/70 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar
                      src={allUsers?.[off.sellerId]?.avatarUrl || allUsers?.[off.sellerId]?.avatar}
                      name={off.sellerName}
                      size="sm"
                      className="w-8 h-8 rounded-lg"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#263244] dark:text-slate-100 block">
                        {off.sellerName}
                      </span>
                      <span className="text-[11px] text-[#667085] dark:text-slate-400">
                        ★ {off.sellerRating.toFixed(1)} · Offered {off.createdAt}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-extrabold font-mono text-[#287A55] dark:text-emerald-400">
                      {formatBaht(off.offeredPrice)}
                    </span>
                    <span className="text-[10px] uppercase font-bold block text-[#667085] dark:text-slate-400">
                      {off.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#667085] dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-[#E0E7F0]/60 dark:border-slate-700">
                  {off.details}
                </p>

                {off.status === 'PENDING' && (
                  <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
                    {onDeclineOffer && (
                      <button
                        type="button"
                        onClick={() => onDeclineOffer(off.id)}
                        className="px-3.5 py-2 text-xs text-[#C0392B] dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/50 rounded-xl font-semibold cursor-pointer min-h-[40px]"
                      >
                        Decline
                      </button>
                    )}
                    {onAcceptOffer && (
                      <button
                        type="button"
                        onClick={() => onAcceptOffer(off)}
                        className="px-4 py-2 rounded-xl bg-[#287A55] hover:bg-[#206345] text-white text-xs font-bold shadow-soft transition-colors cursor-pointer min-h-[40px]"
                      >
                        Accept Proposal
                      </button>
                    )}
                  </div>
                )}

                {off.status === 'DECLINED' && (
                  <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                    <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">Offer declined</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {onUndoDeclineOffer && (
                        <button
                          type="button"
                          onClick={() => onUndoDeclineOffer(off.id)}
                          className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                          <span>Cancel Decline</span>
                        </button>
                      )}
                      {onAcceptOffer && (
                        <button
                          type="button"
                          onClick={() => onAcceptOffer(off)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#287A55] hover:bg-[#206345] text-white text-xs font-bold shadow-soft transition-colors cursor-pointer"
                        >
                          Accept Proposal
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. RELATED BUYER DEMAND IN THIS CATEGORY */}
      {relatedWishes.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#263244] dark:text-slate-100 tracking-tight">
              More Buyer Wishes in {wish.category}
            </h3>
            <button
              type="button"
              onClick={() => {
                if (onSelectCategory) {
                  onSelectCategory(wish.category);
                }
                onBackToBrowse();
              }}
              className="text-xs font-bold text-[#4F86D9] hover:text-[#3568B5] flex items-center gap-1 cursor-pointer"
            >
              <span>Explore category</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedWishes.map((item) => {
              const itemImg = item.images && item.images.length > 0 ? item.images[0] : item.imageUrl;
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectWish(item)}
                  className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E0E7F0] dark:border-slate-800 hover:border-[#4F86D9]/40 dark:hover:border-[#4F86D9]/50 p-3.5 shadow-soft hover:shadow-card-hover transition-all duration-150 cursor-pointer flex items-center gap-3 group"
                >
                  <div className="w-16 h-16 rounded-xl bg-[#F7F9FC] dark:bg-slate-800 border border-[#E0E7F0] dark:border-slate-700 overflow-hidden shrink-0">
                    {itemImg ? (
                      <img
                        src={itemImg}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#667085] dark:text-slate-500">
                        <Tag className="w-5 h-5 opacity-40" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-[#263244] dark:text-slate-100 group-hover:text-[#4F86D9] transition-colors truncate">
                      {item.title}
                    </h4>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-[10px] text-[#667085] dark:text-slate-400">Budget:</span>
                      <span className="text-xs font-extrabold font-mono text-[#287A55] dark:text-emerald-400">
                        {formatBaht(item.budget)}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#667085] dark:text-slate-400 block mt-0.5 truncate">
                      By {item.buyerName} · {item.offersCount} offers
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
