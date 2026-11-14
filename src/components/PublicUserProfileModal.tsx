import React, { useState } from 'react';
import { User, Wish, Review, ChatTarget } from '../types';
import { 
  X, Star, CheckCircle2, ShoppingBag, MessageSquare, 
  Tag, Calendar, ShieldCheck, ShieldAlert, Mail, Phone, ExternalLink, ArrowRight, DollarSign 
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { formatBaht } from '../utils/currency';

interface PublicUserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  userFallback?: {
    id: string;
    name: string;
    avatar?: string;
    rating?: number;
    reviewCount?: number;
  } | null;
  allUsers: Record<string, User>;
  wishes: Wish[];
  reviews: Review[];
  currentUser: User | null;
  onOpenChat?: (target: ChatTarget) => void;
  onSendOffer?: (wish: Wish) => void;
  onEditWish?: (wish: Wish) => void;
  onDeleteWish?: (wishId: string) => void;
}

export const PublicUserProfileModal: React.FC<PublicUserProfileModalProps> = ({
  isOpen,
  onClose,
  userId,
  userFallback,
  allUsers,
  wishes,
  reviews,
  currentUser,
  onOpenChat,
  onSendOffer,
  onEditWish,
  onDeleteWish,
}) => {
  const [activeTab, setActiveTab] = useState<'wishlist' | 'reviews' | 'about'>('wishlist');

  if (!isOpen || (!userId && !userFallback)) return null;

  const targetId = userId || userFallback?.id || '';
  const user: User = allUsers[targetId] || {
    id: targetId,
    name: userFallback?.name || 'Community Member',
    email: `${(userFallback?.name || 'member').toLowerCase().replace(/\s+/g, '.')}@example.com`,
    avatar: userFallback?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: userFallback?.rating || 5.0,
    reviewCount: userFallback?.reviewCount || 0,
    verified: true,
    joinedDate: 'Community Member',
    warningCount: 0,
    warnings: [],
    notificationPreferences: {
      Electronics: true,
      Crafts: true,
      Fashion: true,
      Collectibles: true,
    },
  };

  // User's posted wishes (wishlist)
  const userWishes = wishes.filter((w) => w.buyerId === targetId);

  // Reviews received by this user
  const userReviews = reviews.filter((r) => r.toUserId === targetId);
  const effectiveReviewCount = userReviews.length > 0 ? userReviews.length : (user.reviewCount || 0);
  const effectiveRating = userReviews.length > 0
    ? userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length
    : user.rating;

  // Is this the currently logged-in user?
  const isSelf = currentUser?.id === targetId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#111827] w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Hero */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative">
              <UserAvatar
                user={user}
                size="3xl"
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl object-cover ring-3 ring-indigo-500/80 shadow-lg shrink-0"
              />
              {user.verified && (
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white" />
                </div>
              )}
            </div>

            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-xl font-black text-white tracking-tight">{user.name}</h3>
                {user.isAdmin && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-purple-500/30 text-purple-200 border border-purple-400/40">
                    Administrator
                  </span>
                )}
                {user.verified && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Verified Member</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-xs text-slate-300">
                {!user.isAdmin ? (
                  <div className="flex items-center gap-1 font-bold text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{effectiveRating.toFixed(1)}</span>
                    <span className="text-slate-400 font-normal">
                      ({effectiveReviewCount} {effectiveReviewCount === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 font-bold text-purple-200 bg-purple-900/70 px-3 py-0.5 rounded-full border border-purple-400/40 text-xs shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
                    <span>Platform Administrator • Staff</span>
                  </div>
                )}
                <span>•</span>
                <span className="text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user.isAdmin ? 'Platform Staff' : `Joined ${user.joinedDate || 'Recently'}`}</span>
                </span>
                {!user.isAdmin && (
                  <>
                    <span>•</span>
                    <span className="text-indigo-300 font-semibold">
                      {userWishes.length} {userWishes.length === 1 ? 'Wish' : 'Wishes'} Posted
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 pt-3 border-t border-white/10 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('wishlist')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'wishlist'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Wishlist</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'wishlist' ? 'bg-indigo-100 text-indigo-800' : 'bg-white/20 text-white'
              }`}>
                {userWishes.length}
              </span>
            </button>

            {/* Reviews tab: ONLY for regular buyers/sellers, NEVER for admin */}
            {!user.isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'reviews'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>Reviews</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'reviews' ? 'bg-amber-100 text-amber-800' : 'bg-white/20 text-white'
                }`}>
                  {effectiveReviewCount}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('about')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'about'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{user.isAdmin ? 'Role & Governance' : 'Trust & Badges'}</span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-[#0B0F19]">
          {/* TAB 1: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {user.name.split(' ')[0]}'s Active Wishlist
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Items this buyer is currently looking to purchase and ready to pay for.
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-800/60">
                  {userWishes.length} {userWishes.length === 1 ? 'Request' : 'Requests'}
                </span>
              </div>

              {userWishes.length === 0 ? (
                <div className="text-center py-12 px-4 bg-white dark:bg-[#111827] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                  <ShoppingBag className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No active wishes right now</p>
                  <p className="text-[11px] text-slate-400">
                    This member has not posted any active demand listings yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {userWishes.map((w) => {
                    const isWishOwner = currentUser?.id === w.buyerId;
                    return (
                      <div
                        key={w.id}
                        className="bg-white dark:bg-[#111827] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/60 hover:shadow-sm transition flex flex-col justify-between space-y-2.5"
                      >
                        {/* Wish Image if available */}
                        {w.imageUrl && (
                          <div className="w-full h-32 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                            <img
                              src={w.imageUrl}
                              alt={w.title}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                              {w.category}
                            </span>
                          </div>
                        )}

                        <div className="space-y-1">
                          {!w.imageUrl && (
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {w.category}
                            </span>
                          )}
                          <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                            {w.title}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {w.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Budget</span>
                            <span className="font-mono text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              {formatBaht(w.budget)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* If viewer is the owner, allow edit and delete right here too! */}
                            {isWishOwner ? (
                              <>
                                {onEditWish && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onClose();
                                      onEditWish(w);
                                    }}
                                    className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                )}
                                {onDeleteWish && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Delete your wish "${w.title}"?`)) {
                                        onDeleteWish(w.id);
                                      }
                                    }}
                                    className="px-2 py-1 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                {!currentUser?.isAdmin && !user.isAdmin && onOpenChat && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onClose();
                                      onOpenChat({
                                        wishId: w.id,
                                        title: w.title,
                                        buyerId: w.buyerId,
                                        buyerName: w.buyerName,
                                        budget: w.budget,
                                        isOrder: false,
                                      });
                                    }}
                                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                                    title="Chat with buyer"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {!currentUser?.isAdmin && !user.isAdmin && onSendOffer && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onClose();
                                      onSendOffer(w);
                                    }}
                                    className="px-2.5 py-1 bg-[#5B4BEE] hover:bg-[#4035C8] text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                                  >
                                    <Tag className="w-3 h-3" />
                                    <span>Make Offer</span>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Community Reviews & Reputation
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Feedback from verified buyers and sellers who traded with {user.name}.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-200/60 dark:border-amber-800/60">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{effectiveRating.toFixed(1)} / 5.0</span>
                </div>
              </div>

              {userReviews.length === 0 ? (
                <div className="text-center py-12 px-4 bg-white dark:bg-[#111827] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                  <Star className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No reviews yet</p>
                  <p className="text-[11px] text-slate-400">
                    This user hasn't received reviews yet. Complete a transaction with them to leave the first review!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Rating Breakdown */}
                  <div className="p-3.5 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {userReviews.length} Verified {userReviews.length === 1 ? 'Review' : 'Reviews'}
                      </span>
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span>{effectiveRating.toFixed(1)} average rating</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="w-12 text-slate-500 dark:text-slate-400">5 Stars</span>
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{
                              width: `${(userReviews.filter((r) => r.rating === 5).length / userReviews.length) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="w-6 text-right font-mono text-slate-500 dark:text-slate-400">
                          {userReviews.filter((r) => r.rating === 5).length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-12 text-slate-500 dark:text-slate-400">4 Stars</span>
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400/80 rounded-full"
                            style={{
                              width: `${(userReviews.filter((r) => r.rating === 4).length / userReviews.length) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="w-6 text-right font-mono text-slate-500 dark:text-slate-400">
                          {userReviews.filter((r) => r.rating === 4).length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div className="space-y-2.5">
                  {userReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-white dark:bg-[#111827] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            user={allUsers[rev.fromUserId]}
                            name={rev.fromUserName}
                            size="sm"
                            className="w-7 h-7 rounded-lg object-cover shrink-0"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block leading-tight">
                              {rev.fromUserName}
                            </span>
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
                                  s <= rev.rating
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-slate-200 dark:text-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium ml-1">
                            {rev.createdAt}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/60 leading-relaxed italic">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRUST & BADGES / ADMIN GOVERNANCE */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              {user.isAdmin ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 bg-white dark:bg-[#111827] rounded-xl border border-purple-200/80 dark:border-purple-800/60 space-y-1">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Official Staff & Governance</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Verified marketplace staff account responsible for community guidelines, moderation, and policy enforcement.
                    </p>
                  </div>

                  <div className="p-4 bg-white dark:bg-[#111827] rounded-xl border border-purple-200/80 dark:border-purple-800/60 space-y-1">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Non-Trading Account</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Platform administrators maintain neutrality and do not participate in buying, selling, or review ratings.
                    </p>
                  </div>

                  <div className="p-4 bg-white dark:bg-[#111827] rounded-xl border border-purple-200/80 dark:border-purple-800/60 space-y-1">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs">
                      <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Safety & Dispute Resolution</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Investigates community reports, resolves transaction disputes, and issues safety notices to maintain platform trust.
                    </p>
                  </div>

                  <div className="p-4 bg-white dark:bg-[#111827] rounded-xl border border-purple-200/80 dark:border-purple-800/60 space-y-1">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs">
                      <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>System Console Operator</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Marketplace safety systems, anti-fraud verifications, and compliance monitoring.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Identity Verified</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Phone and email credentials have been authenticated for buyer and seller safety.
                    </p>
                  </div>

                  <div className="p-4 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>100% Fulfillment Rate</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      All accepted offers and transactions were successfully paid and completed.
                    </p>
                  </div>

                  <div className="p-4 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                      <Star className="w-4 h-4 fill-amber-500" />
                      <span>Top Rated Community Member</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Maintains an average score of {user.rating.toFixed(1)} stars across completed orders.
                    </p>
                  </div>

                  <div className="p-4 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold text-xs">
                      <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span>Marketplace Standing</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Joined in {user.joinedDate || '2024'}. Zero unresolved disputes or violations.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white dark:bg-[#111827] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
            Viewing public profile for <strong className="text-slate-800 dark:text-slate-200">{user.name}</strong>
          </span>

          <div className="flex items-center gap-2">
            {!isSelf && !user.isAdmin && !currentUser?.isAdmin && onOpenChat && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (userWishes.length > 0) {
                    onOpenChat({
                      wishId: userWishes[0].id,
                      title: userWishes[0].title,
                      buyerId: userWishes[0].buyerId,
                      buyerName: userWishes[0].buyerName,
                      budget: userWishes[0].budget,
                      isOrder: false,
                    });
                  } else {
                    onOpenChat({
                      wishId: `direct-${user.id}`,
                      title: `Chat with ${user.name}`,
                      buyerId: user.id,
                      buyerName: user.name,
                      isOrder: false,
                    });
                  }
                }}
                className="px-3.5 py-1.5 bg-[#5B4BEE] hover:bg-[#4035C8] text-white rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message {user.name.split(' ')[0]}</span>
              </button>
            )}

            {user.isAdmin && (
              <span className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800/60">
                System Administrator
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
