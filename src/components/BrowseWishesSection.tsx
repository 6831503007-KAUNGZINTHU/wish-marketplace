import React, { useState } from 'react';
import { Wish, User, Offer } from '../types';
import {
  ArrowRight, Search, LayoutGrid, List, Sparkles,
  X, PlusCircle, Tag, ChevronLeft, ChevronRight,
  Image as ImageIcon, Edit3
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { formatBaht } from '../utils/currency';
import { searchAndRankWishes, searchAndRankOffers } from '../utils/wishSearch';

interface BrowseWishesSectionProps {
  wishes: Wish[];
  offers?: Offer[];
  currentUser: User | null;
  allUsers?: Record<string, User>;
  onSelectWish: (wish: Wish) => void;
  onOpenChat?: (wish: Wish) => void;
  onSubmitOffer?: (wish: Wish, offeredPrice: number, details: string) => void;
  onRequireAuth: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  onDeleteWish?: (wishId: string) => void;
  onRequestDeleteWish?: (wish: Wish) => void;
  onEditWish?: (wish: Wish) => void;
  onEditOffer?: (offer: Offer) => void;
  onWarnBuyer?: (wish: Wish) => void;
  onViewUserProfile?: (userId: string, userFallback?: { id: string; name: string; avatar?: string; rating?: number; reviewCount?: number }) => void;
  onNavigateToPost?: () => void;
}

const CardImagePreview: React.FC<{
  images: string[];
  title: string;
  category: string;
  isFlagged?: boolean;
  isOwner?: boolean;
}> = ({ images, title, category, isFlagged, isOwner }) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const total = images.length;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPhotoIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPhotoIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  };

  if (total === 0) {
    return (
      <div className="relative aspect-4/3 bg-[#F7F9FC] dark:bg-slate-800/80 border-b border-[#E0E7F0] dark:border-slate-800 flex flex-col items-center justify-center text-[#667085] dark:text-slate-400">
        <ImageIcon className="w-8 h-8 stroke-[1.5] opacity-40 mb-1" />
        <span className="text-[11px] font-medium">No photo</span>
        <div className="absolute top-2.5 left-2.5 pointer-events-none">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-slate-900 text-[#263244] dark:text-slate-200 border border-[#E0E7F0] dark:border-slate-700 shadow-2xs">
            {category}
          </span>
        </div>
      </div>
    );
  }

  const currentPhoto = images[photoIndex] || images[0];

  return (
    <div className="relative aspect-4/3 bg-[#F7F9FC] dark:bg-slate-800 border-b border-[#E0E7F0] dark:border-slate-800 overflow-hidden group/img">
      <img
        src={currentPhoto}
        alt={`${title} - preview ${photoIndex + 1}`}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
        loading="lazy"
      />

      {/* Minimal Corner Markers (Only Flagged or Owner, no pill stack) */}
      {(isFlagged || isOwner) && (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 pointer-events-none z-10">
          {isFlagged && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#B7791F] text-white">
              Flagged
            </span>
          )}
          {isOwner && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#172033]/90 text-white backdrop-blur-xs">
              Yours
            </span>
          )}
        </div>
      )}

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#243B64]/75 hover:bg-[#243B64] text-white flex items-center justify-center opacity-90 sm:opacity-0 sm:group-hover/img:opacity-100 transition-opacity duration-150 backdrop-blur-xs shadow-md z-20 cursor-pointer active:scale-95"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#243B64]/75 hover:bg-[#243B64] text-white flex items-center justify-center opacity-90 sm:opacity-0 sm:group-hover/img:opacity-100 transition-opacity duration-150 backdrop-blur-xs shadow-md z-20 cursor-pointer active:scale-95"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1 pointer-events-none z-10">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={`block rounded-full transition-all duration-150 ${
                  photoIndex === idx
                    ? 'w-3.5 h-1.5 bg-[#4F86D9] shadow-xs'
                    : 'w-1.5 h-1.5 bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const BrowseWishesSection: React.FC<BrowseWishesSectionProps> = ({
  wishes,
  offers = [],
  currentUser,
  allUsers,
  onSelectWish,
  onEditWish,
  onEditOffer,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onViewUserProfile,
  onNavigateToPost,
}) => {
  const [sortBy, setSortBy] = useState<'newest' | 'budget_high' | 'budget_low'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [feedScope, setFeedScope] = useState<'all' | 'mine'>('all');
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);

  const categories = [
    'All',
    'Electronics',
    'Crafts',
    'Fashion',
    'Collectibles',
    'Food',
    'Home',
    'Books',
    'Toys',
    'Sports',
    'Other'
  ];

  const hasQuery = searchQuery.trim().length > 0;

  const myWishesCount = currentUser && !currentUser.isAdmin
    ? wishes.filter((w) => w.buyerId === currentUser.id).length
    : 0;
  const myOffersList = currentUser && !currentUser.isAdmin
    ? offers.filter((o) => o.sellerId === currentUser.id && o.status !== 'CLOSED' && o.status !== 'REMOVED_BY_ADMIN')
    : [];

  // Filter & rank wishes: scope + category + smart multi-field/fuzzy search
  const scopedWishes = feedScope === 'all'
    ? wishes
    : wishes.filter((wish) => currentUser && wish.buyerId === currentUser.id);

  const filteredWishes = searchAndRankWishes(scopedWishes, searchQuery, {
    category: selectedCategory,
    sortBy,
  });

  // Matching Offers when searching OR viewing "My Wishes & Offers"
  const activeOffersList = offers.filter(
    (o) => o.status !== 'CLOSED' && o.status !== 'REMOVED_BY_ADMIN'
  );
  const scopedOffers = feedScope === 'mine' && currentUser
    ? activeOffersList.filter((off) => off.sellerId === currentUser.id)
    : activeOffersList;

  const matchedOffers = hasQuery
    ? searchAndRankOffers(scopedOffers, searchQuery, selectedCategory)
    : feedScope === 'mine'
    ? myOffersList
    : [];

  return (
    <div className="space-y-5">
      {/* 1. FIRST-TIME USER INTRODUCTION BANNER */}
      {!bannerDismissed && !hasQuery && (
        <div className="relative bg-gradient-to-r from-[#EDF4FF] via-white to-[#EDF4FF]/70 dark:from-[#162238] dark:via-[#111827] dark:to-[#162238] rounded-2xl border border-[#4F86D9]/25 dark:border-[#4F86D9]/30 p-4 sm:p-5 shadow-soft overflow-hidden transition-all duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#243B64] dark:bg-[#4F86D9] text-white shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <h2 className="text-sm sm:text-base font-extrabold text-[#263244] dark:text-slate-100 tracking-tight">
                  Looking for something? Post a wish. Have it? Send an offer.
                </h2>
              </div>
              <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
                WishMarket is a reverse marketplace: search for any product, post your target budget, or send direct price offers.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 pt-1 text-[11px] font-medium text-[#263244] dark:text-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4F86D9] shrink-0" />
                  <span><strong>Buyers:</strong> Set your target price & requirements</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#243B64] dark:bg-sky-400 shrink-0" />
                  <span><strong>Sellers:</strong> Tap any wish to inspect and propose offers</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full md:w-auto shrink-0 self-start md:self-center pt-1 md:pt-0">
              {onNavigateToPost && (
                <button
                  type="button"
                  onClick={onNavigateToPost}
                  className="flex-1 sm:flex-initial justify-center px-4 py-2.5 sm:py-2 rounded-xl bg-[#4F86D9] hover:bg-[#3568B5] active:bg-[#3568B5] text-white text-xs font-bold shadow-soft hover:shadow-card-hover flex items-center gap-1.5 transition-all duration-150 cursor-pointer min-h-[40px]"
                >
                  <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Post a Wish</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                className="p-2 text-[#667085] dark:text-slate-400 hover:text-[#263244] dark:hover:text-slate-100 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                title="Dismiss guide banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Feed Control Bar: Categories, Sort & View Toggle */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E0E7F0] dark:border-slate-800 p-3.5 sm:p-5 shadow-soft space-y-3.5 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E0E7F0] dark:border-slate-800 pb-3.5">
          <div className="flex items-center justify-between sm:justify-start gap-3 flex-wrap">
            <div className="flex items-baseline gap-2.5">
              <h1 className="text-base sm:text-xl font-bold text-[#172033] dark:text-slate-100 tracking-tight">
                {feedScope === 'mine' ? 'My Wishes & Offers' : 'Buyer Demand Feed'}
              </h1>
              <span className="text-xs font-medium text-[#667085] dark:text-slate-400 tabular-nums">
                {filteredWishes.length} {filteredWishes.length === 1 ? 'wish' : 'wishes'}
              </span>
            </div>

            {currentUser && !currentUser.isAdmin && (
              <div className="inline-flex items-center p-0.5 rounded-lg bg-[#F7F9FC] dark:bg-slate-800 border border-[#E0E7F0] dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setFeedScope('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    feedScope === 'all'
                      ? 'bg-white dark:bg-slate-900 text-[#172033] dark:text-white shadow-xs'
                      : 'text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white'
                  }`}
                >
                  All Feed
                </button>
                <button
                  type="button"
                  onClick={() => setFeedScope('mine')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    feedScope === 'mine'
                      ? 'bg-white dark:bg-slate-900 text-[#4F86D9] dark:text-sky-300 shadow-xs'
                      : 'text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white'
                  }`}
                >
                  My Items ({myWishesCount + myOffersList.length})
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
            <div className="flex items-center bg-[#F7F9FC] dark:bg-slate-800 p-1 rounded-xl border border-[#E0E7F0] dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-[#263244] dark:text-slate-100 shadow-xs'
                    : 'text-[#667085] dark:text-slate-400 hover:text-[#263244] dark:hover:text-slate-200'
                }`}
                title="Grid View"
                aria-label="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-[#263244] dark:text-slate-100 shadow-xs'
                    : 'text-[#667085] dark:text-slate-400 hover:text-[#263244] dark:hover:text-slate-200'
                }`}
                title="List View"
                aria-label="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#667085] dark:text-slate-400 flex-1 sm:flex-initial justify-end">
              <span className="hidden sm:inline font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full sm:w-auto bg-[#F7F9FC] dark:bg-slate-800 border border-[#E0E7F0] dark:border-slate-700 rounded-xl px-2.5 py-2 sm:py-1.5 text-xs font-semibold text-[#263244] dark:text-slate-100 focus:outline-none focus:border-[#4F86D9] cursor-pointer"
              >
                <option value="newest">{hasQuery ? 'Most Relevant' : 'Recently Posted'}</option>
                <option value="budget_high">Highest Budget (฿)</option>
                <option value="budget_low">Lowest Budget (฿)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#243B64] dark:bg-[#4F86D9] text-white shadow-soft font-bold'
                  : 'bg-white dark:bg-slate-800/80 hover:bg-[#EDF4FF]/50 dark:hover:bg-slate-800 text-[#667085] dark:text-slate-400 hover:text-[#263244] dark:hover:text-slate-100 border border-[#E0E7F0] dark:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MATCHED SELLER OFFERS / MY SUBMITTED OFFERS STRIP */}
      {(hasQuery || feedScope === 'mine') && matchedOffers.length > 0 && (
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E0E7F0] dark:border-slate-800 p-4 sm:p-5 shadow-soft space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#4F86D9]" />
              <h2 className="text-sm font-bold text-[#172033] dark:text-slate-100">
                {feedScope === 'mine' && !hasQuery
                  ? `Your Submitted Offers (${matchedOffers.length})`
                  : `Matching Seller Offers (${matchedOffers.length})`}
              </h2>
            </div>
            <span className="text-xs text-[#667085] dark:text-slate-400">
              {feedScope === 'mine' && !hasQuery ? 'Click Edit Offer to update price or terms' : 'Direct offers matching your search'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {matchedOffers.map((off) => {
              const relatedWish = wishes.find((w) => w.id === off.wishId);
              const thumb = relatedWish?.images?.[0] || relatedWish?.imageUrl;
              const isOwnOffer = Boolean(currentUser && off.sellerId === currentUser.id);

              return (
                <div
                  key={off.id}
                  onClick={() => {
                    if (relatedWish) onSelectWish(relatedWish);
                  }}
                  className="p-3.5 rounded-xl border border-[#E0E7F0] dark:border-slate-800 bg-[#F7F9FC] dark:bg-slate-800/60 hover:border-[#4F86D9]/60 transition cursor-pointer flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-[#E0E7F0] dark:border-slate-700 shrink-0">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={off.wishTitle}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#4F86D9]">
                          <Tag className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#667085] dark:text-slate-400">
                        <span className="font-semibold text-[#243B64] dark:text-sky-300">{off.status}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">Seller: {off.sellerName}</span>
                      </div>
                      <h3 className="text-xs font-bold text-[#172033] dark:text-slate-100 truncate">
                        {off.wishTitle}
                      </h3>
                      <p className="text-[11px] text-[#667085] dark:text-slate-300 line-clamp-1">
                        {off.details}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                    <div>
                      <span className="text-sm font-extrabold font-mono text-[#287A55] dark:text-emerald-400 block tabular-nums">
                        {formatBaht(off.offeredPrice)}
                      </span>
                      <span className="text-[10px] text-[#667085] dark:text-slate-400 tabular-nums">
                        Budget {formatBaht(off.targetBudget)}
                      </span>
                    </div>
                    {isOwnOffer && onEditOffer && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditOffer(off);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#4F86D9] hover:bg-[#3568B5] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Offer</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredWishes.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-[#111827] rounded-2xl border border-dashed border-[#E0E7F0] dark:border-slate-800 shadow-soft space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EDF4FF] dark:bg-[#4F86D9]/15 text-[#4F86D9] mx-auto flex items-center justify-center">
            <Search className="w-6 h-6 stroke-[2]" />
          </div>
          <h3 className="text-base font-bold text-[#263244] dark:text-slate-100">No matching wishes found</h3>
          <p className="text-xs text-[#667085] dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Try adjusting your search keywords or reset your filters to browse all active wishes.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 bg-white dark:bg-slate-800 text-[#263244] dark:text-slate-200 border border-[#E0E7F0] dark:border-slate-700 hover:bg-[#F7F9FC] dark:hover:bg-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
            {onNavigateToPost && (
              <button
                type="button"
                onClick={onNavigateToPost}
                className="px-4 py-2 bg-[#4F86D9] hover:bg-[#3568B5] text-white text-xs font-bold rounded-xl shadow-soft transition-colors cursor-pointer"
              >
                Post a Wish
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWishes.map((wish) => {
            const isOwner = Boolean(currentUser && wish.buyerId === currentUser.id);
            const buyerAvatar = wish.buyerAvatarUrl || allUsers?.[wish.buyerId]?.avatarUrl || wish.buyerAvatar || allUsers?.[wish.buyerId]?.avatar;
            const wishImages = wish.images && wish.images.length > 0
              ? wish.images
              : (wish.imageUrl ? [wish.imageUrl] : []);

            return (
              <div
                key={wish.id}
                tabIndex={0}
                role="button"
                aria-label={`View details for ${wish.title}`}
                onClick={() => onSelectWish(wish)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectWish(wish);
                  }
                }}
                className={`group bg-white dark:bg-[#111827] rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-soft hover:shadow-card-hover cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4F86D9] ${
                  wish.isFlagged
                    ? 'border-[#B7791F]/40 ring-1 ring-[#B7791F]/20'
                    : 'border-[#E0E7F0] dark:border-slate-800 hover:border-[#4F86D9]/50 dark:hover:border-[#4F86D9]/60'
                }`}
              >
                <div>
                  <CardImagePreview
                    images={wishImages}
                    title={wish.title}
                    category={wish.category}
                    isFlagged={wish.isFlagged}
                    isOwner={isOwner}
                  />

                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#667085] dark:text-slate-400">
                        <span className="font-semibold text-[#243B64] dark:text-sky-300">{wish.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {wish.offersCount === 0 ? 'No offers yet' : `${wish.offersCount} offer${wish.offersCount > 1 ? 's' : ''}`}
                        </span>
                      </div>

                      <h2 className="text-sm sm:text-base font-bold text-[#172033] dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-[#4F86D9] dark:group-hover:text-sky-400 transition-colors break-words">
                        {wish.title}
                      </h2>

                      <div className="flex items-baseline justify-between gap-2 pt-1">
                        <span className="text-xs text-[#667085] dark:text-slate-400">
                          Target Budget
                        </span>
                        <span className="text-base sm:text-lg font-extrabold font-mono text-[#287A55] dark:text-emerald-400 tabular-nums">
                          {formatBaht(wish.budget)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E0E7F0] dark:border-slate-800 flex items-center justify-between gap-2">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onViewUserProfile) {
                            onViewUserProfile(wish.buyerId, {
                              id: wish.buyerId,
                              name: wish.buyerName,
                              avatar: buyerAvatar,
                              rating: wish.buyerRating,
                              reviewCount: allUsers?.[wish.buyerId]?.reviewCount,
                            });
                          }
                        }}
                        className="flex items-center gap-2 cursor-pointer group/buyer min-w-0"
                        title={`View ${wish.buyerName}'s profile`}
                      >
                        <UserAvatar
                          src={buyerAvatar}
                          name={wish.buyerName}
                          size="sm"
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg object-cover border border-[#E0E7F0] dark:border-slate-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 truncate">
                            <span className="text-xs font-semibold text-[#263244] dark:text-slate-200 group-hover/buyer:text-[#4F86D9] dark:group-hover/buyer:text-sky-400 group-hover/buyer:underline transition-colors truncate">
                              {wish.buyerName}
                            </span>
                            <span className="text-[10px] text-[#B7791F] dark:text-amber-400 font-bold shrink-0">
                              ★ {wish.buyerRating.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#667085] dark:text-slate-400 block leading-none">
                            Posted {wish.createdAt}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Bar: View Details + Direct 1-click Edit if Owner */}
                <div className="p-4 pt-0">
                  <div className="pt-2.5 border-t border-[#E0E7F0] dark:border-slate-800 flex items-center gap-2">
                    {isOwner && onEditWish && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditWish(wish);
                        }}
                        className="px-3 py-2 rounded-xl bg-[#F7F9FC] dark:bg-slate-800 hover:bg-[#243B64] hover:text-white text-[#243B64] dark:text-sky-300 border border-[#E0E7F0] dark:border-slate-700 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
                        title="Edit your wish directly"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    )}
                    <div className="flex-1 py-2 px-3 rounded-xl bg-[#EDF4FF] dark:bg-[#4F86D9]/15 group-hover:bg-[#4F86D9] text-[#243B64] dark:text-sky-300 group-hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-150 shadow-2xs">
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredWishes.map((wish) => {
            const isOwner = Boolean(currentUser && wish.buyerId === currentUser.id);
            const buyerAvatar = wish.buyerAvatarUrl || allUsers?.[wish.buyerId]?.avatarUrl || wish.buyerAvatar || allUsers?.[wish.buyerId]?.avatar;
            const wishImages = wish.images && wish.images.length > 0
              ? wish.images
              : (wish.imageUrl ? [wish.imageUrl] : []);
            const thumbImg = wishImages[0];

            return (
              <div
                key={wish.id}
                tabIndex={0}
                role="button"
                aria-label={`View details for ${wish.title}`}
                onClick={() => onSelectWish(wish)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectWish(wish);
                  }
                }}
                className={`group bg-white dark:bg-[#111827] rounded-2xl border transition-all duration-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-soft hover:shadow-card-hover cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4F86D9] ${
                  wish.isFlagged
                    ? 'border-[#B7791F]/40 ring-1 ring-[#B7791F]/20'
                    : 'border-[#E0E7F0] dark:border-slate-800 hover:border-[#4F86D9]/50 dark:hover:border-[#4F86D9]/60'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#F7F9FC] dark:bg-slate-800 border border-[#E0E7F0] dark:border-slate-700 overflow-hidden shrink-0 relative">
                    {thumbImg ? (
                      <img
                        src={thumbImg}
                        alt={wish.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#667085] dark:text-slate-400">
                        <ImageIcon className="w-6 h-6 opacity-40" />
                      </div>
                    )}
                    {wishImages.length > 1 && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded-md bg-[#243B64]/80 text-white text-[9px] font-bold">
                        {wishImages.length}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EDF4FF] dark:bg-[#4F86D9]/20 text-[#243B64] dark:text-sky-300 border border-[#4F86D9]/25">
                        {wish.category}
                      </span>
                      {isOwner && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#243B64] dark:bg-[#4F86D9] text-white">
                          Your Wish
                        </span>
                      )}
                      <span className="text-[11px] text-[#667085] dark:text-slate-400">
                        Posted {wish.createdAt}
                      </span>
                    </div>

                    <h2 className="text-sm sm:text-base font-bold text-[#263244] dark:text-slate-100 group-hover:text-[#4F86D9] dark:group-hover:text-sky-400 transition-colors truncate">
                      {wish.title}
                    </h2>

                    <div className="flex items-center gap-3 text-xs">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onViewUserProfile) {
                            onViewUserProfile(wish.buyerId, {
                              id: wish.buyerId,
                              name: wish.buyerName,
                              avatar: buyerAvatar,
                              rating: wish.buyerRating,
                              reviewCount: allUsers?.[wish.buyerId]?.reviewCount,
                            });
                          }
                        }}
                        className="flex items-center gap-1.5 text-[#263244] dark:text-slate-200 hover:text-[#4F86D9] dark:hover:text-sky-400 cursor-pointer"
                      >
                        <UserAvatar
                          src={buyerAvatar}
                          name={wish.buyerName}
                          size="sm"
                          className="w-5 h-5 rounded-md"
                        />
                        <span className="font-semibold">{wish.buyerName}</span>
                        <span className="text-[#B7791F] dark:text-amber-400 font-bold">★ {wish.buyerRating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E0E7F0] dark:border-slate-800">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-[#667085] dark:text-slate-400 block">
                      Target Budget
                    </span>
                    <span className="text-base sm:text-lg font-extrabold font-mono text-[#287A55] dark:text-emerald-400">
                      {formatBaht(wish.budget)}
                    </span>
                    <span className="text-[10px] text-[#667085] dark:text-slate-400 block">
                      {wish.offersCount} {wish.offersCount === 1 ? 'offer' : 'offers'} received
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOwner && onEditWish && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditWish(wish);
                        }}
                        className="px-3 py-2 rounded-xl bg-[#F7F9FC] dark:bg-slate-800 hover:bg-[#243B64] hover:text-white text-[#243B64] dark:text-sky-300 border border-[#E0E7F0] dark:border-slate-700 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    )}
                    <div className="px-4 py-2 rounded-xl bg-[#EDF4FF] dark:bg-[#4F86D9]/15 group-hover:bg-[#4F86D9] text-[#243B64] dark:text-sky-300 group-hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all">
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
