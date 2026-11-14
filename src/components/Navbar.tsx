import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, ChatTarget, WarningRecord, Wish } from '../types';
import {
  ArrowLeftRight, Search, Plus, ShoppingBag,
  Tag, User as UserIcon, LogOut, ChevronDown, ShieldCheck, ShieldAlert,
  MessageSquare, ArrowRight, Check, Bell,
  Sun, Moon, MoreHorizontal, FolderKanban, Package, Clock, X
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { formatBaht } from '../utils/currency';
import {
  getWishSearchSuggestions,
  splitHighlightSegments,
  WishSearchSuggestion,
} from '../utils/wishSearch';

export type HubQuickTab = 'overview' | 'my_wishes' | 'offers' | 'orders' | 'reviews';

interface NavbarProps {
  currentUser: User | null;
  allUsers: Record<string, User>;
  onSelectUser: (user: User) => void;
  onOpenProfile: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
  activeView: 'browse' | 'post' | 'offers' | 'admin';
  onChangeView: (view: 'browse' | 'post' | 'offers' | 'admin') => void;
  onLogoClick?: () => void;
  onNavigateMyHub?: (tab: HubQuickTab, subTab?: 'received' | 'sent' | 'declined') => void;
  searchInput: string;
  setSearchInput: (q: string) => void;
  onSearchSubmit: (q: string) => void;
  wishes?: Wish[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  pendingOffersCount?: number;
  myWishesCount?: number;
  myOffersCount?: number;
  warningsCount?: number;
  userWarnings?: WarningRecord[];
  onOpenWarningDetail?: (warning: WarningRecord) => void;
  conversations?: ChatTarget[];
  unreadChatsCount?: number;
  onOpenChat?: (target: ChatTarget) => void;
  onOpenChatsList?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

const STORAGE_RECENT_SEARCHES_KEY = 'wishmarket_recent_searches_v1';
const MAX_RECENT_SEARCHES = 6;
const AUTOCOMPLETE_DEBOUNCE_MS = 220;

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  onOpenProfile,
  onOpenAuth,
  onLogout,
  activeView,
  onChangeView,
  onLogoClick,
  onNavigateMyHub,
  searchInput,
  setSearchInput,
  onSearchSubmit,
  wishes = [],
  selectedCategory,
  setSelectedCategory,
  pendingOffersCount = 0,
  myWishesCount = 0,
  myOffersCount = 0,
  warningsCount = 0,
  userWarnings = [],
  onOpenWarningDetail,
  conversations = [],
  unreadChatsCount,
  onOpenChat,
  onOpenChatsList,
  theme = 'light',
  onToggleTheme,
}) => {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [menuSection, setMenuSection] = useState<'main' | 'alerts' | 'chats'>('main');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_RECENT_SEARCHES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            .slice(0, MAX_RECENT_SEARCHES);
        }
      }
    } catch (e) {}
    return [];
  });
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const mobileSearchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_RECENT_SEARCHES_KEY, JSON.stringify(recentSearches));
    } catch (e) {}
  }, [recentSearches]);

  useEffect(() => {
    const trimmed = searchInput.trim();
    setHighlightedIndex(-1);
    if (!trimmed) {
      setDebouncedQuery('');
      return;
    }
    const timer = window.setTimeout(() => {
      setDebouncedQuery(trimmed);
    }, AUTOCOMPLETE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [debouncedQuery, selectedCategory]);

  const suggestions = useMemo(() => {
    if (!debouncedQuery) return [];
    return getWishSearchSuggestions(wishes, debouncedQuery, {
      category: selectedCategory,
      limit: 5,
    });
  }, [wishes, debouncedQuery, selectedCategory]);

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        desktopSearchInputRef.current?.focus();
        setIsSearchFocused(true);
      } else if (e.key === 'Escape') {
        setIsSearchFocused(false);
        setIsMobileSearchFocused(false);
        setHighlightedIndex(-1);
        setMoreMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: PointerEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
        setHighlightedIndex(-1);
      }
      if (mobileSearchBoxRef.current && !mobileSearchBoxRef.current.contains(e.target as Node)) {
        setIsMobileSearchFocused(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  const buyerWarnings = (userWarnings.length > 0 ? userWarnings : (currentUser?.warnings || []))
    .slice()
    .sort((a, b) => (Boolean(a.read) === Boolean(b.read) ? 0 : a.read ? 1 : -1));
  const unreadBuyerWarningsCount = buyerWarnings.filter((w) => !w.read).length;

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
    'Other',
  ];

  const sortedConversations = [...conversations].sort((a, b) => {
    if (Boolean(a.hasUnread) !== Boolean(b.hasUnread)) {
      return a.hasUnread ? -1 : 1;
    }
    return (b.lastMessageCreatedAt || 0) - (a.lastMessageCreatedAt || 0);
  });

  const totalUnreadChats = unreadChatsCount !== undefined
    ? unreadChatsCount
    : sortedConversations.filter((c) => c.hasUnread).length;

  const totalGroupedBadgeCount =
    (currentUser?.isAdmin ? 0 : totalUnreadChats) + unreadBuyerWarningsCount;

  const saveSearchToHistory = (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      return [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    });
  };

  const handleRemoveRecentSearch = (queryToRemove: string) => {
    setRecentSearches((prev) => prev.filter((item) => item !== queryToRemove));
  };

  const handleClearAllRecentSearches = () => {
    setRecentSearches([]);
  };

  const handleSelectRecentSearch = (query: string, isMobile = false) => {
    setSearchInput(query);
    setHighlightedIndex(-1);
    if (isMobile) {
      mobileSearchInputRef.current?.focus();
      setIsMobileSearchFocused(false);
    } else {
      desktopSearchInputRef.current?.focus();
      setIsSearchFocused(false);
    }
  };

  const handleSelectSuggestion = (suggestion: WishSearchSuggestion) => {
    const queryToSubmit = suggestion.query;
    const trimmed = queryToSubmit.trim();
    setIsSearchFocused(false);
    setIsMobileSearchFocused(false);
    setHighlightedIndex(-1);
    if (trimmed) {
      saveSearchToHistory(trimmed);
    }
    onSearchSubmit(queryToSubmit);
  };

  const handleSearchInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    isMobile = false
  ) => {
    if (e.key === 'Enter' && e.nativeEvent.isComposing) {
      e.preventDefault();
      return;
    }

    const isFocused = isMobile ? isMobileSearchFocused : isSearchFocused;
    const hasSuggestionsOpen =
      isFocused && searchInput.trim().length > 0 && suggestions.length > 0;

    if (e.key === 'ArrowDown') {
      if (!hasSuggestionsOpen) return;
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      if (!hasSuggestionsOpen) return;
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Escape') {
      if (isMobile) {
        setIsMobileSearchFocused(false);
      } else {
        setIsSearchFocused(false);
      }
      setHighlightedIndex(-1);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const hasSuggestionsOpen =
      (isSearchFocused || isMobileSearchFocused) &&
      searchInput.trim().length > 0 &&
      suggestions.length > 0;
    const highlightedSuggestion =
      hasSuggestionsOpen &&
      highlightedIndex >= 0 &&
      highlightedIndex < suggestions.length
        ? suggestions[highlightedIndex]
        : null;

    const queryToSubmit = highlightedSuggestion ? highlightedSuggestion.query : searchInput;
    const trimmed = queryToSubmit.trim();
    setIsSearchFocused(false);
    setIsMobileSearchFocused(false);
    setHighlightedIndex(-1);
    if (trimmed) {
      saveSearchToHistory(trimmed);
    }
    onSearchSubmit(queryToSubmit);
  };

  const hasTypedQuery = searchInput.trim().length > 0;
  const showDesktopSuggestions = isSearchFocused && hasTypedQuery && suggestions.length > 0;
  const showDesktopRecent = isSearchFocused && !hasTypedQuery && recentSearches.length > 0;
  const showMobileSuggestions = isMobileSearchFocused && hasTypedQuery && suggestions.length > 0;
  const showMobileRecent = isMobileSearchFocused && !hasTypedQuery && recentSearches.length > 0;

  const renderHighlightedSuggestionText = (text: string) => {
    const segments = splitHighlightSegments(text, debouncedQuery || searchInput);
    return segments.map((seg, i) =>
      seg.highlighted ? (
        <span
          key={i}
          className="font-bold text-[#172033] dark:text-sky-300 bg-[#EDF4FF] dark:bg-[#4F86D9]/25 rounded-xs px-0.5"
        >
          {seg.text}
        </span>
      ) : (
        <span key={i}>{seg.text}</span>
      )
    );
  };

  const closeMenu = () => {
    setMoreMenuOpen(false);
    setMenuSection('main');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-[#E0E7F0] dark:border-slate-800 shadow-soft transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 sm:gap-6 h-15 sm:h-16">
            {/* Zone 1: Clean Single-Line Brand Wordmark */}
            <button
              type="button"
              onClick={() => {
                setIsSearchFocused(false);
                setIsMobileSearchFocused(false);
                closeMenu();
                desktopSearchInputRef.current?.blur();
                if (onLogoClick) {
                  onLogoClick();
                } else {
                  onChangeView('browse');
                }
              }}
              aria-label="WishMarket home - reset and view Buyer Demand Feed"
              className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0 whitespace-nowrap"
            >
              <div className="w-8 h-8 rounded-lg bg-[#172033] dark:bg-[#4F86D9] group-hover:bg-[#243B64] dark:group-hover:bg-[#3568B5] flex items-center justify-center text-white transition-colors">
                <ArrowLeftRight className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-[#172033] dark:text-slate-100 whitespace-nowrap">
                Wish<span className="text-[#4F86D9]">Market</span>
              </span>
            </button>

            {/* Zone 2: Minimal Google-like Search Bar + Separate Category Filter */}
            <div className="hidden md:flex items-center gap-2 flex-1 max-w-xl">
              {/* Separate Category Filter */}
              <div className="relative shrink-0">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    onChangeView('browse');
                  }}
                  aria-label="Filter by Category"
                  className="appearance-none text-xs font-semibold text-[#475467] dark:text-slate-300 bg-white dark:bg-slate-900 border border-[#E0E7F0] dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#4F86D9] rounded-xl pl-3 pr-7 py-2.5 outline-none cursor-pointer transition-colors"
                >
                  {categories.map((c) => (
                    <option key={c} value={c} className="bg-white dark:bg-slate-900 text-[#263244] dark:text-slate-100">
                      {c === 'All' ? 'All' : c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#667085] dark:text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Clean Minimal Search Input */}
              <div ref={searchBoxRef} className="relative flex-1 min-w-0">
                <form onSubmit={handleSearchSubmit}>
                  <div
                    className={`w-full flex items-center bg-white dark:bg-slate-900 border rounded-xl px-3 py-2 transition-all duration-150 ${
                      isSearchFocused
                        ? 'border-[#4F86D9] ring-2 ring-[#4F86D9]/15 shadow-soft'
                        : 'border-[#E0E7F0] dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <button
                      type="submit"
                      aria-label="Search"
                      title="Search"
                      className="text-[#667085] dark:text-slate-400 hover:text-[#4F86D9] dark:hover:text-sky-400 transition-colors shrink-0 mr-2.5 cursor-pointer flex items-center justify-center"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    <input
                      ref={desktopSearchInputRef}
                      type="text"
                      role="combobox"
                      aria-autocomplete="list"
                      aria-expanded={showDesktopSuggestions || showDesktopRecent}
                      aria-controls={showDesktopSuggestions ? 'desktop-search-suggestions' : undefined}
                      aria-activedescendant={
                        showDesktopSuggestions && highlightedIndex >= 0
                          ? `desktop-suggestion-${highlightedIndex}`
                          : undefined
                      }
                      value={searchInput}
                      onFocus={() => setIsSearchFocused(true)}
                      onClick={() => setIsSearchFocused(true)}
                      onKeyDown={(e) => handleSearchInputKeyDown(e, false)}
                      onChange={(e) => {
                        setSearchInput(e.target.value);
                        setIsSearchFocused(true);
                      }}
                      placeholder="Search wishes, products, or keywords..."
                      aria-label="Search wishes, products, or keywords"
                      className="w-full text-xs text-[#172033] dark:text-slate-100 placeholder:text-[#667085] dark:placeholder:text-slate-400 bg-transparent outline-none font-medium min-w-0"
                    />
                    {searchInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchInput('');
                          setDebouncedQuery('');
                          setHighlightedIndex(-1);
                          desktopSearchInputRef.current?.focus();
                        }}
                        aria-label="Clear search"
                        title="Clear search"
                        className="ml-1.5 p-0.5 rounded-md text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white hover:bg-[#F7F9FC] dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </form>

                {/* Autocomplete Search Suggestions Dropdown */}
                {showDesktopSuggestions && (
                  <div
                    id="desktop-search-suggestions"
                    role="listbox"
                    aria-label="Search suggestions"
                    onMouseLeave={() => setHighlightedIndex(-1)}
                    className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#111827] rounded-2xl border border-[#E0E7F0] dark:border-slate-800 shadow-card-hover py-1.5 px-1.5 z-50 space-y-0.5 animate-in fade-in duration-100"
                  >
                    {suggestions.map((item, idx) => {
                      const isHighlighted = idx === highlightedIndex;
                      return (
                        <button
                          key={item.id}
                          id={`desktop-suggestion-${idx}`}
                          role="option"
                          aria-selected={isHighlighted}
                          type="button"
                          onMouseEnter={() => setHighlightedIndex(idx)}
                          onClick={() => handleSelectSuggestion(item)}
                          className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                            isHighlighted
                              ? 'bg-[#EDF4FF] dark:bg-[#4F86D9]/15 text-[#172033] dark:text-white'
                              : 'hover:bg-[#F7F9FC] dark:hover:bg-slate-800/70 text-[#263244] dark:text-slate-200'
                          }`}
                        >
                          <span className="flex items-center gap-2.5 min-w-0 flex-1">
                            <Search className="w-3.5 h-3.5 text-[#667085] dark:text-slate-400 shrink-0" />
                            <span className="text-xs font-medium truncate">
                              {renderHighlightedSuggestionText(item.text)}
                            </span>
                          </span>
                          <span className="text-[11px] font-medium text-[#667085] dark:text-slate-400 shrink-0">
                            {item.category}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Recent Searches Dropdown */}
                {showDesktopRecent && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#111827] rounded-2xl border border-[#E0E7F0] dark:border-slate-800 shadow-card-hover p-2.5 z-50 space-y-1.5 animate-in fade-in duration-100">
                    <div className="flex items-center justify-between px-1.5">
                      <span className="text-[11px] font-semibold text-[#667085] dark:text-slate-400">
                        Recent Searches
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleClearAllRecentSearches();
                        }}
                        className="text-[11px] font-semibold text-[#4F86D9] hover:text-[#3568B5] dark:text-sky-400 dark:hover:text-sky-300 transition-colors cursor-pointer"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="space-y-0.5">
                      {recentSearches.map((item) => (
                        <div
                          key={item}
                          className="flex items-center justify-between gap-1 rounded-xl hover:bg-[#F7F9FC] dark:hover:bg-slate-800/70 transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectRecentSearch(item)}
                            className="flex-1 min-w-0 flex items-center gap-2.5 px-2.5 py-1.5 text-left cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5 text-[#667085] dark:text-slate-400 shrink-0" />
                            <span className="text-xs font-medium text-[#263244] dark:text-slate-200 truncate">
                              {item}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveRecentSearch(item);
                            }}
                            aria-label={`Remove ${item} from recent searches`}
                            title="Remove"
                            className="p-1.5 mr-1 rounded-lg text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white hover:bg-[#E0E7F0]/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Zone 3: Clean Typography Links + Primary CTA + Grouped (•••) Menu */}
            <div className="flex items-center gap-4 sm:gap-5 shrink-0">
              <nav className="hidden md:flex items-center gap-5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => onChangeView('browse')}
                  className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeView === 'browse'
                      ? 'border-[#4F86D9] text-[#172033] dark:text-white font-bold'
                      : 'border-transparent text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-slate-100'
                  }`}
                >
                  Browse
                </button>

                {currentUser?.isAdmin ? (
                  <button
                    type="button"
                    onClick={() => onChangeView('admin')}
                    className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      activeView === 'admin'
                        ? 'border-[#4F86D9] text-[#172033] dark:text-white font-bold'
                        : 'border-transparent text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-slate-100'
                    }`}
                  >
                    <span>Moderation</span>
                    {warningsCount > 0 && (
                      <span className="text-[11px] font-mono text-[#4F86D9] tabular-nums">
                        ({warningsCount})
                      </span>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateMyHub) {
                        onNavigateMyHub('overview');
                      } else {
                        onChangeView('offers');
                      }
                    }}
                    className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      activeView === 'offers'
                        ? 'border-[#4F86D9] text-[#172033] dark:text-white font-bold'
                        : 'border-transparent text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-slate-100'
                    }`}
                    title="Manage & edit your own wishes and offers"
                  >
                    <span>My Wishes & Offers</span>
                    {(myWishesCount + myOffersCount + pendingOffersCount) > 0 && (
                      <span className="text-[11px] font-mono text-[#4F86D9] tabular-nums">
                        ({myWishesCount + myOffersCount})
                      </span>
                    )}
                  </button>
                )}
              </nav>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onChangeView('post')}
                  className={`hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[38px] ${
                    activeView === 'post'
                      ? 'bg-[#243B64] text-white'
                      : 'bg-[#4F86D9] hover:bg-[#3568B5] text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Post Wish</span>
                </button>

                {!currentUser && (
                  <button
                    type="button"
                    onClick={() => onOpenAuth('login')}
                    className="px-3.5 py-2 text-xs font-bold text-[#172033] dark:text-slate-100 border border-[#E0E7F0] dark:border-slate-700 hover:border-[#4F86D9] rounded-xl transition cursor-pointer min-h-[38px] whitespace-nowrap"
                  >
                    Sign In
                  </button>
                )}

                {/* Grouped Shortcuts & Account Menu (•••) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setMoreMenuOpen(!moreMenuOpen);
                      setMenuSection('main');
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer min-h-[38px] relative ${
                      moreMenuOpen
                        ? 'bg-[#EDF4FF] dark:bg-[#4F86D9]/20 border-[#4F86D9]/50 text-[#172033] dark:text-white'
                        : 'bg-white dark:bg-slate-900 hover:bg-[#F7F9FC] dark:hover:bg-slate-800 border-[#E0E7F0] dark:border-slate-700 text-[#263244] dark:text-slate-200'
                    }`}
                    title="Shortcuts, Chats, Alerts & Account"
                    aria-label="Grouped shortcuts menu"
                    aria-expanded={moreMenuOpen}
                  >
                    {currentUser && (
                      <UserAvatar
                        user={currentUser}
                        size="sm"
                        className="w-6 h-6 rounded-lg object-cover"
                      />
                    )}
                    <MoreHorizontal className="w-4 h-4" />
                    {totalGroupedBadgeCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#4F86D9] text-white font-mono font-bold leading-none tabular-nums">
                        {totalGroupedBadgeCount}
                      </span>
                    )}
                  </button>

                {/* Grouped Shortcuts Dropdown */}
                {moreMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={closeMenu}
                    />
                    <div className="fixed right-3 left-3 sm:left-auto sm:absolute sm:right-0 top-15 sm:top-full sm:mt-2 sm:w-80 bg-white dark:bg-[#111827] rounded-2xl shadow-card-hover border border-[#E0E7F0] dark:border-slate-800 py-2 z-50 animate-in fade-in-50 duration-100 overflow-hidden">
                      {/* SUB-VIEW: CHATS PREVIEW */}
                      {menuSection === 'chats' && (
                        <div className="space-y-2 p-2">
                          <div className="flex items-center justify-between px-1.5 pb-2 border-b border-[#E0E7F0] dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() => setMenuSection('main')}
                              className="text-xs font-bold text-[#4F86D9] hover:underline cursor-pointer"
                            >
                              ← Back to Menu
                            </button>
                            <span className="text-xs font-bold text-[#263244] dark:text-slate-100">
                              Recent Chats ({sortedConversations.length})
                            </span>
                          </div>

                          {sortedConversations.length === 0 ? (
                            <p className="text-xs text-[#667085] dark:text-slate-400 text-center py-6">
                              No active chats yet.
                            </p>
                          ) : (
                            <div className="max-h-64 overflow-y-auto space-y-1.5">
                              {sortedConversations.slice(0, 6).map((conv) => {
                                const otherPartyId = currentUser?.id === conv.buyerId ? conv.sellerId : conv.buyerId;
                                const otherUser = otherPartyId ? allUsers[otherPartyId] : null;
                                const otherPartyName = currentUser?.id === conv.buyerId
                                  ? (conv.sellerName || 'Seller')
                                  : (conv.buyerName || 'Buyer');

                                return (
                                  <button
                                    key={conv.wishId}
                                    type="button"
                                    onClick={() => {
                                      closeMenu();
                                      onOpenChat?.(conv);
                                    }}
                                    className={`w-full text-left p-2 rounded-xl border transition flex items-center gap-2.5 cursor-pointer ${
                                      conv.hasUnread
                                        ? 'bg-[#EDF4FF] dark:bg-[#4F86D9]/15 border-[#4F86D9]/40'
                                        : 'bg-[#F7F9FC] dark:bg-slate-800/60 border-[#E0E7F0] dark:border-slate-700 hover:border-[#4F86D9]/40'
                                    }`}
                                  >
                                    {conv.wishImage ? (
                                      <img
                                        src={conv.wishImage}
                                        alt={conv.title}
                                        className="w-9 h-9 rounded-lg object-cover border border-[#E0E7F0] dark:border-slate-700 shrink-0"
                                      />
                                    ) : (
                                      <UserAvatar user={otherUser} name={otherPartyName} size="sm" className="w-9 h-9 rounded-lg shrink-0" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="text-xs font-bold text-[#263244] dark:text-slate-100 truncate">
                                          {conv.title}
                                        </span>
                                        {conv.hasUnread && (
                                          <span className="w-2 h-2 rounded-full bg-[#4F86D9] shrink-0" />
                                        )}
                                      </div>
                                      <p className="text-[11px] text-[#667085] dark:text-slate-400 truncate">
                                        {otherPartyName}
                                        {(conv.agreedPrice || conv.offerPrice || conv.budget) && (
                                          <span className="text-[#287A55] dark:text-emerald-400 font-mono font-bold ml-1">
                                            · {formatBaht(conv.agreedPrice ?? conv.offerPrice ?? conv.budget ?? 0)}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              closeMenu();
                              onOpenChatsList?.();
                            }}
                            className="w-full py-2 rounded-xl bg-[#4F86D9] hover:bg-[#3568B5] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>Open All Chats</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* SUB-VIEW: ALERTS / WARNINGS PREVIEW */}
                      {menuSection === 'alerts' && (
                        <div className="space-y-2 p-2">
                          <div className="flex items-center justify-between px-1.5 pb-2 border-b border-[#E0E7F0] dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() => setMenuSection('main')}
                              className="text-xs font-bold text-[#4F86D9] hover:underline cursor-pointer"
                            >
                              ← Back to Menu
                            </button>
                            <span className="text-xs font-bold text-[#263244] dark:text-slate-100">
                              Account Alerts ({buyerWarnings.length})
                            </span>
                          </div>

                          {buyerWarnings.length === 0 ? (
                            <div className="p-4 text-center bg-[#F7F9FC] dark:bg-slate-800/60 rounded-xl space-y-1">
                              <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto" />
                              <p className="text-xs font-bold text-[#263244] dark:text-slate-100">Account in Good Standing</p>
                              <p className="text-[11px] text-[#667085] dark:text-slate-400">No warnings or notices recorded.</p>
                            </div>
                          ) : (
                            <div className="max-h-64 overflow-y-auto space-y-1.5">
                              {buyerWarnings.map((warn) => (
                                <button
                                  key={warn.id}
                                  type="button"
                                  onClick={() => {
                                    closeMenu();
                                    onOpenWarningDetail?.(warn);
                                  }}
                                  className={`w-full text-left p-2.5 rounded-xl border transition cursor-pointer ${
                                    !warn.read
                                      ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                                      : 'bg-[#F7F9FC] dark:bg-slate-800/60 border-[#E0E7F0] dark:border-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="font-bold uppercase text-amber-700 dark:text-amber-300">
                                      {warn.severity.replace('_', ' ')}
                                    </span>
                                    <span className="text-[#667085] dark:text-slate-400">{warn.issuedAt}</span>
                                  </div>
                                  <p className="text-xs font-semibold text-[#263244] dark:text-slate-100 mt-1 line-clamp-2">
                                    {warn.reason}
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* MAIN GROUPED MENU */}
                      {menuSection === 'main' && (
                        <>
                          {/* Active User Header */}
                          {currentUser ? (
                            <div className="px-3.5 py-2.5 border-b border-[#E0E7F0] dark:border-slate-800 flex items-center gap-2.5">
                              <UserAvatar user={currentUser} size="sm" className="w-9 h-9 rounded-xl object-cover shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-bold text-[#263244] dark:text-slate-100 truncate">
                                    {currentUser.name}
                                  </p>
                                  {currentUser.isAdmin && (
                                    <span className="text-[9px] bg-[#EDF4FF] dark:bg-[#4F86D9]/20 text-[#243B64] dark:text-sky-300 px-1.5 py-0.2 rounded font-bold uppercase">
                                      Admin
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[#667085] dark:text-slate-400 truncate">
                                  {currentUser.isAdmin ? 'Moderator' : `★ ${currentUser.rating.toFixed(1)}`} · {currentUser.email}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="px-3.5 py-2.5 border-b border-[#E0E7F0] dark:border-slate-800 flex items-center justify-between">
                              <span className="text-xs font-bold text-[#263244] dark:text-slate-100">Guest Session</span>
                              <button
                                type="button"
                                onClick={() => {
                                  closeMenu();
                                  onOpenAuth('login');
                                }}
                                className="text-xs font-bold text-[#4F86D9] hover:underline cursor-pointer"
                              >
                                Sign In / Sign Up
                              </button>
                            </div>
                          )}

                          {/* Group 1: Direct Shortcuts */}
                          <div className="py-1.5 border-b border-[#E0E7F0] dark:border-slate-800">
                            <p className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400">
                              Quick Shortcuts
                            </p>

                            {!currentUser?.isAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    closeMenu();
                                    if (onNavigateMyHub) {
                                      onNavigateMyHub('my_wishes');
                                    } else {
                                      onChangeView('offers');
                                    }
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-xs text-[#263244] dark:text-slate-200 hover:bg-[#F7F9FC] dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                                >
                                  <span className="flex items-center gap-2.5 font-semibold">
                                    <ShoppingBag className="w-4 h-4 text-[#4F86D9]" />
                                    <span>My Wishes & Edit</span>
                                  </span>
                                  <span className="text-[11px] font-mono text-[#667085] dark:text-slate-400 tabular-nums">
                                    {myWishesCount}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    closeMenu();
                                    if (onNavigateMyHub) {
                                      onNavigateMyHub('offers', 'sent');
                                    } else {
                                      onChangeView('offers');
                                    }
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-xs text-[#263244] dark:text-slate-200 hover:bg-[#F7F9FC] dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                                >
                                  <span className="flex items-center gap-2.5 font-semibold">
                                    <Tag className="w-4 h-4 text-[#4F86D9]" />
                                    <span>My Offers & Edit</span>
                                  </span>
                                  <span className="text-[11px] font-mono text-[#667085] dark:text-slate-400 tabular-nums">
                                    {myOffersCount}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    closeMenu();
                                    if (onNavigateMyHub) {
                                      onNavigateMyHub('orders');
                                    } else {
                                      onChangeView('offers');
                                    }
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-xs text-[#263244] dark:text-slate-200 hover:bg-[#F7F9FC] dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                                >
                                  <span className="flex items-center gap-2.5 font-semibold">
                                    <Package className="w-4 h-4 text-[#287A55]" />
                                    <span>Orders & Reviews</span>
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 text-[#667085]" />
                                </button>
                              </>
                            )}

                            {!currentUser?.isAdmin && (
                              <button
                                type="button"
                                onClick={() => setMenuSection('chats')}
                                className="w-full px-3.5 py-2 text-left text-xs text-[#263244] dark:text-slate-200 hover:bg-[#F7F9FC] dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                              >
                                <span className="flex items-center gap-2.5 font-semibold">
                                  <MessageSquare className="w-4 h-4 text-[#4F86D9]" />
                                  <span>Chats & Messages</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  {totalUnreadChats > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#4F86D9] text-white font-mono font-bold tabular-nums">
                                      {totalUnreadChats} new
                                    </span>
                                  )}
                                  <ArrowRight className="w-3.5 h-3.5 text-[#667085]" />
                                </span>
                              </button>
                            )}

                            {currentUser && (
                              <button
                                type="button"
                                onClick={() => setMenuSection('alerts')}
                                className="w-full px-3.5 py-2 text-left text-xs text-[#263244] dark:text-slate-200 hover:bg-[#F7F9FC] dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                              >
                                <span className="flex items-center gap-2.5 font-semibold">
                                  <Bell className="w-4 h-4 text-amber-500" />
                                  <span>Notifications & Alerts</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  {unreadBuyerWarningsCount > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-600 text-white font-mono font-bold">
                                      {unreadBuyerWarningsCount}
                                    </span>
                                  )}
                                  <ArrowRight className="w-3.5 h-3.5 text-[#667085]" />
                                </span>
                              </button>
                            )}

                            {currentUser?.isAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    closeMenu();
                                    onChangeView('admin');
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-xs text-[#243B64] dark:text-sky-300 hover:bg-[#EDF4FF] dark:hover:bg-[#4F86D9]/15 flex items-center gap-2.5 font-bold cursor-pointer"
                                >
                                  <ShieldCheck className="w-4 h-4 text-[#4F86D9]" />
                                  <span>Admin Moderation Center</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    closeMenu();
                                    onChangeView('offers');
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-xs text-[#263244] dark:text-slate-200 hover:bg-[#F7F9FC] dark:hover:bg-slate-800 flex items-center gap-2.5 font-semibold cursor-pointer"
                                >
                                  <Tag className="w-4 h-4 text-[#667085]" />
                                  <span>All Marketplace Offers</span>
                                </button>
                              </>
                            )}

                            {currentUser && (
                              <button
                                type="button"
                                onClick={() => {
                                  closeMenu();
                                  onOpenProfile();
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs text-[#263244] dark:text-slate-200 hover:bg-[#F7F9FC] dark:hover:bg-slate-800 flex items-center gap-2.5 font-semibold cursor-pointer"
                              >
                                <UserIcon className="w-4 h-4 text-[#667085] dark:text-slate-400" />
                                <span>Profile & Preferences</span>
                              </button>
                            )}

                            {onToggleTheme && (
                              <button
                                type="button"
                                onClick={onToggleTheme}
                                className="w-full px-3.5 py-2 text-left text-xs text-[#263244] dark:text-slate-200 hover:bg-[#F7F9FC] dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                              >
                                <span className="flex items-center gap-2.5 font-semibold">
                                  {theme === 'dark' ? (
                                    <Sun className="w-4 h-4 text-amber-400" />
                                  ) : (
                                    <Moon className="w-4 h-4 text-[#4F86D9]" />
                                  )}
                                  <span>Appearance</span>
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EDF4FF] dark:bg-slate-800 text-[#243B64] dark:text-sky-300 border border-[#4F86D9]/25 dark:border-slate-700">
                                  {theme === 'dark' ? 'Dark' : 'Light'}
                                </span>
                              </button>
                            )}
                          </div>

                          {/* Group 2: Quick Switch Account */}
                          <div className="py-1.5 border-b border-[#E0E7F0] dark:border-slate-800">
                            <p className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400">
                              Switch Demo Account
                            </p>
                            {Object.values(allUsers).map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  closeMenu();
                                  onSelectUser(u);
                                }}
                                className={`w-full px-3.5 py-1.5 text-left text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                  currentUser?.id === u.id
                                    ? 'bg-[#EDF4FF] dark:bg-[#4F86D9]/15 text-[#243B64] dark:text-sky-300 font-bold'
                                    : 'text-[#263244] dark:text-slate-200 hover:bg-[#F7F9FC] dark:hover:bg-slate-800'
                                }`}
                              >
                                <span className="flex items-center gap-2 truncate">
                                  <UserAvatar user={u} size="xs" className="w-5 h-5 rounded-md object-cover shrink-0" />
                                  <span className="truncate">{u.name}</span>
                                </span>
                                {u.isAdmin ? (
                                  <span className="text-[9px] bg-[#EDF4FF] dark:bg-[#4F86D9]/20 text-[#243B64] dark:text-sky-300 px-1.5 py-0.2 rounded font-bold uppercase">
                                    Admin
                                  </span>
                                ) : currentUser?.id === u.id ? (
                                  <Check className="w-3.5 h-3.5 text-[#4F86D9]" />
                                ) : null}
                              </button>
                            ))}
                          </div>

                          {/* Sign Out */}
                          {currentUser && (
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  closeMenu();
                                  onLogout();
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs text-[#C0392B] dark:text-rose-400 hover:bg-[#FDF2F2] dark:hover:bg-rose-950/30 flex items-center gap-2.5 font-semibold cursor-pointer"
                              >
                                <LogOut className="w-4 h-4" />
                                <span>Sign Out</span>
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Minimal Search Bar Row */}
          {activeView === 'browse' && (
            <div className="md:hidden flex items-center gap-2 pb-2.5">
              {/* Separate Mobile Category Filter */}
              <div className="relative shrink-0">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    onChangeView('browse');
                  }}
                  aria-label="Filter by Category"
                  className="appearance-none text-xs font-semibold text-[#263244] dark:text-slate-200 bg-white dark:bg-slate-900 border border-[#E0E7F0] dark:border-slate-700 rounded-xl pl-2.5 pr-6 py-2 outline-none cursor-pointer max-w-[100px] truncate shadow-soft"
                >
                  {categories.map((c) => (
                    <option key={c} value={c} className="bg-white dark:bg-slate-900 text-[#263244] dark:text-slate-100">
                      {c === 'All' ? 'All' : c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-[#667085] dark:text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Mobile Minimal Search Input */}
              <div ref={mobileSearchBoxRef} className="relative flex-1 min-w-0">
                <form onSubmit={handleSearchSubmit}>
                  <div
                    className={`w-full flex items-center bg-white dark:bg-slate-900 border rounded-xl px-2.5 py-2 transition shadow-soft ${
                      isMobileSearchFocused
                        ? 'border-[#4F86D9] ring-2 ring-[#4F86D9]/20'
                        : 'border-[#E0E7F0] dark:border-slate-700'
                    }`}
                  >
                    <button
                      type="submit"
                      aria-label="Search"
                      title="Search"
                      className="text-[#667085] dark:text-slate-400 hover:text-[#4F86D9] dark:hover:text-sky-400 transition-colors shrink-0 mr-2 cursor-pointer flex items-center justify-center"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                    <input
                      ref={mobileSearchInputRef}
                      type="text"
                      role="combobox"
                      aria-autocomplete="list"
                      aria-expanded={showMobileSuggestions || showMobileRecent}
                      aria-controls={showMobileSuggestions ? 'mobile-search-suggestions' : undefined}
                      aria-activedescendant={
                        showMobileSuggestions && highlightedIndex >= 0
                          ? `mobile-suggestion-${highlightedIndex}`
                          : undefined
                      }
                      value={searchInput}
                      onFocus={() => setIsMobileSearchFocused(true)}
                      onClick={() => setIsMobileSearchFocused(true)}
                      onKeyDown={(e) => handleSearchInputKeyDown(e, true)}
                      onChange={(e) => {
                        setSearchInput(e.target.value);
                        setIsMobileSearchFocused(true);
                      }}
                      placeholder="Search wishes, products, or keywords..."
                      aria-label="Search wishes, products, or keywords"
                      className="w-full text-xs text-[#263244] dark:text-slate-100 placeholder:text-[#667085] dark:placeholder:text-slate-400 bg-transparent outline-none font-medium min-w-0"
                    />
                    {searchInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchInput('');
                          setDebouncedQuery('');
                          setHighlightedIndex(-1);
                          mobileSearchInputRef.current?.focus();
                        }}
                        aria-label="Clear search"
                        title="Clear search"
                        className="ml-1 p-0.5 rounded-md text-[#667085] dark:text-slate-400 hover:text-[#263244] dark:hover:text-slate-100 transition-colors cursor-pointer shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </form>

                {/* Mobile Autocomplete Search Suggestions Dropdown */}
                {showMobileSuggestions && (
                  <div
                    id="mobile-search-suggestions"
                    role="listbox"
                    aria-label="Search suggestions"
                    className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#111827] rounded-2xl border border-[#E0E7F0] dark:border-slate-800 shadow-card-hover py-1.5 px-1.5 z-50 space-y-0.5 animate-in fade-in duration-100"
                  >
                    {suggestions.map((item, idx) => {
                      const isHighlighted = idx === highlightedIndex;
                      return (
                        <button
                          key={item.id}
                          id={`mobile-suggestion-${idx}`}
                          role="option"
                          aria-selected={isHighlighted}
                          type="button"
                          onClick={() => handleSelectSuggestion(item)}
                          className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                            isHighlighted
                              ? 'bg-[#EDF4FF] dark:bg-[#4F86D9]/15 text-[#172033] dark:text-white'
                              : 'hover:bg-[#F7F9FC] dark:hover:bg-slate-800/70 text-[#263244] dark:text-slate-200'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0 flex-1">
                            <Search className="w-3.5 h-3.5 text-[#667085] dark:text-slate-400 shrink-0" />
                            <span className="text-xs font-medium truncate">
                              {renderHighlightedSuggestionText(item.text)}
                            </span>
                          </span>
                          <span className="text-[10px] font-medium text-[#667085] dark:text-slate-400 shrink-0">
                            {item.category}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Mobile Recent Searches Dropdown */}
                {showMobileRecent && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#111827] rounded-2xl border border-[#E0E7F0] dark:border-slate-800 shadow-card-hover p-2.5 z-50 space-y-1.5 animate-in fade-in duration-100">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-semibold text-[#667085] dark:text-slate-400">
                        Recent Searches
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleClearAllRecentSearches();
                        }}
                        className="text-[11px] font-semibold text-[#4F86D9] hover:text-[#3568B5] dark:text-sky-400 dark:hover:text-sky-300 transition-colors cursor-pointer"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="space-y-0.5">
                      {recentSearches.map((item) => (
                        <div
                          key={item}
                          className="flex items-center justify-between gap-1 rounded-xl hover:bg-[#F7F9FC] dark:hover:bg-slate-800/70 transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectRecentSearch(item, true)}
                            className="flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 text-left cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5 text-[#667085] dark:text-slate-400 shrink-0" />
                            <span className="text-xs font-medium text-[#263244] dark:text-slate-200 truncate">
                              {item}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveRecentSearch(item);
                            }}
                            aria-label={`Remove ${item} from recent searches`}
                            title="Remove"
                            className="p-1.5 mr-0.5 rounded-lg text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white hover:bg-[#E0E7F0]/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-t border-[#E0E7F0] dark:border-slate-800 shadow-[0_-4px_16px_rgba(36,59,100,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.45)] pb-safe transition-colors duration-200"
      >
        <div className="grid grid-cols-5 items-center h-15 px-1">
          {/* 1. Browse Tab */}
          <button
            type="button"
            onClick={() => onChangeView('browse')}
            className={`flex flex-col items-center justify-center gap-0.5 h-full rounded-xl transition-colors cursor-pointer ${
              activeView === 'browse'
                ? 'text-[#4F86D9] font-bold'
                : 'text-[#667085] dark:text-slate-400 hover:text-[#263244] dark:hover:text-slate-100'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] leading-tight">Browse</span>
          </button>

          {/* 2. My Wishes & Offers / Admin Tab */}
          {currentUser?.isAdmin ? (
            <button
              type="button"
              onClick={() => onChangeView('admin')}
              className={`relative flex flex-col items-center justify-center gap-0.5 h-full rounded-xl transition-colors cursor-pointer ${
                activeView === 'admin'
                  ? 'text-[#243B64] dark:text-sky-400 font-bold'
                  : 'text-[#667085] dark:text-slate-400 hover:text-[#263244] dark:hover:text-slate-100'
              }`}
            >
              <div className="relative">
                <ShieldAlert className="w-5 h-5" />
                {warningsCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[16px] h-4 rounded-full text-[9px] bg-[#243B64] dark:bg-[#4F86D9] text-white font-mono font-bold flex items-center justify-center">
                    {warningsCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] leading-tight">Admin</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onChangeView('offers')}
              className={`relative flex flex-col items-center justify-center gap-0.5 h-full rounded-xl transition-colors cursor-pointer ${
                activeView === 'offers'
                  ? 'text-[#4F86D9] font-bold'
                  : 'text-[#667085] dark:text-slate-400 hover:text-[#263244] dark:hover:text-slate-100'
              }`}
            >
              <div className="relative">
                <FolderKanban className="w-5 h-5" />
                {pendingOffersCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[16px] h-4 rounded-full text-[9px] bg-[#4F86D9] text-white font-mono font-bold flex items-center justify-center">
                    {pendingOffersCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] leading-tight">My Hub</span>
            </button>
          )}

          {/* 3. Post a Wish */}
          <div className="flex items-center justify-center h-full">
            <button
              type="button"
              onClick={() => onChangeView('post')}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all cursor-pointer shadow-soft ${
                activeView === 'post'
                  ? 'bg-[#243B64] text-white ring-2 ring-[#4F86D9]/30'
                  : 'bg-[#4F86D9] active:bg-[#3568B5] text-white'
              }`}
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span className="text-[10px] font-bold leading-none">Post</span>
            </button>
          </div>

          {/* 4. Chats Tab */}
          {!currentUser?.isAdmin ? (
            <button
              type="button"
              onClick={() => {
                if (onOpenChatsList) onOpenChatsList();
              }}
              className="relative flex flex-col items-center justify-center gap-0.5 h-full rounded-xl text-[#667085] dark:text-slate-400 hover:text-[#263244] dark:hover:text-slate-100 transition-colors cursor-pointer"
            >
              <div className="relative">
                <MessageSquare className="w-5 h-5" />
                {totalUnreadChats > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[16px] h-4 rounded-full text-[9px] bg-[#4F86D9] text-white font-mono font-bold flex items-center justify-center">
                    {totalUnreadChats}
                  </span>
                )}
              </div>
              <span className="text-[10px] leading-tight">Chats</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onChangeView('offers')}
              className={`relative flex flex-col items-center justify-center gap-0.5 h-full rounded-xl transition-colors cursor-pointer ${
                activeView === 'offers'
                  ? 'text-[#4F86D9] font-bold'
                  : 'text-[#667085] dark:text-slate-400 hover:text-[#263244] dark:hover:text-slate-100'
              }`}
            >
              <Tag className="w-5 h-5" />
              <span className="text-[10px] leading-tight">Offers</span>
            </button>
          )}

          {/* 5. Profile / Account */}
          <button
            type="button"
            onClick={() => {
              if (currentUser) {
                onOpenProfile();
              } else {
                onOpenAuth('login');
              }
            }}
            className="flex flex-col items-center justify-center gap-0.5 h-full rounded-xl text-[#667085] dark:text-slate-400 hover:text-[#263244] dark:hover:text-slate-100 transition-colors cursor-pointer"
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] leading-tight">
              {currentUser ? 'Account' : 'Sign In'}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
