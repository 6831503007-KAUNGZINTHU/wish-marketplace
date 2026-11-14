import React, { useState, useEffect } from 'react';
import { Offer, Transaction, Review, User, ChatTarget, Wish } from '../types';
import { 
  CheckCircle2, Clock, Star, Package, 
  MessageSquare, Check, X, 
  Send, Inbox, ShieldAlert, RotateCcw,
  Edit3, Trash2, ShoppingBag, PlusCircle, ExternalLink, Layers
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { AdminRemoveOfferModal } from './AdminRemoveOfferModal';
import { formatBaht } from '../utils/currency';
import { HubQuickTab } from './Navbar';

interface TransactionsSectionProps {
  currentUser: User | null;
  allUsers?: Record<string, User>;
  wishes?: Wish[];
  offers: Offer[];
  transactions: Transaction[];
  reviews: Review[];
  requestedTab?: { tab: HubQuickTab; subTab?: 'received' | 'sent' | 'declined'; nonce: number } | null;
  onAcceptOffer: (offer: Offer) => void;
  onDeclineOffer: (offerId: string) => void;
  onUndoDeclineOffer?: (offerId: string) => void;
  onRemoveOfferAsAdmin?: (offer: Offer, reason?: string) => Promise<void> | void;
  onWithdrawOffer?: (offerId: string) => void;
  onEditOffer?: (offer: Offer) => void;
  onEditWish?: (wish: Wish) => void;
  onDeleteWish?: (wish: Wish) => void;
  onSelectWish?: (wish: Wish) => void;
  onNavigateToPost?: () => void;
  onCompleteTransaction: (transactionId: string) => void;
  onSubmitReview: (transactionId: string, rating: number, comment: string) => void;
  onRequireAuth: () => void;
  onOpenChat: (target: ChatTarget) => void;
  onViewUserProfile?: (userId: string, userFallback?: { id: string; name: string; avatar?: string; rating?: number; reviewCount?: number }) => void;
}

export const TransactionsSection: React.FC<TransactionsSectionProps> = ({
  currentUser,
  allUsers,
  wishes = [],
  offers,
  transactions,
  reviews,
  requestedTab,
  onAcceptOffer,
  onDeclineOffer,
  onUndoDeclineOffer,
  onRemoveOfferAsAdmin,
  onWithdrawOffer,
  onEditOffer,
  onEditWish,
  onDeleteWish,
  onSelectWish,
  onNavigateToPost,
  onCompleteTransaction,
  onSubmitReview,
  onRequireAuth,
  onOpenChat,
  onViewUserProfile,
}) => {
  const [activeTab, setActiveTab] = useState<HubQuickTab>(currentUser?.isAdmin ? 'offers' : 'overview');
  const [offerSubTab, setOfferSubTab] = useState<'received' | 'sent' | 'declined'>('received');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'declined'>('all');
  const [reviewForms, setReviewForms] = useState<Record<string, { rating: number; comment: string; submitted?: boolean }>>({});
  const [removingOffer, setRemovingOffer] = useState<Offer | null>(null);

  useEffect(() => {
    if (currentUser?.isAdmin && activeTab === 'overview') {
      setActiveTab('offers');
    }
  }, [currentUser?.isAdmin, activeTab]);

  useEffect(() => {
    if (!requestedTab) return;
    setActiveTab(currentUser?.isAdmin && requestedTab.tab === 'overview' ? 'offers' : requestedTab.tab);
    if (requestedTab.subTab) {
      setOfferSubTab(requestedTab.subTab);
      setStatusFilter(requestedTab.subTab === 'declined' ? 'declined' : 'all');
    }
  }, [requestedTab, currentUser?.isAdmin]);

  const myWishes = currentUser && !currentUser.isAdmin
    ? wishes.filter((w) => w.buyerId === currentUser.id)
    : [];
  
  // State for recently accepted offer banner
  const [recentlyAccepted, setRecentlyAccepted] = useState<{
    offer: Offer;
    orderId?: string;
  } | null>(null);

  // Filter offers based on the logged-in user (ignoring administrative removals)
  const allReceivedOffers = currentUser?.isAdmin
    ? offers.filter((o) => o.status !== 'CLOSED' && o.status !== 'REMOVED_BY_ADMIN')
    : offers.filter((o) => o.status !== 'CLOSED' && o.status !== 'REMOVED_BY_ADMIN' && (!currentUser || o.buyerId === currentUser.id));

  const allSentOffers = currentUser?.isAdmin
    ? []
    : offers.filter((o) => o.status !== 'CLOSED' && o.status !== 'REMOVED_BY_ADMIN' && (currentUser ? o.sellerId === currentUser.id : false));

  const allDeclinedOffers = currentUser?.isAdmin
    ? offers.filter((o) => o.status === 'DECLINED')
    : offers.filter(
        (o) =>
          o.status === 'DECLINED' &&
          (currentUser ? o.buyerId === currentUser.id || o.sellerId === currentUser.id : true)
      );

  const filteredReceivedOffers = allReceivedOffers.filter((o) => {
    if (statusFilter === 'pending') return o.status === 'PENDING';
    if (statusFilter === 'declined') return o.status === 'DECLINED';
    return true;
  });

  const filteredSentOffers = allSentOffers.filter((o) => {
    if (statusFilter === 'pending') return o.status === 'PENDING';
    if (statusFilter === 'declined') return o.status === 'DECLINED';
    return true;
  });

  const pendingReceivedCount = allReceivedOffers.filter((o) => o.status === 'PENDING').length;
  const pendingSentCount = allSentOffers.filter((o) => o.status === 'PENDING').length;
  const totalDeclinedCount = allDeclinedOffers.length;

  const activeOrders = currentUser?.isAdmin
    ? transactions
    : transactions.filter(
        (tx) => !currentUser || tx.buyerId === currentUser.id || tx.sellerId === currentUser.id
      );

  const handleRatingSelect = (transactionId: string, star: number) => {
    setReviewForms((prev) => ({
      ...prev,
      [transactionId]: {
        ...(prev[transactionId] || { rating: 5, comment: '' }),
        rating: star,
      },
    }));
  };

  const handleCommentChange = (transactionId: string, comment: string) => {
    setReviewForms((prev) => ({
      ...prev,
      [transactionId]: {
        ...(prev[transactionId] || { rating: 5, comment: '' }),
        comment,
      },
    }));
  };

  const handleSendReview = (transactionId: string) => {
    if (!currentUser || currentUser.isAdmin) return;
    const form = reviewForms[transactionId] || { rating: 5, comment: '' };
    onSubmitReview(
      transactionId,
      form.rating || 5,
      form.comment.trim() || 'Item received in pristine condition, great seller communication!'
    );

    setReviewForms((prev) => ({
      ...prev,
      [transactionId]: {
        ...prev[transactionId],
        submitted: true,
      },
    }));
  };

  const handleAcceptAndOpenChat = (offer: Offer) => {
    if (!currentUser || currentUser.isAdmin) {
      onRequireAuth();
      return;
    }

    onAcceptOffer(offer);
    setRecentlyAccepted({ offer });
    setActiveTab('orders');
  };

  const getWishForId = (wishId: string) => wishes.find((w) => w.id === wishId);
  const getWishThumb = (wishId: string) => {
    const w = getWishForId(wishId);
    return w?.images?.[0] || w?.imageUrl;
  };

  const openChatForOffer = (offer: Offer) => {
    if (!currentUser || currentUser.isAdmin) {
      return;
    }
    const w = getWishForId(offer.wishId);
    onOpenChat({
      wishId: offer.wishId,
      title: offer.wishTitle,
      wishImage: w?.images?.[0] || w?.imageUrl,
      category: offer.category || w?.category,
      wishStatus: w?.status,
      buyerId: offer.buyerId,
      buyerName: offer.buyerName,
      sellerId: offer.sellerId,
      sellerName: offer.sellerName,
      budget: offer.targetBudget,
      offerId: offer.id,
      offerPrice: offer.offeredPrice,
      offerStatus: offer.status,
      offerDetails: offer.details,
      isOrder: false,
    });
  };

  const openChatForOrder = (tx: Transaction) => {
    if (!currentUser || currentUser.isAdmin) {
      return;
    }
    const w = getWishForId(tx.wishId);
    onOpenChat({
      wishId: tx.wishId,
      title: tx.wishTitle,
      wishImage: w?.images?.[0] || w?.imageUrl,
      category: tx.category || w?.category,
      wishStatus: w?.status,
      buyerId: tx.buyerId,
      buyerName: tx.buyerName,
      sellerId: tx.sellerId,
      sellerName: tx.sellerName,
      agreedPrice: tx.agreedPrice,
      budget: tx.targetBudget,
      isOrder: true,
      orderId: tx.id,
      status: tx.status,
      trackingNumber: tx.trackingNumber,
    });
  };

  return (
    <div className="space-y-6">
      {/* Accepted Offer Immediate Banner */}
      {recentlyAccepted && (
        <div className="bg-emerald-600 rounded-2xl p-4 sm:p-5 text-white shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                  Offer Accepted!
                </span>
                <span className="text-xs text-emerald-100 font-medium">
                  Order is now In Progress
                </span>
              </div>
              <h3 className="text-base font-bold mt-0.5">
                Connected with {recentlyAccepted.offer.sellerName} for "{recentlyAccepted.offer.wishTitle}"
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Agreed price: <strong className="text-white">{formatBaht(recentlyAccepted.offer.offeredPrice)}</strong>. You can now chat directly to arrange shipping.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
            <button
              onClick={() => {
                const targetOffer = recentlyAccepted.offer;
                openChatForOffer(targetOffer);
                setRecentlyAccepted(null);
              }}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold shadow-soft flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-700" />
              <span>Chat with Seller</span>
            </button>
            <button
              onClick={() => setRecentlyAccepted(null)}
              className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#EAECF0] dark:border-slate-800 shadow-soft p-4 sm:p-6 space-y-5">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAECF0] dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#172033] dark:text-slate-100 tracking-tight">
              My Wishes & Offers
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-400 mt-0.5">
              Quickly view and edit your own wishes, manage sent or received offers, track orders, and write reviews.
            </p>
          </div>

          {/* Tab Buttons */}
          <div className="flex items-center bg-[#F7F8FC] dark:bg-slate-800/80 p-1 rounded-xl border border-[#EAECF0] dark:border-slate-700 text-xs w-full sm:w-auto overflow-x-auto scrollbar-none">
            {!currentUser?.isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex-1 sm:flex-initial justify-center px-3 py-2 sm:py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'bg-white dark:bg-slate-700 text-[#172033] dark:text-sky-300 shadow-soft'
                    : 'text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#4F86D9]" />
                <span>All My Items</span>
                <span className="text-[11px] text-[#667085] dark:text-slate-300 tabular-nums">
                  ({myWishes.length + allSentOffers.length})
                </span>
              </button>
            )}

            {!currentUser?.isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('my_wishes')}
                className={`flex-1 sm:flex-initial justify-center px-3 py-2 sm:py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'my_wishes'
                    ? 'bg-white dark:bg-slate-700 text-[#172033] dark:text-sky-300 shadow-soft'
                    : 'text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-slate-200'
                }`}
              >
                <span>My Wishes</span>
                <span className="text-[11px] text-[#667085] dark:text-slate-300 tabular-nums">
                  ({myWishes.length})
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('offers')}
              className={`flex-1 sm:flex-initial justify-center px-3 py-2 sm:py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'offers'
                  ? 'bg-white dark:bg-slate-700 text-[#172033] dark:text-sky-300 shadow-soft'
                  : 'text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-slate-200'
              }`}
            >
              <span>Offers</span>
              {(pendingReceivedCount + pendingSentCount) > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#4F86D9] text-white font-mono font-bold tabular-nums">
                  {pendingReceivedCount + pendingSentCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`flex-1 sm:flex-initial justify-center px-3 py-2 sm:py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-white dark:bg-slate-700 text-[#172033] dark:text-sky-300 shadow-soft'
                  : 'text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-slate-200'
              }`}
            >
              <span>Orders</span>
              <span className="text-[11px] text-[#667085] dark:text-slate-300 tabular-nums">
                ({activeOrders.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 sm:flex-initial justify-center px-3 py-2 sm:py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'reviews'
                  ? 'bg-white dark:bg-slate-700 text-[#172033] dark:text-sky-300 shadow-soft'
                  : 'text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-slate-200'
              }`}
            >
              Reviews ({reviews.length})
            </button>
          </div>
        </div>

        {/* OVERVIEW TAB: BOTH MY WISHES & MY OFFERS IN ONE DIRECT WORKSPACE */}
        {activeTab === 'overview' && !currentUser?.isAdmin && (
          <div className="space-y-6">
            {/* Section 1: My Posted Wishes */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[#172033] dark:text-slate-100">
                    My Posted Wishes ({myWishes.length})
                  </h2>
                  <p className="text-xs text-[#667085] dark:text-slate-400">
                    Edit budget, photos, or specifications directly in one click.
                  </p>
                </div>
                {onNavigateToPost && (
                  <button
                    type="button"
                    onClick={onNavigateToPost}
                    className="px-3.5 py-1.5 rounded-xl bg-[#172033] dark:bg-[#4F86D9] hover:bg-[#243B64] dark:hover:bg-[#3568B5] text-white text-xs font-bold flex items-center gap-1.5 shadow-soft transition cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Post New Wish</span>
                  </button>
                )}
              </div>

              {myWishes.length === 0 ? (
                <div className="p-6 bg-[#F7F8FC] dark:bg-slate-800/60 rounded-2xl border border-dashed border-[#EAECF0] dark:border-slate-700 text-center space-y-2">
                  <p className="text-sm font-bold text-[#172033] dark:text-slate-200">No wishes posted yet</p>
                  <p className="text-xs text-[#667085] dark:text-slate-400">
                    Post what you want to buy with your target budget to start receiving direct seller offers.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                  {myWishes.map((w) => {
                    const thumb = w.images?.[0] || w.imageUrl;
                    return (
                      <div
                        key={w.id}
                        className="p-4 rounded-2xl border border-[#EAECF0] dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-soft flex flex-col justify-between gap-3.5 hover:border-[#4F86D9]/50 transition"
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className="w-16 h-16 rounded-xl bg-[#F7F9FC] dark:bg-slate-900 border border-[#E0E7F0] dark:border-slate-700 overflow-hidden shrink-0">
                            {thumb ? (
                              <img src={thumb} alt={w.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#667085]">
                                <ShoppingBag className="w-5 h-5 opacity-40" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-medium text-[#667085] dark:text-slate-400 truncate">
                                {w.category} · {w.status.replace('_', ' ')} · {w.offersCount} {w.offersCount === 1 ? 'offer' : 'offers'}
                              </span>
                              <span className="text-sm font-extrabold font-mono text-[#287A55] dark:text-emerald-400 tabular-nums shrink-0">
                                {formatBaht(w.budget)}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100 truncate">
                              {w.title}
                            </h3>
                            <p className="text-xs text-[#667085] dark:text-slate-400 line-clamp-1">
                              {w.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#EAECF0] dark:border-slate-700">
                          <span className="text-[11px] text-[#667085] dark:text-slate-400">Posted {w.createdAt}</span>
                          <div className="flex items-center gap-2">
                            {onSelectWish && (
                              <button
                                type="button"
                                onClick={() => onSelectWish(w)}
                                className="px-2.5 py-1.5 rounded-xl bg-[#F7F9FC] dark:bg-slate-900 hover:bg-[#EDF4FF] dark:hover:bg-slate-700 text-xs font-semibold text-[#263244] dark:text-slate-200 border border-[#E0E7F0] dark:border-slate-700 flex items-center gap-1 cursor-pointer transition"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                            )}
                            {onEditWish && (
                              <button
                                type="button"
                                onClick={() => onEditWish(w)}
                                className="px-3 py-1.5 rounded-xl bg-[#4F86D9] hover:bg-[#3568B5] text-white text-xs font-bold flex items-center gap-1 shadow-soft cursor-pointer transition"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit Wish</span>
                              </button>
                            )}
                            {onDeleteWish && (
                              <button
                                type="button"
                                onClick={() => onDeleteWish(w)}
                                className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 cursor-pointer transition"
                                title="Delete wish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 2: My Submitted Offers */}
            <div className="space-y-3 pt-4 border-t border-[#EAECF0] dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[#172033] dark:text-slate-100">
                    My Submitted Offers ({allSentOffers.length})
                  </h2>
                  <p className="text-xs text-[#667085] dark:text-slate-400">
                    Adjust your offer price or item notes anytime while awaiting a buyer decision.
                  </p>
                </div>
                {allSentOffers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('offers');
                      setOfferSubTab('sent');
                    }}
                    className="text-xs font-semibold text-[#4F86D9] hover:underline cursor-pointer"
                  >
                    Manage all sent offers →
                  </button>
                )}
              </div>

              {allSentOffers.length === 0 ? (
                <div className="p-6 bg-[#F7F8FC] dark:bg-slate-800/60 rounded-2xl border border-dashed border-[#EAECF0] dark:border-slate-700 text-center space-y-1.5">
                  <p className="text-sm font-bold text-[#172033] dark:text-slate-200">No offers submitted yet</p>
                  <p className="text-xs text-[#667085] dark:text-slate-400">
                    Browse buyer requests in the feed and submit a proposal to appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                  {allSentOffers.map((offer) => {
                    const thumb = getWishThumb(offer.wishId);
                    const isDeclined = offer.status === 'DECLINED';
                    return (
                      <div
                        key={offer.id}
                        className={`p-4 rounded-2xl border bg-white dark:bg-slate-800/80 shadow-soft flex flex-col justify-between gap-3 ${
                          isDeclined
                            ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/15 dark:bg-rose-950/20'
                            : 'border-[#EAECF0] dark:border-slate-700 hover:border-[#4F86D9]/50 transition'
                        }`}
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className="w-16 h-16 rounded-xl bg-[#F7F9FC] dark:bg-slate-900 border border-[#E0E7F0] dark:border-slate-700 overflow-hidden shrink-0">
                            {thumb ? (
                              <img src={thumb} alt={offer.wishTitle} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#667085]">
                                <Package className="w-5 h-5 opacity-40" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-medium text-[#667085] dark:text-slate-400 truncate">
                                To {offer.buyerName} · {offer.status}
                              </span>
                              <span className="text-sm font-extrabold font-mono text-[#287A55] dark:text-emerald-400 tabular-nums shrink-0">
                                {formatBaht(offer.offeredPrice)}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100 truncate">
                              {offer.wishTitle}
                            </h3>
                            <p className="text-xs text-[#667085] dark:text-slate-400 line-clamp-1">
                              {offer.details}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#EAECF0] dark:border-slate-700">
                          <span className="text-[11px] text-[#667085] dark:text-slate-400 tabular-nums">
                            Budget {formatBaht(offer.targetBudget)} · {offer.createdAt}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openChatForOffer(offer)}
                              className="px-2.5 py-1.5 rounded-xl bg-[#EDF4FF] dark:bg-[#4F86D9]/15 hover:bg-[#DCE9FF] text-[#243B64] dark:text-sky-300 border border-[#4F86D9]/25 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Chat</span>
                            </button>
                            {onEditOffer && offer.status !== 'ACCEPTED' && (
                              <button
                                type="button"
                                onClick={() => onEditOffer(offer)}
                                className="px-3 py-1.5 rounded-xl bg-[#4F86D9] hover:bg-[#3568B5] text-white text-xs font-bold flex items-center gap-1 shadow-soft cursor-pointer transition"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit Offer</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 3: Pending Offers Received on Your Wishes */}
            {allReceivedOffers.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-[#EAECF0] dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-[#172033] dark:text-slate-100">
                      Offers Received on Your Wishes ({allReceivedOffers.length})
                    </h2>
                    <p className="text-xs text-[#667085] dark:text-slate-400">
                      Review seller proposals, negotiate in chat, or accept an offer to start an order.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('offers');
                      setOfferSubTab('received');
                    }}
                    className="text-xs font-semibold text-[#4F86D9] hover:underline cursor-pointer"
                  >
                    Open full inbox →
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  {allReceivedOffers.slice(0, 4).map((offer) => {
                    const thumb = getWishThumb(offer.wishId);
                    const isDeclined = offer.status === 'DECLINED';
                    return (
                      <div
                        key={offer.id}
                        className="p-4 rounded-2xl border border-[#EAECF0] dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <div className="w-14 h-14 rounded-xl bg-[#F7F9FC] dark:bg-slate-900 border border-[#E0E7F0] dark:border-slate-700 overflow-hidden shrink-0">
                            {thumb ? (
                              <img src={thumb} alt={offer.wishTitle} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#667085]">
                                <Package className="w-5 h-5 opacity-40" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100 truncate">
                                {offer.wishTitle}
                              </h3>
                              <span className="text-[11px] font-medium text-[#667085] dark:text-slate-400">
                                · From {offer.sellerName} (★ {offer.sellerRating.toFixed(1)})
                              </span>
                            </div>
                            <p className="text-xs text-[#667085] dark:text-slate-400 line-clamp-1">
                              {offer.details}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                          <div className="text-right mr-1">
                            <span className="text-[10px] text-[#667085] dark:text-slate-400 block uppercase font-semibold">Offer</span>
                            <span className="text-sm font-extrabold font-mono text-[#287A55] dark:text-emerald-400 tabular-nums">
                              {formatBaht(offer.offeredPrice)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => openChatForOffer(offer)}
                            className="px-3 py-1.5 rounded-xl bg-[#F7F9FC] dark:bg-slate-900 hover:bg-[#EDF4FF] dark:hover:bg-slate-700 text-[#172033] dark:text-slate-200 border border-[#EAECF0] dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-[#4F86D9]" />
                            <span>Chat</span>
                          </button>
                          {!isDeclined && (
                            <button
                              type="button"
                              onClick={() => handleAcceptAndOpenChat(offer)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#287A55] hover:bg-[#206345] text-white text-xs font-bold flex items-center gap-1.5 shadow-soft cursor-pointer transition"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Accept</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MY WISHES TAB (Direct 1-Click Access & Edit for Own Products/Wishes) */}
        {activeTab === 'my_wishes' && !currentUser?.isAdmin && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Manage and edit your posted buyer requests directly without opening profile settings.
              </p>
              {onNavigateToPost && (
                <button
                  type="button"
                  onClick={onNavigateToPost}
                  className="px-3.5 py-1.5 rounded-xl bg-[#4F86D9] hover:bg-[#3568B5] text-white text-xs font-bold flex items-center gap-1.5 shadow-soft transition cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Post New Wish</span>
                </button>
              )}
            </div>

            {myWishes.length === 0 ? (
              <div className="p-8 bg-[#F7F8FC] dark:bg-slate-800/60 rounded-2xl border border-dashed border-[#EAECF0] dark:border-slate-700 text-center space-y-2.5">
                <ShoppingBag className="w-8 h-8 text-[#667085] dark:text-slate-400 mx-auto opacity-50" />
                <p className="text-sm font-bold text-[#172033] dark:text-slate-200">You haven't posted any wishes yet</p>
                <p className="text-xs text-[#667085] dark:text-slate-400 max-w-sm mx-auto">
                  Post what you want to buy along with your target budget, and verified sellers will send offers.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {myWishes.map((w) => {
                  const thumb = w.images?.[0] || w.imageUrl;
                  return (
                    <div
                      key={w.id}
                      className="p-4 rounded-2xl border border-[#EAECF0] dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#4F86D9]/50 transition"
                    >
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div className="w-16 h-16 rounded-xl bg-[#F7F9FC] dark:bg-slate-900 border border-[#E0E7F0] dark:border-slate-700 overflow-hidden shrink-0">
                          {thumb ? (
                            <img src={thumb} alt={w.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#667085]">
                              <ShoppingBag className="w-5 h-5 opacity-40" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="text-[11px] font-medium text-[#667085] dark:text-slate-400">
                            {w.category} · {w.status.replace('_', ' ')} · <span className="text-[#4F86D9] font-semibold">{w.offersCount} {w.offersCount === 1 ? 'offer' : 'offers'}</span>
                          </div>
                          <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100 truncate">
                            {w.title}
                          </h3>
                          <p className="text-xs text-[#667085] dark:text-slate-400 line-clamp-1">
                            {w.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EAECF0] dark:border-slate-700">
                        <span className="text-base font-extrabold font-mono text-[#287A55] dark:text-emerald-400 tabular-nums">
                          {formatBaht(w.budget)}
                        </span>

                        <div className="flex items-center gap-2 flex-wrap">
                          {onSelectWish && (
                            <button
                              type="button"
                              onClick={() => onSelectWish(w)}
                              className="px-2.5 py-1.5 rounded-xl bg-[#F7F9FC] dark:bg-slate-900 hover:bg-[#EDF4FF] dark:hover:bg-slate-700 text-xs font-semibold text-[#263244] dark:text-slate-200 border border-[#E0E7F0] dark:border-slate-700 flex items-center gap-1 cursor-pointer transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                          )}
                          {onEditWish && (
                            <button
                              type="button"
                              onClick={() => onEditWish(w)}
                              className="px-3 py-1.5 rounded-xl bg-[#4F86D9] hover:bg-[#3568B5] text-white text-xs font-bold flex items-center gap-1 shadow-soft cursor-pointer transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit Wish</span>
                            </button>
                          )}
                          {onDeleteWish && (
                            <button
                              type="button"
                              onClick={() => onDeleteWish(w)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
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

        {/* OFFERS TAB */}
        {activeTab === 'offers' && (
          <div className="space-y-4">
            {currentUser?.isAdmin ? (
              <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 rounded-xl text-xs space-y-1 text-purple-900 dark:text-purple-200">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldAlert className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                  <span>Admin Moderation Mode: All Platform Offers</span>
                </div>
                <p className="text-purple-800 dark:text-purple-300">
                  You are logged in as Administrator. You oversee all marketplace offers and can remove non-compliant submissions.
                </p>
              </div>
            ) : (
              /* Subtabs: Received vs Sent vs Declined */
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAECF0] dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setOfferSubTab('received');
                      setStatusFilter('all');
                    }}
                    className={`px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                      offerSubTab === 'received'
                        ? 'bg-[#172033] dark:bg-[#4F86D9] text-white shadow-soft'
                        : 'bg-[#F7F8FC] dark:bg-slate-800 text-[#667085] dark:text-slate-300 hover:text-[#172033] dark:hover:text-white hover:bg-[#EAECF0] dark:hover:bg-slate-700'
                    }`}
                  >
                    <Inbox className="w-3.5 h-3.5" />
                    <span>Offers Received</span>
                    {allReceivedOffers.length > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                        offerSubTab === 'received' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {allReceivedOffers.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOfferSubTab('sent');
                      setStatusFilter('all');
                    }}
                    className={`px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                      offerSubTab === 'sent'
                        ? 'bg-[#172033] dark:bg-[#4F86D9] text-white shadow-soft'
                        : 'bg-[#F7F8FC] dark:bg-slate-800 text-[#667085] dark:text-slate-300 hover:text-[#172033] dark:hover:text-white hover:bg-[#EAECF0] dark:hover:bg-slate-700'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Offers Sent</span>
                    {allSentOffers.length > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                        offerSubTab === 'sent' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {allSentOffers.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOfferSubTab('declined');
                      setStatusFilter('declined');
                    }}
                    className={`px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                      offerSubTab === 'declined'
                        ? 'bg-rose-600 text-white shadow-soft'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200/70 dark:border-rose-800/50'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Declined ({totalDeclinedCount})</span>
                  </button>
                </div>

                {/* Status Filter */}
                {(offerSubTab === 'received' || offerSubTab === 'sent') && (
                  <div className="flex items-center gap-1.5 text-xs self-start sm:self-auto">
                    <span className="text-[11px] text-[#667085] dark:text-slate-400 font-medium mr-0.5">Filter:</span>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        statusFilter === 'all'
                          ? 'bg-[#172033] dark:bg-[#4F86D9] text-white shadow-soft'
                          : 'bg-[#F7F8FC] dark:bg-slate-800 text-[#667085] dark:text-slate-300 hover:bg-[#EAECF0] dark:hover:bg-slate-700'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('pending')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        statusFilter === 'pending'
                          ? 'bg-[#4F86D9] text-white shadow-soft'
                          : 'bg-[#F7F8FC] dark:bg-slate-800 text-[#667085] dark:text-slate-300 hover:bg-[#EAECF0] dark:hover:bg-slate-700'
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('declined')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                        statusFilter === 'declined'
                          ? 'bg-rose-600 text-white shadow-soft'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200/60 dark:border-rose-800/50'
                      }`}
                    >
                      <span>Declined</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* RECEIVED OFFERS LIST */}
            {(currentUser?.isAdmin || offerSubTab === 'received') && (
              <div className="space-y-3">
                {filteredReceivedOffers.length === 0 ? (
                  <div className="p-8 bg-[#F7F8FC] dark:bg-slate-800/60 rounded-2xl border border-dashed border-[#EAECF0] dark:border-slate-700 text-center text-xs text-[#667085] dark:text-slate-400">
                    <p className="font-semibold text-[#172033] dark:text-slate-200">
                      {statusFilter === 'declined'
                        ? 'No declined offers in your received history'
                        : 'No offers received for your wishes yet'}
                    </p>
                    <p className="text-[#667085] dark:text-slate-400 mt-1">
                      When sellers find your wish, their direct proposals will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredReceivedOffers.map((offer) => {
                      const savings = offer.targetBudget - offer.offeredPrice;
                      const isUnderBudget = savings >= 0;
                      const isDeclined = offer.status === 'DECLINED';
                      const thumb = getWishThumb(offer.wishId);

                      return (
                        <div
                          key={offer.id}
                          className={`p-4 sm:p-5 rounded-2xl border bg-white dark:bg-slate-800/80 shadow-soft transition-all space-y-3 ${
                            isDeclined
                              ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/15 dark:bg-rose-950/20'
                              : 'border-[#EAECF0] dark:border-slate-700 hover:border-[#D0D5DD] dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className="w-14 h-14 rounded-xl bg-[#F7F9FC] dark:bg-slate-900 border border-[#E0E7F0] dark:border-slate-700 overflow-hidden shrink-0">
                                {thumb ? (
                                  <img src={thumb} alt={offer.wishTitle} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[#667085]">
                                    <Package className="w-5 h-5 opacity-40" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-medium text-[#667085] dark:text-slate-400">
                                  {offer.category || 'Offer'} · {isDeclined ? 'Declined' : 'Offer on Your Wish'}
                                </div>
                                <h4 className="text-sm sm:text-base font-bold text-[#172033] dark:text-slate-100 truncate">
                                  {offer.wishTitle}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <UserAvatar
                                    user={allUsers?.[offer.sellerId]}
                                    name={offer.sellerName}
                                    size="xs"
                                    className="w-4 h-4 rounded-full object-cover shrink-0"
                                  />
                                  <p className="text-xs text-[#667085] dark:text-slate-400">
                                    Offered by{' '}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onViewUserProfile?.(offer.sellerId, {
                                          id: offer.sellerId,
                                          name: offer.sellerName,
                                          avatar: allUsers?.[offer.sellerId]?.avatar,
                                          rating: offer.sellerRating,
                                        })
                                      }
                                      className="text-[#172033] dark:text-slate-200 font-semibold hover:text-[#4F86D9] dark:hover:text-sky-400 hover:underline cursor-pointer"
                                    >
                                      {offer.sellerName}
                                    </button>{' '}
                                    (★ {offer.sellerRating.toFixed(1)})
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Price Comparison */}
                            <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 bg-[#F7F8FC] dark:bg-slate-900 p-2.5 rounded-xl border border-[#EAECF0] dark:border-slate-700 w-full sm:w-auto flex-wrap">
                              <div className="text-left sm:text-right">
                                <span className="text-[10px] text-[#667085] dark:text-slate-400 block uppercase font-semibold">Your Budget</span>
                                <span className="text-xs font-semibold text-[#667085] dark:text-slate-400 line-through">
                                  {formatBaht(offer.targetBudget)}
                                </span>
                              </div>
                              <div className="h-6 w-px bg-[#EAECF0] dark:bg-slate-700" />
                              <div className="text-right">
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block uppercase font-bold">Offer Price</span>
                                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                                  {formatBaht(offer.offeredPrice)}
                                </span>
                              </div>
                              {isUnderBudget && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-[10px] font-bold">
                                  Save {formatBaht(savings)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Details */}
                          <div className="text-xs text-[#172033] dark:text-slate-200 bg-[#F7F8FC] dark:bg-slate-900 p-3 rounded-xl border border-[#EAECF0] dark:border-slate-700">
                            <span className="font-semibold text-[#667085] dark:text-slate-400">Seller Note: </span>
                            {offer.details}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#EAECF0] dark:border-slate-700">
                            <span className="text-[11px] text-[#667085] dark:text-slate-400">
                              Submitted {offer.createdAt}
                            </span>

                            <div className="flex items-center gap-2 flex-wrap">
                              {!currentUser?.isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => openChatForOffer(offer)}
                                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#172033] dark:text-slate-200 hover:text-[#243B64] dark:hover:text-sky-300 bg-[#F7F8FC] dark:bg-slate-900 hover:bg-[#EDF4FF] dark:hover:bg-[#4F86D9]/20 border border-[#EAECF0] dark:border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-[#4F86D9]" />
                                  <span>Chat with {offer.sellerName}</span>
                                </button>
                              )}

                              {!currentUser?.isAdmin ? (
                                isDeclined ? (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold px-1">Offer declined</span>
                                    {onUndoDeclineOffer && (
                                      <button
                                        type="button"
                                        onClick={() => onUndoDeclineOffer(offer.id)}
                                        className="px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:text-amber-900 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800/50 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                                        title="Cancel decline and restore this offer to Pending"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                                        <span>Cancel Decline</span>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleAcceptAndOpenChat(offer)}
                                      className="px-3.5 py-1.5 rounded-xl bg-[#287A55] hover:bg-[#206345] text-white text-xs font-semibold shadow-soft flex items-center gap-1.5 transition cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Accept Offer</span>
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => onDeclineOffer(offer.id)}
                                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/50 rounded-xl transition cursor-pointer flex items-center gap-1"
                                    >
                                      <X className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                      <span>Decline</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleAcceptAndOpenChat(offer)}
                                      className="px-4 py-1.5 rounded-xl bg-[#287A55] hover:bg-[#206345] text-white text-xs font-semibold shadow-soft flex items-center gap-1.5 transition cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Accept Offer</span>
                                    </button>
                                  </>
                                )
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setRemovingOffer(offer)}
                                  className="px-3 py-1.5 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/50 rounded-xl font-bold cursor-pointer transition shadow-2xs hover:shadow-soft"
                                >
                                  Remove as Admin
                                </button>
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

            {/* SENT OFFERS LIST */}
            {!currentUser?.isAdmin && offerSubTab === 'sent' && (
              <div className="space-y-3">
                {filteredSentOffers.length === 0 ? (
                  <div className="p-8 bg-[#F7F8FC] dark:bg-slate-800/60 rounded-2xl border border-dashed border-[#EAECF0] dark:border-slate-700 text-center text-xs text-[#667085] dark:text-slate-400">
                    <p className="font-semibold text-[#172033] dark:text-slate-200">No offers sent by you yet</p>
                    <p className="text-[#667085] dark:text-slate-400 mt-1">Browse buyer requests in the feed and click "Make an Offer" to propose your items.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredSentOffers.map((offer) => {
                      const isDeclined = offer.status === 'DECLINED';
                      const thumb = getWishThumb(offer.wishId);

                      return (
                        <div
                          key={offer.id}
                          className={`p-4 sm:p-5 rounded-2xl border bg-white dark:bg-slate-800/80 shadow-soft transition-all space-y-3 ${
                            isDeclined
                              ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/15 dark:bg-rose-950/20'
                              : 'border-[#EAECF0] dark:border-slate-700 hover:border-[#D0D5DD] dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className="w-14 h-14 rounded-xl bg-[#F7F9FC] dark:bg-slate-900 border border-[#E0E7F0] dark:border-slate-700 overflow-hidden shrink-0">
                                {thumb ? (
                                  <img src={thumb} alt={offer.wishTitle} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[#667085]">
                                    <Package className="w-5 h-5 opacity-40" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-medium text-[#667085] dark:text-slate-400">
                                  {offer.category || 'Offer'} · {isDeclined ? 'Declined' : 'Awaiting Decision'}
                                </div>
                                <h4 className="text-sm sm:text-base font-bold text-[#172033] dark:text-slate-100 truncate">
                                  {offer.wishTitle}
                                </h4>
                                <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
                                  Proposal sent to <strong className="text-[#172033] dark:text-slate-200">{offer.buyerName}</strong>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 bg-[#F7F8FC] dark:bg-slate-900 p-2 rounded-xl border border-[#EAECF0] dark:border-slate-700">
                              <div className="text-right">
                                <span className="text-[10px] text-[#667085] dark:text-slate-400 block uppercase font-medium">Target Budget</span>
                                <span className="text-xs font-semibold text-[#667085] dark:text-slate-400">
                                  {formatBaht(offer.targetBudget)}
                                </span>
                              </div>
                              <div className="h-6 w-px bg-[#EAECF0] dark:bg-slate-700" />
                              <div className="text-right">
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block uppercase font-bold">Your Offer</span>
                                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                                  {formatBaht(offer.offeredPrice)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-xs text-[#172033] dark:text-slate-200 bg-[#F7F8FC] dark:bg-slate-900 p-3 rounded-xl border border-[#EAECF0] dark:border-slate-700">
                            <span className="font-semibold text-[#667085] dark:text-slate-400">Your Note: </span>
                            {offer.details}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#EAECF0] dark:border-slate-700">
                            <span className="text-[11px] text-[#667085] dark:text-slate-400">Sent {offer.createdAt}</span>

                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => openChatForOffer(offer)}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#243B64] dark:text-sky-300 bg-[#EDF4FF] dark:bg-[#4F86D9]/15 hover:bg-[#DCE9FF] dark:hover:bg-[#4F86D9]/25 border border-[#4F86D9]/25 flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Chat with {offer.buyerName}</span>
                              </button>

                              {onEditOffer && offer.status !== 'ACCEPTED' && (
                                <button
                                  type="button"
                                  onClick={() => onEditOffer(offer)}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#4F86D9] hover:bg-[#3568B5] flex items-center gap-1.5 shadow-soft transition cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit Offer</span>
                                </button>
                              )}

                              {!isDeclined && onWithdrawOffer && (
                                <button
                                  type="button"
                                  onClick={() => onWithdrawOffer(offer.id)}
                                  className="px-3 py-1.5 text-xs text-[#667085] dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg cursor-pointer"
                                >
                                  Withdraw Offer
                                </button>
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

            {/* DECLINED TAB */}
            {!currentUser?.isAdmin && offerSubTab === 'declined' && (
              <div className="space-y-3">
                {allDeclinedOffers.length === 0 ? (
                  <div className="p-8 bg-[#F7F8FC] dark:bg-slate-800/60 rounded-2xl border border-dashed border-[#EAECF0] dark:border-slate-700 text-center text-xs text-[#667085] dark:text-slate-400">
                    <p className="font-semibold text-[#172033] dark:text-slate-200">No declined offers</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {allDeclinedOffers.map((offer) => {
                      const isBuyer = !currentUser || currentUser.id === offer.buyerId;
                      return (
                        <div
                          key={offer.id}
                          className="p-4 sm:p-5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/15 dark:bg-rose-950/20 shadow-soft space-y-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm sm:text-base font-bold text-[#172033] dark:text-slate-100">
                                  {offer.wishTitle}
                                </h4>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/50 flex items-center gap-1">
                                  <X className="w-3 h-3 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                                  <span>Declined</span>
                                </span>
                              </div>
                              <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
                                Buyer: <strong className="text-[#172033] dark:text-slate-200">{offer.buyerName}</strong> • Seller: <strong className="text-[#172033] dark:text-slate-200">{offer.sellerName}</strong>
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono block">
                                {formatBaht(offer.offeredPrice)}
                              </span>
                              <span className="text-[10px] text-[#667085] dark:text-slate-400">
                                Target: {formatBaht(offer.targetBudget)}
                              </span>
                            </div>
                          </div>

                          {offer.details && (
                            <div className="text-xs text-[#172033] dark:text-slate-200 bg-white dark:bg-slate-900 p-3 rounded-xl border border-[#EAECF0] dark:border-slate-700">
                              <span className="font-semibold text-[#667085] dark:text-slate-400">Seller Note: </span>
                              {offer.details}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-rose-200/60 dark:border-rose-900/50">
                            <span className="text-[11px] text-[#667085] dark:text-slate-400">
                              {offer.declinedAt ? `Declined ${offer.declinedAt}` : `Submitted ${offer.createdAt}`}
                            </span>

                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => openChatForOffer(offer)}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#172033] dark:text-slate-200 hover:text-[#243B64] dark:hover:text-sky-300 bg-white dark:bg-slate-900 hover:bg-[#EDF4FF] dark:hover:bg-[#4F86D9]/20 border border-[#EAECF0] dark:border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-[#4F86D9]" />
                                <span>Chat with {isBuyer ? offer.sellerName : offer.buyerName}</span>
                              </button>

                              {!isBuyer && onEditOffer && (
                                <button
                                  type="button"
                                  onClick={() => onEditOffer(offer)}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#4F86D9] hover:bg-[#3568B5] flex items-center gap-1.5 shadow-soft transition cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit Offer</span>
                                </button>
                              )}

                              {isBuyer && (
                                <>
                                  {onUndoDeclineOffer && (
                                    <button
                                      type="button"
                                      onClick={() => onUndoDeclineOffer(offer.id)}
                                      className="px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:text-amber-900 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800/50 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                                      title="Cancel decline and restore this offer to Pending"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                                      <span>Cancel Decline</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleAcceptAndOpenChat(offer)}
                                    className="px-3.5 py-1.5 rounded-xl bg-[#287A55] hover:bg-[#206345] text-white text-xs font-semibold shadow-soft flex items-center gap-1.5 transition cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Accept Offer</span>
                                  </button>
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
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {activeOrders.length === 0 ? (
              <div className="p-8 bg-[#F7F8FC] dark:bg-slate-800/60 rounded-2xl border border-dashed border-[#EAECF0] dark:border-slate-700 text-center text-xs text-[#667085] dark:text-slate-400">
                <p className="font-semibold text-[#172033] dark:text-slate-200">No orders created yet</p>
                <p className="text-[#667085] dark:text-slate-400 mt-1">Accepting an offer creates an order with mutual chat, delivery tracking, and reviews.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {activeOrders.map((tx) => {
                  const formState = reviewForms[tx.id] || { rating: 5, comment: '' };
                  const isCompleted = tx.status === 'COMPLETED';
                  const isCurrentUserBuyer = currentUser?.id === tx.buyerId;
                  const isCurrentUserSeller = currentUser?.id === tx.sellerId;
                  const otherPartyName = isCurrentUserBuyer ? tx.sellerName : tx.buyerName;

                  return (
                    <div
                      key={tx.id}
                      className="p-4 sm:p-5 rounded-2xl border border-[#EAECF0] dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-soft space-y-3.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm sm:text-base font-bold text-[#172033] dark:text-slate-100">
                              {tx.wishTitle}
                            </h4>
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#F7F8FC] dark:bg-slate-900 text-[#667085] dark:text-slate-400 font-semibold border border-[#EAECF0] dark:border-slate-700">
                              #{tx.id}
                            </span>
                          </div>

                          <div className="text-xs text-[#667085] dark:text-slate-400 mt-1.5 flex flex-wrap items-center gap-2">
                            <span>Buyer: <strong className="text-[#172033] dark:text-slate-200">{tx.buyerName}</strong></span>
                            <span>•</span>
                            <span>Seller: <strong className="text-[#172033] dark:text-slate-200">{tx.sellerName}</strong></span>
                            <span>•</span>
                            <span>{tx.createdAt}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="text-right">
                            <span className="text-[10px] text-[#667085] dark:text-slate-400 block uppercase font-medium">Agreed Price</span>
                            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                              {formatBaht(tx.agreedPrice)}
                            </span>
                          </div>

                          <span className={`px-2.5 py-1 rounded-xl text-xs font-semibold ${
                            isCompleted
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                          }`}>
                            {isCompleted ? 'Delivered' : 'In Progress'}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-[#F7F8FC] dark:bg-slate-900 rounded-xl border border-[#EAECF0] dark:border-slate-700 text-xs flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-[#667085] dark:text-slate-400">
                          <Package className="w-4 h-4 text-[#4F86D9] shrink-0" />
                          <span>Tracking: <strong className="font-mono text-[#172033] dark:text-slate-200">{tx.trackingNumber || 'USPS-9400-8812-4410-01'}</strong></span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {!currentUser?.isAdmin && (isCurrentUserBuyer || isCurrentUserSeller) && (
                            <button
                              type="button"
                              onClick={() => openChatForOrder(tx)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#172033] dark:bg-[#4F86D9] hover:bg-[#243B64] dark:hover:bg-[#3568B5] text-white font-semibold text-xs flex items-center gap-1.5 shadow-soft transition cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Chat with {otherPartyName}</span>
                            </button>
                          )}

                          {!isCompleted ? (
                            <button
                              type="button"
                              onClick={() => onCompleteTransaction(tx.id)}
                              className="px-3 py-1.5 rounded-xl bg-[#287A55] hover:bg-[#206345] text-white font-semibold text-xs flex items-center gap-1.5 shadow-soft transition cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Mark as Delivered</span>
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              Delivered
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Review Prompts */}
                      {isCompleted && !tx.buyerReviewed && !currentUser?.isAdmin && isCurrentUserBuyer && (
                        <div className="p-3.5 bg-[#EDF4FF]/60 dark:bg-[#1A2436] rounded-xl border border-[#4F86D9]/25 text-xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#172033] dark:text-slate-100">Rate seller {tx.sellerName}:</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => handleRatingSelect(tx.id, star)}
                                  className="cursor-pointer p-0.5"
                                >
                                  <Star
                                    className={`w-4 h-4 ${
                                      star <= formState.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Write a review about the item condition..."
                              value={formState.comment}
                              onChange={(e) => handleCommentChange(tx.id, e.target.value)}
                              className="flex-1 bg-white dark:bg-slate-900 border border-[#EAECF0] dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-[#172033] dark:text-slate-100 focus:border-[#4F86D9] outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSendReview(tx.id)}
                              className="px-3.5 py-1.5 bg-[#4F86D9] hover:bg-[#3568B5] text-white rounded-xl font-semibold text-xs shadow-soft transition cursor-pointer"
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-2xl border border-[#EAECF0] dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-soft space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-[#172033] dark:text-slate-100">{rev.rating}.0</span>
                    </div>
                    <span className="text-[11px] text-[#667085] dark:text-slate-400">{rev.createdAt}</span>
                  </div>

                  <p className="text-xs text-[#667085] dark:text-slate-300 italic">
                    "{rev.comment}"
                  </p>

                  <div className="text-[11px] text-[#667085] dark:text-slate-400 pt-1.5 border-t border-[#EAECF0] dark:border-slate-700 flex items-center justify-between">
                    <span>From: <strong className="text-[#172033] dark:text-slate-200">{rev.fromUserName}</strong></span>
                    <span>To: <strong className="text-[#172033] dark:text-slate-200">{rev.toUserName}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Admin Remove Offer Confirmation Modal */}
      <AdminRemoveOfferModal
        isOpen={Boolean(removingOffer)}
        offer={removingOffer}
        onClose={() => setRemovingOffer(null)}
        onConfirmRemoval={async (offerId, reason) => {
          if (onRemoveOfferAsAdmin && removingOffer) {
            await onRemoveOfferAsAdmin(removingOffer, reason);
          }
          setRemovingOffer(null);
        }}
      />
    </div>
  );
};
