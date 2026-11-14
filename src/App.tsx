import React, { useState, useEffect, useCallback } from 'react';
import { 
  INITIAL_USERS, INITIAL_WISHES, INITIAL_OFFERS, 
  INITIAL_TRANSACTIONS, INITIAL_REVIEWS, INITIAL_CHATS, INITIAL_WARNINGS 
} from './data/initialData';
import { User, Wish, Offer, Transaction, Review, ChatMessage, WarningRecord, ChatTarget, WishCategory, ActiveChatWindowState } from './types';
import { Navbar, HubQuickTab } from './components/Navbar';
import { PostWishSection } from './components/PostWishSection';
import { BrowseWishesSection } from './components/BrowseWishesSection';
import { WishDetailsPage } from './components/WishDetailsPage';
import { TransactionsSection } from './components/TransactionsSection';
import { AdminDashboardSection } from './components/AdminDashboardSection';
import { EditWishModal } from './components/EditWishModal';
import { EditOfferModal } from './components/EditOfferModal';
import { AdminWarningModal } from './components/AdminWarningModal';
import { FloatingChatDock } from './components/FloatingChatDock';
import { ChatsListModal } from './components/ChatsListModal';
import { UserProfileDrawer } from './components/UserProfileDrawer';
import { PublicUserProfileModal } from './components/PublicUserProfileModal';
import { AuthPage, AuthMode } from './components/AuthPage';
import { DeleteWishModal } from './components/DeleteWishModal';
import { DeclineOfferModal } from './components/DeclineOfferModal';
import { BuyerWarningDetailModal } from './components/BuyerWarningDetailModal';
import { CheckCircle2, ArrowRight, Sparkles, PlusCircle } from 'lucide-react';
import { formatBaht } from './utils/currency';
import {
  fetchInitialMarketplaceData,
  apiCreateWish,
  apiUpdateWish,
  apiDeleteWish,
  apiCreateOffer,
  apiUpdateOffer,
  apiAcceptOffer,
  apiDeleteOffer,
  apiCompleteTransaction,
  apiCreateReview,
  apiRegisterUser,
  apiResetUserPassword,
  apiUpdateUser,
} from './services/api';

const STORAGE_USERS_KEY = 'wishmarket_users_baht_v1';
const STORAGE_CHATS_KEY = 'wishmarket_chats_baht_v1';
const STORAGE_READ_STATE_KEY = 'wishmarket_chat_read_state_baht_v1';
const STORAGE_WISHES_KEY = 'wishmarket_wishes_baht_v1';
const STORAGE_OFFERS_KEY = 'wishmarket_offers_baht_v1';
const STORAGE_TRANSACTIONS_KEY = 'wishmarket_transactions_baht_v1';
const STORAGE_WARNINGS_KEY = 'wishmarket_warnings_baht_v1';
const STORAGE_THEME_KEY = 'wishmarket_theme_v1';

export default function App() {
  // Theme state ('light' | 'dark') with localStorage persistence & prefers-color-scheme fallback
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {}
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_THEME_KEY, theme);
    } catch (e) {}
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Users & Authentication with localStorage persistence
  const [users, setUsers] = useState<Record<string, User>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_USERS;
  });
  // Default to Sarah
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS['user-sarah']);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('login');
  const [intendedAction, setIntendedAction] = useState<{
    type: 'post' | 'offer' | 'chat' | 'accept';
    data?: any;
    message?: string;
  } | null>(null);

  // Save users state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    } catch (e) {}
  }, [users]);

  // Marketplace Data State with localStorage persistence
  const [wishes, setWishes] = useState<Wish[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_WISHES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_WISHES;
  });

  const [offers, setOffers] = useState<Offer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_OFFERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_OFFERS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TRANSACTIONS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_TRANSACTIONS;
  });

  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);

  // Save wishes, offers, and transactions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_WISHES_KEY, JSON.stringify(wishes));
    } catch (e) {}
  }, [wishes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_OFFERS_KEY, JSON.stringify(offers));
    } catch (e) {}
  }, [offers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TRANSACTIONS_KEY, JSON.stringify(transactions));
    } catch (e) {}
  }, [transactions]);

  // Fetch live data from Spring Boot REST API (/api/wishes, /api/offers, /api/users, /api/transactions, /api/reviews)
  useEffect(() => {
    let active = true;
    fetchInitialMarketplaceData().then((data) => {
      if (!active || !data) return;
      if (Object.keys(data.users).length > 0) {
        setUsers((prev) => ({ ...prev, ...data.users }));
        setCurrentUser((prev) => (prev && data.users[prev.id] ? data.users[prev.id] : prev));
      }
      if (data.wishes.length > 0) {
        setWishes(data.wishes);
      }
      if (data.offers.length > 0) {
        setOffers(data.offers);
      }
      if (data.transactions.length > 0) {
        setTransactions(data.transactions);
      }
      if (data.reviews.length > 0) {
        setReviews(data.reviews);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Chats state with localStorage persistence
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHATS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_CHATS;
  });

  // Persistent read state tracking per user: Map of userId -> wishId -> lastReadTimestamp
  const [chatReadState, setChatReadState] = useState<Record<string, Record<string, number>>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_READ_STATE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  const [warnings, setWarnings] = useState<WarningRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_WARNINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_WARNINGS;
  });

  // Save warnings state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_WARNINGS_KEY, JSON.stringify(warnings));
    } catch (e) {}
  }, [warnings]);

  const [selectedWarningForModal, setSelectedWarningForModal] = useState<WarningRecord | null>(null);

  // Navigation View: 'browse' | 'post' | 'offers' | 'admin'
  const [activeView, setActiveView] = useState<'browse' | 'post' | 'offers' | 'admin'>('browse');
  // Selected Wish for dedicated Wish Details page
  const [selectedWishId, setSelectedWishId] = useState<string | null>(null);
  const [browseResetNonce, setBrowseResetNonce] = useState(0);
  const [hubNavigationRequest, setHubNavigationRequest] = useState<{
    tab: HubQuickTab;
    subTab?: 'received' | 'sent' | 'declined';
    nonce: number;
  } | null>(null);

  // Search Input (draft) & Submitted Search Query + Category Filters
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // UI Drawers & Modals
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChatsListOpen, setIsChatsListOpen] = useState(false);
  // Messenger-Style Multi-Chat Floating Windows State
  const [openChatWindows, setOpenChatWindows] = useState<ActiveChatWindowState[]>([]);
  const [editingWish, setEditingWish] = useState<Wish | null>(null);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [wishToDelete, setWishToDelete] = useState<Wish | null>(null);
  const [offerToDecline, setOfferToDecline] = useState<Offer | null>(null);
  const [warningTarget, setWarningTarget] = useState<{ wish?: Wish; user?: { id: string; name: string } } | null>(null);

  const handleSubmitSearch = useCallback((submittedText: string) => {
    setSearchInput(submittedText);
    setSearchQuery(submittedText);
    setSelectedWishId(null);
    setActiveView('browse');
  }, []);

  const handleLogoClick = useCallback(() => {
    setSearchInput('');
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedWishId(null);
    setActiveView('browse');
    setBrowseResetNonce((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  const [viewingUserProfile, setViewingUserProfile] = useState<{
    userId: string;
    fallback?: { id: string; name: string; avatar?: string; rating?: number; reviewCount?: number };
  } | null>(null);

  const handleViewUserProfile = (
    userId: string,
    userFallback?: { id: string; name: string; avatar?: string; rating?: number; reviewCount?: number }
  ) => {
    setViewingUserProfile({ userId, fallback: userFallback });
  };

  const markChatAsRead = (wishId: string, userId: string) => {
    if (!wishId || !userId) return;
    const now = Date.now();

    // 1. Update persistent read state timestamp for this user & chat
    setChatReadState((prev) => {
      const userRead = prev[userId] || {};
      const updated = {
        ...prev,
        [userId]: {
          ...userRead,
          [wishId]: now,
        },
      };
      try {
        localStorage.setItem(STORAGE_READ_STATE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 2. Mark messages in this chat as read by this user
    setChats((prev) => {
      const msgs = prev[wishId];
      if (!msgs || msgs.length === 0) return prev;
      let modified = false;
      const updatedMsgs = msgs.map((m) => {
        if (!m.readBy?.includes(userId)) {
          modified = true;
          return {
            ...m,
            readBy: [...(m.readBy || []), userId],
          };
        }
        return m;
      });

      if (!modified) return prev;

      const updated = {
        ...prev,
        [wishId]: updatedMsgs,
      };
      try {
        localStorage.setItem(STORAGE_CHATS_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleOpenChat = (target: ChatTarget) => {
    if (currentUser?.isAdmin) {
      showToast('Administrators oversee moderation and do not participate in trading chats.');
      return;
    }

    // Enrich ChatTarget with product image, category, wish status, and offer/order details
    const matchedWish = wishes.find((w) => w.id === target.wishId);
    const matchedTx = transactions.find((t) => t.wishId === target.wishId);
    const matchedOffer =
      (target.offerId ? offers.find((o) => o.id === target.offerId) : undefined) ||
      offers.find(
        (o) =>
          o.wishId === target.wishId &&
          o.status !== 'CLOSED' &&
          o.status !== 'REMOVED_BY_ADMIN' &&
          (!target.sellerId || o.sellerId === target.sellerId)
      );

    const enrichedTarget: ChatTarget = {
      ...target,
      title: target.title || matchedWish?.title || matchedTx?.wishTitle || 'Marketplace Item',
      wishImage:
        target.wishImage ||
        (matchedWish?.images && matchedWish.images.length > 0
          ? matchedWish.images[0]
          : matchedWish?.imageUrl),
      category: target.category || matchedWish?.category || matchedOffer?.category || matchedTx?.category,
      wishStatus: target.wishStatus || matchedWish?.status,
      budget: target.budget ?? matchedWish?.budget ?? matchedTx?.targetBudget ?? matchedOffer?.targetBudget,
      agreedPrice: target.agreedPrice ?? matchedTx?.agreedPrice,
      offerId: target.offerId ?? matchedOffer?.id,
      offerPrice: target.offerPrice ?? matchedOffer?.offeredPrice,
      offerStatus: target.offerStatus ?? matchedOffer?.status,
      offerDetails: target.offerDetails ?? matchedOffer?.details,
      isOrder: target.isOrder ?? !!matchedTx,
      orderId: target.orderId ?? matchedTx?.id,
      trackingNumber: target.trackingNumber ?? matchedTx?.trackingNumber,
      status: target.status ?? matchedTx?.status,
    };

    setOpenChatWindows((prev) => {
      const existingIdx = prev.findIndex((w) => w.target.wishId === enrichedTarget.wishId);
      const nextZIndex = Math.max(100, ...prev.map((w) => w.zIndex || 100), 100) + 1;

      if (existingIdx >= 0) {
        // Bring existing window to front, un-minimize it, update target info
        return prev.map((w, idx) =>
          idx === existingIdx
            ? { ...w, target: { ...w.target, ...enrichedTarget }, isMinimized: false, zIndex: nextZIndex }
            : w
        );
      }

      // Add new window without closing other opened chats
      return [
        ...prev,
        {
          target: enrichedTarget,
          isMinimized: false,
          zIndex: nextZIndex,
        },
      ];
    });

    if (currentUser) {
      markChatAsRead(enrichedTarget.wishId, currentUser.id);
    }
  };

  const handleCloseChatWindow = (wishId: string) => {
    setOpenChatWindows((prev) => prev.filter((w) => w.target.wishId !== wishId));
  };

  const handleMinimizeChatWindow = (wishId: string) => {
    setOpenChatWindows((prev) =>
      prev.map((w) => (w.target.wishId === wishId ? { ...w, isMinimized: true } : w))
    );
  };

  const handleRestoreChatWindow = (wishId: string) => {
    setOpenChatWindows((prev) => {
      const nextZIndex = Math.max(100, ...prev.map((w) => w.zIndex || 100), 100) + 1;
      return prev.map((w) =>
        w.target.wishId === wishId ? { ...w, isMinimized: false, zIndex: nextZIndex } : w
      );
    });
    if (currentUser) {
      markChatAsRead(wishId, currentUser.id);
    }
  };

  const handleFocusChatWindow = (wishId: string) => {
    setOpenChatWindows((prev) => {
      const highest = Math.max(100, ...prev.map((w) => w.zIndex || 100), 100);
      const current = prev.find((w) => w.target.wishId === wishId);
      if (current && current.zIndex === highest) return prev;
      return prev.map((w) =>
        w.target.wishId === wishId ? { ...w, zIndex: highest + 1 } : w
      );
    });
  };

  const handleMoveChatWindow = (wishId: string, pos: { x: number; y: number }) => {
    setOpenChatWindows((prev) =>
      prev.map((w) => (w.target.wishId === wishId ? { ...w, position: pos } : w))
    );
  };

  const handleResetWindowPosition = (wishId: string) => {
    setOpenChatWindows((prev) =>
      prev.map((w) => (w.target.wishId === wishId ? { ...w, position: undefined } : w))
    );
  };

  const handleOpenChatFromWish = (wish: Wish) => {
    if (currentUser?.isAdmin) {
      showToast('Administrators oversee moderation and do not participate in trading chats.');
      return;
    }
    const relevantOffer = offers.find(
      (o) =>
        o.wishId === wish.id &&
        o.status !== 'CLOSED' &&
        o.status !== 'REMOVED_BY_ADMIN' &&
        (currentUser ? (o.sellerId === currentUser.id || o.buyerId === currentUser.id) : true)
    );
    handleOpenChat({
      wishId: wish.id,
      title: wish.title,
      wishImage: wish.images && wish.images.length > 0 ? wish.images[0] : wish.imageUrl,
      category: wish.category,
      wishStatus: wish.status,
      buyerId: wish.buyerId,
      buyerName: wish.buyerName,
      sellerId: relevantOffer?.sellerId,
      sellerName: relevantOffer?.sellerName,
      budget: wish.budget,
      offerId: relevantOffer?.id,
      offerPrice: relevantOffer?.offeredPrice,
      offerStatus: relevantOffer?.status,
      offerDetails: relevantOffer?.details,
    });
  };

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Switch Active User
  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    if (user.isAdmin) {
      setOpenChatWindows([]);
      setIsChatsListOpen(false);
      showToast(`Signed in as Administrator (${user.name})`);
    } else {
      showToast(`Signed in as ${user.name}`);
      // If was in admin view, switch back to browse
      if (activeView === 'admin') {
        setActiveView('browse');
      }
    }
  };

  // Open Auth Modal / Flow with optional intended action
  const handleOpenAuthModal = (
    mode: AuthMode = 'login',
    action?: { type: 'post' | 'offer' | 'chat' | 'accept'; data?: any; message?: string }
  ) => {
    setAuthModalMode(mode);
    if (action) {
      setIntendedAction(action);
    }
    setIsAuthOpen(true);
  };

  // Handle successful login / registration
  const handleSuccessfulAuth = (user: User) => {
    handleSelectUser(user);
    setIsAuthOpen(false);

    if (intendedAction) {
      if (intendedAction.type === 'post') {
        setActiveView('post');
        showToast('Signed in successfully! You can now publish your wish.');
      } else if (intendedAction.type === 'offer') {
        setActiveView('browse');
        showToast('Signed in successfully! You can now submit your offer.');
      } else if (intendedAction.type === 'chat' && intendedAction.data) {
        handleOpenChat(intendedAction.data);
      }
      setIntendedAction(null);
    }
  };

  // Update user password after reset flow
  const handleUpdateUserPassword = (email: string, newPass: string): boolean => {
    const normEmail = email.trim().toLowerCase();
    const userEntry = Object.entries(users).find(
      ([_, u]) => u.email.trim().toLowerCase() === normEmail
    );
    if (!userEntry) return false;

    const [id, u] = userEntry;
    const updatedUser: User = {
      ...u,
      password: newPass,
      resetToken: undefined,
      resetTokenExpiry: undefined,
    };

    setUsers((prev) => ({ ...prev, [id]: updatedUser }));
    void apiResetUserPassword(normEmail, newPass);
    showToast(`Password successfully updated for ${u.name}!`);
    return true;
  };

  // Register New User
  const handleRegisterUser = (
    name: string,
    email: string,
    password?: string,
    avatarUrl?: string
  ): User => {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = Object.values(users).find(
      (u) => u.email.trim().toLowerCase() === normalizedEmail
    );
    if (existing) {
      const updatedExisting: User = {
        ...existing,
        password: password || existing.password || 'password123',
        avatarUrl: avatarUrl || existing.avatarUrl,
        avatar: avatarUrl || existing.avatar,
      };
      setUsers((prev) => ({ ...prev, [existing.id]: updatedExisting }));
      void apiRegisterUser(name, normalizedEmail, password, avatarUrl);
      return updatedExisting;
    }

    const id = `user-${Date.now()}`;
    const newUser: User = {
      id,
      name,
      email: normalizedEmail,
      password: password || 'password123',
      avatar: avatarUrl || '',
      avatarUrl: avatarUrl || undefined,
      rating: 5.0,
      reviewCount: 0,
      verified: true,
      joinedDate: 'Just now',
      warningCount: 0,
      warnings: [],
      notificationsEnabled: true,
      notificationSettings: {
        offers: true,
        messages: true,
        orders: true,
      },
    };

    setUsers((prev) => ({ ...prev, [id]: newUser }));
    void apiRegisterUser(name, normalizedEmail, password, avatarUrl);
    return newUser;
  };

  // Log Out
  const handleLogout = () => {
    setCurrentUser(null);
    handleOpenAuthModal('login');
    if (activeView === 'admin') {
      setActiveView('browse');
    }
    showToast('Signed out successfully.');
  };

  // Post a Wish (Supports up to 5 images)
  const handlePostWish = (wishData: {
    title: string;
    category: WishCategory;
    budget: number;
    description: string;
    imageUrl?: string;
    images?: string[];
  }): Wish => {
    if (!currentUser) {
      setIsAuthOpen(true);
      throw new Error('Must be logged in to post a wish');
    }

    const newId = `WISH-${Math.floor(1000 + Math.random() * 9000)}`;
    const imagesList = wishData.images && wishData.images.length > 0 
      ? wishData.images.slice(0, 5) 
      : (wishData.imageUrl ? [wishData.imageUrl] : []);

    const newWish: Wish = {
      id: newId,
      title: wishData.title,
      category: wishData.category,
      budget: wishData.budget,
      description: wishData.description,
      buyerId: currentUser.id,
      buyerName: currentUser.name,
      buyerAvatar: currentUser.avatarUrl || currentUser.avatar,
      buyerAvatarUrl: currentUser.avatarUrl,
      buyerRating: currentUser.rating,
      createdAt: 'Just now',
      status: 'OPEN',
      offersCount: 0,
      imageUrl: imagesList.length > 0 ? imagesList[0] : undefined,
      images: imagesList,
    };

    setWishes((prev) => [newWish, ...prev]);
    void apiCreateWish(newWish).then((saved) => {
      if (saved) {
        setWishes((prev) => prev.map((w) => (w.id === newWish.id ? { ...newWish, ...saved } : w)));
      }
    });
    showToast(`Your wish "${newWish.title}" is now active in the feed!`);
    return newWish;
  };

  // Edit an existing Wish (Owner or Admin)
  const handleEditWish = (updatedWish: Wish) => {
    setWishes((prev) =>
      prev.map((w) => (w.id === updatedWish.id ? updatedWish : w))
    );
    void apiUpdateWish(updatedWish);

    // Sync titles in associated offers and transactions if title was modified
    setOffers((prev) =>
      prev.map((o) =>
        o.wishId === updatedWish.id
          ? { ...o, wishTitle: updatedWish.title, category: updatedWish.category, targetBudget: updatedWish.budget }
          : o
      )
    );

    setTransactions((prev) =>
      prev.map((t) =>
        t.wishId === updatedWish.id
          ? { ...t, wishTitle: updatedWish.title, category: updatedWish.category, targetBudget: updatedWish.budget }
          : t
      )
    );

    showToast(`Listing "${updatedWish.title}" updated successfully!`);
  };

  // Edit an existing Seller Offer
  const handleEditOffer = (updatedOffer: Offer) => {
    setOffers((prev) => {
      const next = prev.map((o) => (o.id === updatedOffer.id ? updatedOffer : o));
      try {
        localStorage.setItem(STORAGE_OFFERS_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    void apiUpdateOffer(updatedOffer.id, {
      offeredPrice: updatedOffer.offeredPrice,
      details: updatedOffer.details,
      status: updatedOffer.status,
    });

    // Keep any open floating chat window for this wish in sync with the edited offer price & notes
    setOpenChatWindows((prev) =>
      prev.map((w) =>
        w.target.wishId === updatedOffer.wishId
          ? {
              ...w,
              target: {
                ...w.target,
                offerId: updatedOffer.id,
                offerPrice: updatedOffer.offeredPrice,
                offerStatus: updatedOffer.status,
                offerDetails: updatedOffer.details,
              },
            }
          : w
      )
    );

    showToast(`Offer ${updatedOffer.id} updated to ${formatBaht(updatedOffer.offeredPrice)}!`);
  };

  // Delete Wish Logic: Confirmation popup, Owner check, marking associated offers CLOSED, toast "Wish deleted"
  const handleRequestDeleteWish = (wish: Wish) => {
    if (!currentUser || wish.buyerId !== currentUser.id) {
      showToast('Only the owner of this wish can delete it.');
      return;
    }
    setWishToDelete(wish);
  };

  const handleConfirmDeleteWish = (wishId: string) => {
    const targetWish = wishes.find((w) => w.id === wishId);
    if (!currentUser || !targetWish || targetWish.buyerId !== currentUser.id) {
      showToast('Only the owner of this wish can delete it.');
      setWishToDelete(null);
      return;
    }

    // 1. Delete wish from backend & state immediately (no refresh)
    void apiDeleteWish(wishId);
    const updatedWishes = wishes.filter((w) => w.id !== wishId);
    setWishes(updatedWishes);
    try {
      localStorage.setItem(STORAGE_WISHES_KEY, JSON.stringify(updatedWishes));
    } catch (e) {}

    // 2. Mark any offers on that wish as "Closed" so nothing breaks
    const closedDateStr = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const updatedOffers = offers.map((o) =>
      o.wishId === wishId ? { ...o, status: 'CLOSED' as const, closedAt: closedDateStr } : o
    );
    setOffers(updatedOffers);
    try {
      localStorage.setItem(STORAGE_OFFERS_KEY, JSON.stringify(updatedOffers));
    } catch (e) {}

    if (selectedWishId === wishId) {
      setSelectedWishId(null);
    }
    setWishToDelete(null);
    showToast('Wish deleted');
  };

  const handleDeleteWish = (wishId: string) => {
    const wish = wishes.find((w) => w.id === wishId);
    if (wish) {
      handleRequestDeleteWish(wish);
    }
  };

  // Toggle Flag on a Wish (Admin)
  const handleToggleFlagWish = (wishId: string) => {
    const target = wishes.find((w) => w.id === wishId);
    if (target) {
      void apiUpdateWish({ ...target, isFlagged: !target.isFlagged });
    }
    setWishes((prev) =>
      prev.map((w) => (w.id === wishId ? { ...w, isFlagged: !w.isFlagged } : w))
    );
    showToast('Listing moderation flag updated.');
  };

  // Issue warning to buyer/user (Admin)
  const handleIssueWarning = (data: {
    targetUserId: string;
    targetUserName: string;
    targetWishId?: string;
    targetWishTitle?: string;
    reason: string;
    severity: 'NOTICE' | 'POLICY_WARNING' | 'FINAL_WARNING';
    details: string;
  }) => {
    if (!currentUser?.isAdmin) {
      showToast('Unauthorized: Only administrators can issue moderation warnings.');
      return;
    }

    if (!data.targetUserId || !data.reason || !data.details.trim()) {
      showToast('Validation failed: Recipient, violation reason, and moderator explanation are required.');
      return;
    }

    const newWarn: WarningRecord = {
      id: `WARN-${Math.floor(1000 + Math.random() * 9000)}`,
      targetUserId: data.targetUserId,
      targetUserName: data.targetUserName,
      adminId: currentUser.id,
      targetWishId: data.targetWishId,
      targetWishTitle: data.targetWishTitle,
      reason: data.reason,
      severity: data.severity,
      details: data.details,
      issuedAt: 'Just now',
      issuedBy: currentUser?.name || 'Marketplace Admin',
      active: true,
      read: false,
    };

    setWarnings((prev) => [newWarn, ...prev]);

    // Update target user's warning status in all users record
    setUsers((prev) => {
      const u = prev[data.targetUserId];
      if (!u) return prev;
      return {
        ...prev,
        [data.targetUserId]: {
          ...u,
          warningCount: (u.warningCount || 0) + 1,
          warnings: [newWarn, ...(u.warnings || [])],
        },
      };
    });

    // Synchronize currentUser if active user is the recipient buyer
    setCurrentUser((prev) => {
      if (!prev || prev.id !== data.targetUserId) return prev;
      return {
        ...prev,
        warningCount: (prev.warningCount || 0) + 1,
        warnings: [newWarn, ...(prev.warnings || [])],
      };
    });

    showToast(`Official warning issued to ${data.targetUserName}! Notification sent.`);
  };

  // Mark a warning as read by the buyer
  const handleMarkWarningAsRead = (warningId: string) => {
    const readAtStr = new Date().toISOString();
    setWarnings((prev) =>
      prev.map((w) => (w.id === warningId ? { ...w, read: true, readAt: readAtStr } : w))
    );

    setUsers((prev) => {
      let changed = false;
      const updated = { ...prev };
      Object.keys(updated).forEach((uId) => {
        const u = updated[uId];
        if (u.warnings?.some((w) => w.id === warningId)) {
          changed = true;
          updated[uId] = {
            ...u,
            warnings: u.warnings.map((w) =>
              w.id === warningId ? { ...w, read: true, readAt: readAtStr } : w
            ),
          };
        }
      });
      return changed ? updated : prev;
    });

    setCurrentUser((prev) => {
      if (!prev || !prev.warnings?.some((w) => w.id === warningId)) return prev;
      return {
        ...prev,
        warnings: prev.warnings.map((w) =>
          w.id === warningId ? { ...w, read: true, readAt: readAtStr } : w
        ),
      };
    });
  };

  // Revoke / resolve a warning (Admin)
  const handleRevokeWarning = (warningId: string) => {
    const targetWarn = warnings.find((w) => w.id === warningId);
    setWarnings((prev) => prev.filter((w) => w.id !== warningId));

    if (targetWarn) {
      setUsers((prev) => {
        const u = prev[targetWarn.targetUserId];
        if (!u) return prev;
        const newCount = Math.max(0, (u.warningCount || 1) - 1);
        return {
          ...prev,
          [targetWarn.targetUserId]: {
            ...u,
            warningCount: newCount,
            warnings: (u.warnings || []).filter((w) => w.id !== warningId),
          },
        };
      });

      setCurrentUser((prev) => {
        if (!prev || prev.id !== targetWarn.targetUserId) return prev;
        return {
          ...prev,
          warningCount: Math.max(0, (prev.warningCount || 1) - 1),
          warnings: (prev.warnings || []).filter((w) => w.id !== warningId),
        };
      });
    }

    showToast('Warning resolved and removed from buyer record.');
  };

  // Admin remove offer permanently from active marketplace
  const handleRemoveOfferAsAdmin = (offer: Offer, reason?: string) => {
    if (!currentUser?.isAdmin) {
      showToast('Unauthorized: Administrator privileges required to remove offers.');
      return;
    }

    const removedDateStr = new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    // 1. Mark offer status as REMOVED_BY_ADMIN and record moderation details
    const updatedOffers = offers.map((o) =>
      o.id === offer.id
        ? {
            ...o,
            status: 'REMOVED_BY_ADMIN' as const,
            removedAt: removedDateStr,
            removedBy: currentUser.name,
            removedById: currentUser.id,
            removalReason: reason || 'Violation of community trading rules',
          }
        : o
    );
    setOffers(updatedOffers);
    try {
      localStorage.setItem(STORAGE_OFFERS_KEY, JSON.stringify(updatedOffers));
    } catch (e) {}

    // 2. Decrement active offers count on associated wish
    const updatedWishes = wishes.map((w) => {
      if (w.id === offer.wishId) {
        const remainingActiveOffers = updatedOffers.filter(
          (o) => o.wishId === w.id && o.status === 'PENDING'
        ).length;
        return {
          ...w,
          offersCount: remainingActiveOffers,
        };
      }
      return w;
    });
    setWishes(updatedWishes);
    try {
      localStorage.setItem(STORAGE_WISHES_KEY, JSON.stringify(updatedWishes));
    } catch (e) {}
    void apiDeleteOffer(offer.id, { reason });

    showToast(`Offer ${offer.id} successfully removed from active marketplace.`);
  };

  // Submit Offer on a Wish (Non-admin users)
  const handleSubmitOffer = (wish: Wish, offeredPrice: number, details: string) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    if (currentUser.isAdmin) {
      showToast('Admins cannot place offers. Admin role is for moderation.');
      return;
    }

    const newOfferId = `OFF-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOffer: Offer = {
      id: newOfferId,
      wishId: wish.id,
      wishTitle: wish.title,
      category: wish.category,
      buyerId: wish.buyerId,
      buyerName: wish.buyerName,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      sellerRating: currentUser.rating,
      sellerReviewCount: currentUser.reviewCount,
      offeredPrice,
      targetBudget: wish.budget,
      details,
      createdAt: 'Just now',
      status: 'PENDING',
    };

    setOffers((prev) => [newOffer, ...prev]);
    void apiCreateOffer(wish.id, newOffer);

    // Update Wish offer count
    setWishes((prev) =>
      prev.map((w) =>
        w.id === wish.id
          ? { ...w, status: 'OFFER_RECEIVED', offersCount: w.offersCount + 1 }
          : w
      )
    );

    showToast(`Offer of ${formatBaht(offeredPrice)} sent to ${wish.buyerName}!`);
  };

  // Accept Offer
  const handleAcceptOffer = (offer: Offer) => {
    const txId = `TX-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTx: Transaction = {
      id: txId,
      wishId: offer.wishId,
      wishTitle: offer.wishTitle,
      offerId: offer.id,
      category: offer.category,
      buyerId: offer.buyerId,
      buyerName: offer.buyerName,
      sellerId: offer.sellerId,
      sellerName: offer.sellerName,
      agreedPrice: offer.offeredPrice,
      targetBudget: offer.targetBudget,
      status: 'IN_PROGRESS',
      createdAt: 'Just now',
      trackingNumber: `USPS-9400-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-01`,
      notes: offer.details,
    };

    setOffers((prev) =>
      prev.map((o) => (o.id === offer.id ? { ...o, status: 'ACCEPTED' } : o))
    );

    setWishes((prev) =>
      prev.map((w) => (w.id === offer.wishId ? { ...w, status: 'MATCHED' } : w))
    );

    setTransactions((prev) => [newTx, ...prev]);

    void apiAcceptOffer(offer.id).then((savedTx) => {
      if (savedTx) {
        setTransactions((prev) => prev.map((t) => (t.id === newTx.id ? { ...newTx, ...savedTx } : t)));
      }
    });

    // Record order confirmation event in conversation thread
    const acceptChatMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      wishId: offer.wishId,
      senderId: offer.buyerId,
      senderName: offer.buyerName,
      text: `🎉 Offer of ${formatBaht(offer.offeredPrice)} accepted! Order #${txId} is confirmed. Ready to coordinate shipping & delivery.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      readBy: [offer.buyerId],
    };

    setChats((prev) => {
      const updated = {
        ...prev,
        [offer.wishId]: [...(prev[offer.wishId] || []), acceptChatMsg],
      };
      try {
        localStorage.setItem(STORAGE_CHATS_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    showToast(`Offer accepted! Order #${txId} created at ${formatBaht(offer.offeredPrice)}.`);
  };

  // Request Decline Offer (Opens Confirmation Alert Modal)
  const handleDeclineOffer = (offerId: string) => {
    const target = offers.find((o) => o.id === offerId);
    if (target) {
      setOfferToDecline(target);
    }
  };

  // Confirm Decline Offer
  const handleConfirmDeclineOffer = (offerId: string) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const formattedTime = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const declinedAt = `${formattedDate} at ${formattedTime}`;

    const updatedOffers = offers.map((o) =>
      o.id === offerId
        ? { ...o, status: 'DECLINED' as const, declinedAt: o.declinedAt || declinedAt }
        : o
    );
    setOffers(updatedOffers);
    try {
      localStorage.setItem(STORAGE_OFFERS_KEY, JSON.stringify(updatedOffers));
    } catch (e) {}
    void apiUpdateOffer(offerId, { status: 'DECLINED' });

    setOfferToDecline(null);
    showToast('Offer declined. You can cancel the decline anytime if you change your mind.');
  };

  // Undo / Cancel Decline on an Offer (Restore to PENDING so buyer can accept/buy again)
  const handleUndoDeclineOffer = (offerId: string) => {
    const updatedOffers = offers.map((o) =>
      o.id === offerId
        ? { ...o, status: 'PENDING' as const, declinedAt: undefined }
        : o
    );
    setOffers(updatedOffers);
    try {
      localStorage.setItem(STORAGE_OFFERS_KEY, JSON.stringify(updatedOffers));
    } catch (e) {}
    void apiUpdateOffer(offerId, { status: 'PENDING' });

    showToast('Offer decline cancelled! This offer is active again and ready to accept.');
  };

  // Withdraw / Cancel an Offer (Seller)
  const handleWithdrawOffer = (offerId: string) => {
    setOffers((prev) => prev.filter((o) => o.id !== offerId));
    void apiDeleteOffer(offerId, { withdraw: true });
    showToast('Your offer proposal has been withdrawn.');
  };

  // Update Profile & Contact Information
  const handleUpdateProfile = (updated: { name: string; avatar: string; avatarUrl?: string; email: string; phone: string }) => {
    if (!currentUser) return;
    const userId = currentUser.id;
    const resolvedAvatar = updated.avatarUrl !== undefined ? updated.avatarUrl : updated.avatar;
    const updatedUser: User = {
      ...currentUser,
      name: updated.name.trim() || currentUser.name,
      avatar: resolvedAvatar,
      avatarUrl: resolvedAvatar || undefined,
      email: updated.email.trim() || currentUser.email,
      phone: updated.phone.trim() || currentUser.phone,
    };

    setUsers((prev) => ({
      ...prev,
      [userId]: updatedUser,
    }));
    setCurrentUser(updatedUser);
    void apiUpdateUser(updatedUser);

    // Synchronize name & avatar in wishes
    setWishes((prev) =>
      prev.map((w) =>
        w.buyerId === userId
          ? { ...w, buyerName: updatedUser.name, buyerAvatar: updatedUser.avatar, buyerAvatarUrl: updatedUser.avatarUrl }
          : w
      )
    );

    // Synchronize name in offers
    setOffers((prev) =>
      prev.map((o) => {
        let changed = false;
        let u = { ...o };
        if (o.buyerId === userId) {
          u.buyerName = updatedUser.name;
          changed = true;
        }
        if (o.sellerId === userId) {
          u.sellerName = updatedUser.name;
          changed = true;
        }
        return changed ? u : o;
      })
    );

    // Synchronize in transactions
    setTransactions((prev) =>
      prev.map((t) => {
        let changed = false;
        let u = { ...t };
        if (t.buyerId === userId) {
          u.buyerName = updatedUser.name;
          changed = true;
        }
        if (t.sellerId === userId) {
          u.sellerName = updatedUser.name;
          changed = true;
        }
        return changed ? u : t;
      })
    );

    showToast('Profile and contact details saved!');
  };

  // Mark Order as Complete
  const handleCompleteTransaction = (transactionId: string) => {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === transactionId
          ? { ...tx, status: 'COMPLETED', completedAt: 'Just now' }
          : tx
      )
    );
    void apiCompleteTransaction(transactionId);
    showToast('Order delivered! You can now leave a seller review.');
  };

  // Submit Review (Only for regular buyers and sellers, never for Admin)
  const handleSubmitReview = (transactionId: string, rating: number, comment: string) => {
    if (!currentUser || currentUser.isAdmin) {
      showToast('Administrators cannot submit marketplace reviews.');
      return;
    }
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx) return;

    // Admin cannot be reviewed either
    if (tx.buyerId === 'user-admin' || tx.sellerId === 'user-admin') return;

    const isSeller = currentUser?.id === tx.sellerId;
    const toUserId = isSeller ? tx.buyerId : tx.sellerId;
    const toUserName = isSeller ? tx.buyerName : tx.sellerName;

    const newRevId = `REV-${Math.floor(100 + Math.random() * 900)}`;
    const newRev: Review = {
      id: newRevId,
      transactionId,
      fromUserId: currentUser.id,
      fromUserName: currentUser.name,
      toUserId,
      toUserName,
      rating,
      comment,
      createdAt: 'Just now',
    };

    setReviews((prev) => [newRev, ...prev]);
    void apiCreateReview(newRev);

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              buyerReviewed: !isSeller ? true : t.buyerReviewed,
              sellerReviewed: isSeller ? true : t.sellerReviewed,
            }
          : t
      )
    );

    // Update recipient user's public rating & review count
    setUsers((prev) => {
      const target = prev[toUserId];
      if (!target) return prev;
      const targetReviews = reviews.filter((r) => r.toUserId === toUserId);
      const newCount = targetReviews.length + 1;
      const newTotal = targetReviews.reduce((sum, r) => sum + r.rating, 0) + rating;
      const newRating = Number((newTotal / newCount).toFixed(2));
      return {
        ...prev,
        [toUserId]: {
          ...target,
          rating: newRating,
          reviewCount: newCount,
        },
      };
    });

    if (currentUser?.id === toUserId) {
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              reviewCount: prev.reviewCount + 1,
            }
          : null
      );
    }

    showToast('Review submitted! Thank you for your feedback.');
  };

  // Chat message sending (supports text, images, or both)
  const handleSendMessage = (wishId: string, text: string, images?: string[], senderOverride?: User) => {
    if (!wishId) return;
    const sender = senderOverride || currentUser || users['user-sarah'];
    const now = Date.now();

    // Only the sender has read the message they just sent; the recipient gets an unread notification
    const readBy = [sender.id];

    const newMsg: ChatMessage = {
      id: `msg-${now}`,
      wishId,
      senderId: sender.id,
      senderName: sender.name,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: now,
      readBy,
      images: images && images.length > 0 ? images : undefined,
    };

    setChats((prev) => {
      const updated = {
        ...prev,
        [wishId]: [...(prev[wishId] || []), newMsg],
      };
      try {
        localStorage.setItem(STORAGE_CHATS_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setChatReadState((prev) => {
      const senderRead = prev[sender.id] || {};
      const updated = {
        ...prev,
        [sender.id]: {
          ...senderRead,
          [wishId]: now,
        },
      };
      try {
        localStorage.setItem(STORAGE_READ_STATE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const pendingOffersCount = currentUser
    ? offers.filter((o) => o.status === 'PENDING' && o.buyerId === currentUser.id).length
    : offers.filter((o) => o.status === 'PENDING').length;

  // Helper to get deterministic sort timestamp for a conversation's latest message
  const getChatSortTimestamp = (wishId: string, msgs: ChatMessage[]): number => {
    if (!msgs || msgs.length === 0) return 0;
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg.createdAt && typeof lastMsg.createdAt === 'number') {
      return lastMsg.createdAt;
    }
    const baseOrder: Record<string, number> = {
      'WISH-9901': 1729606800000,
      'WISH-1001': 1729682040000,
      'WISH-1004': 1729683480000,
      'WISH-1007': 1729684320000,
    };
    return (baseOrder[wishId] || 1729680000000) + msgs.length * 1000;
  };

  // Active Chat Summaries for Navbar Shortcut & Quick Dropdown
  // Admins do NOT participate in peer-to-peer buyer-seller chats.
  // Regular users only see conversations where they are a participant (buyer or seller).
  const chatSummaries: ChatTarget[] = (!currentUser || currentUser.isAdmin)
    ? []
    : Object.entries(chats)
        .filter(([wishId, msgs]) => {
          if (!msgs || msgs.length === 0) return false;
          const wish = wishes.find((w) => w.id === wishId);
          const tx = transactions.find((t) => t.wishId === wishId);
          const isParticipant =
            wish?.buyerId === currentUser.id ||
            tx?.buyerId === currentUser.id ||
            tx?.sellerId === currentUser.id ||
            offers.some((o) => o.wishId === wishId && (o.buyerId === currentUser.id || o.sellerId === currentUser.id)) ||
            msgs.some((m) => m.senderId === currentUser.id);
          return isParticipant;
        })
        .map(([wishId, msgs]) => {
          const wish = wishes.find((w) => w.id === wishId);
          const tx = transactions.find((t) => t.wishId === wishId);
          const offer = offers.find(
            (o) =>
              o.wishId === wishId &&
              o.status !== 'CLOSED' &&
              o.status !== 'REMOVED_BY_ADMIN' &&
              (o.buyerId === currentUser.id || o.sellerId === currentUser.id)
          ) || offers.find((o) => o.wishId === wishId && o.status !== 'CLOSED' && o.status !== 'REMOVED_BY_ADMIN');
          const lastMsg = msgs[msgs.length - 1];
          const lastMessageCreatedAt = getChatSortTimestamp(wishId, msgs);

          const buyerId = wish?.buyerId || tx?.buyerId || offer?.buyerId || 'user-sarah';
          const buyerName = wish?.buyerName || tx?.buyerName || offer?.buyerName || 'Sarah Jenkins';
          const sellerId = tx?.sellerId || offer?.sellerId || (currentUser.id === buyerId ? 'user-alex' : currentUser.id);
          const sellerName = tx?.sellerName || offer?.sellerName || (currentUser.id === buyerId ? 'Alex Miller' : currentUser.name);

          // Calculate unread count for current user
          const userLastRead = chatReadState[currentUser.id]?.[wishId] || 0;
          const unreadMsgs = msgs.filter((m) => {
            // Own messages never count as unread for the sender
            if (m.senderId === currentUser.id) return false;
            // If already in readBy array, not unread
            if (m.readBy?.includes(currentUser.id)) return false;
            // If message was created on or before user's lastRead timestamp, not unread
            if (userLastRead && m.createdAt && m.createdAt <= userLastRead) return false;
            return true;
          });

          const unreadCount = unreadMsgs.length;
          const hasUnread = unreadCount > 0;

          // If the last message is only images, display "📷 Photo"
          const isPhotoOnly = !lastMsg?.text?.trim() && !!lastMsg?.images && lastMsg.images.length > 0;
          const lastMessageText = isPhotoOnly ? '📷 Photo' : (lastMsg?.text || '');

          return {
            wishId,
            title: wish?.title || tx?.wishTitle || offer?.wishTitle || 'Marketplace Item',
            wishImage: wish?.images && wish.images.length > 0 ? wish.images[0] : wish?.imageUrl,
            category: wish?.category || tx?.category || offer?.category,
            wishStatus: wish?.status,
            buyerId,
            buyerName,
            sellerId,
            sellerName,
            budget: wish?.budget || tx?.targetBudget || offer?.targetBudget,
            agreedPrice: tx?.agreedPrice,
            offerId: offer?.id,
            offerPrice: offer?.offeredPrice,
            offerStatus: offer?.status,
            offerDetails: offer?.details,
            isOrder: !!tx,
            orderId: tx?.id,
            trackingNumber: tx?.trackingNumber,
            status: tx?.status,
            lastMessage: lastMessageText,
            lastTimestamp: lastMsg?.timestamp,
            lastMessageCreatedAt,
            lastSenderName: lastMsg?.senderName,
            hasUnread,
            unreadCount,
          };
        })
        .sort((a, b) => {
          // 1. Unread message notifications MUST always appear first at the top
          if (Boolean(a.hasUnread) !== Boolean(b.hasUnread)) {
            return a.hasUnread ? -1 : 1;
          }
          // 2. Then sort by most recent message timestamp (newest first)
          return (b.lastMessageCreatedAt || 0) - (a.lastMessageCreatedAt || 0);
        });

  // Badge count: Number of chats with unread messages
  const unreadChatsCount = chatSummaries.filter((c) => c.hasUnread).length;

  // Selected Wish object
  const selectedWish = selectedWishId ? wishes.find((w) => w.id === selectedWishId) : null;

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-[#0B0F19] text-[#172033] dark:text-slate-100 pb-24 md:pb-20 overflow-x-hidden transition-colors duration-200">
      {/* Top Sticky Navbar with Search, Shortcut Chat & Navigation */}
      <Navbar
        currentUser={currentUser}
        allUsers={users}
        onSelectUser={handleSelectUser}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAuth={(m) => handleOpenAuthModal(m || 'login')}
        onLogout={handleLogout}
        activeView={activeView}
        onChangeView={(view) => {
          setActiveView(view);
          if (view === 'browse') {
            setSelectedWishId(null);
          }
        }}
        onLogoClick={handleLogoClick}
        onNavigateMyHub={(tab, subTab) => {
          setSelectedWishId(null);
          setActiveView('offers');
          setHubNavigationRequest({ tab, subTab, nonce: Date.now() });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onSearchSubmit={handleSubmitSearch}
        wishes={wishes}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        pendingOffersCount={pendingOffersCount}
        myWishesCount={currentUser ? wishes.filter((w) => w.buyerId === currentUser.id).length : 0}
        myOffersCount={
          currentUser && !currentUser.isAdmin
            ? offers.filter(
                (o) => o.status !== 'CLOSED' && o.status !== 'REMOVED_BY_ADMIN' && o.sellerId === currentUser.id
              ).length
            : 0
        }
        warningsCount={warnings.length}
        userWarnings={currentUser ? warnings.filter((w) => w.targetUserId === currentUser.id) : []}
        onOpenWarningDetail={(warn) => {
          setSelectedWarningForModal(warn);
          handleMarkWarningAsRead(warn.id);
        }}
        conversations={chatSummaries}
        unreadChatsCount={unreadChatsCount}
        onOpenChat={handleOpenChat}
        onOpenChatsList={() => setIsChatsListOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Floating System Notification Toast */}
      {toastMessage && (
        <div className="fixed top-16 sm:top-20 inset-x-3 sm:inset-x-auto sm:right-4 z-50 bg-[#172033] dark:bg-slate-800 text-white text-xs font-medium px-4 py-3 rounded-2xl shadow-card-hover border border-slate-700/60 flex items-center gap-2.5 animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* VIEW 1: Browse Wishes (Shopping Feed) OR Dedicated Wish Details Page */}
        {activeView === 'browse' && (
          <div className="space-y-6">
            {selectedWish ? (
              <WishDetailsPage
                wish={selectedWish}
                allWishes={wishes}
                currentUser={currentUser}
                allUsers={users}
                offers={offers}
                onBackToBrowse={() => setSelectedWishId(null)}
                onSelectCategory={(cat) => {
                  setSelectedCategory(cat);
                  setSelectedWishId(null);
                }}
                onSelectWish={(w) => {
                  setSelectedWishId(w.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenChat={handleOpenChatFromWish}
                onSubmitOffer={handleSubmitOffer}
                onRequireAuth={() =>
                  handleOpenAuthModal('login', {
                    type: 'offer',
                    message: 'Sign in to submit your direct price offer to this buyer.',
                  })
                }
                onEditWish={(wish) => setEditingWish(wish)}
                onEditOffer={(offer) => setEditingOffer(offer)}
                onRequestDeleteWish={handleRequestDeleteWish}
                onDeleteWish={handleDeleteWish}
                onToggleFlagWish={handleToggleFlagWish}
                onWarnBuyer={(wish) => setWarningTarget({ wish })}
                onViewUserProfile={handleViewUserProfile}
                onAcceptOffer={handleAcceptOffer}
                onDeclineOffer={handleDeclineOffer}
                onUndoDeclineOffer={handleUndoDeclineOffer}
              />
            ) : (
              <BrowseWishesSection
                key={browseResetNonce}
                wishes={wishes}
                offers={offers}
                currentUser={currentUser}
                allUsers={users}
                onSelectWish={(wish) => {
                  setSelectedWishId(wish.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenChat={handleOpenChatFromWish}
                onSubmitOffer={handleSubmitOffer}
                onRequireAuth={() =>
                  handleOpenAuthModal('login', {
                    type: 'offer',
                    message: 'Sign in to submit your direct price offer to this buyer.',
                  })
                }
                searchQuery={searchQuery}
                setSearchQuery={(q) => {
                  setSearchInput(q);
                  setSearchQuery(q);
                }}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                onDeleteWish={handleDeleteWish}
                onRequestDeleteWish={handleRequestDeleteWish}
                onEditWish={(wish) => setEditingWish(wish)}
                onEditOffer={(offer) => setEditingOffer(offer)}
                onWarnBuyer={(wish) => setWarningTarget({ wish })}
                onViewUserProfile={handleViewUserProfile}
                onNavigateToPost={() => {
                  setSelectedWishId(null);
                  setActiveView('post');
                }}
              />
            )}
          </div>
        )}

        {/* VIEW 2: Post a Wish (Buyer Form with up to 5 images) */}
        {activeView === 'post' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <PostWishSection
              currentUser={currentUser}
              onPostWish={handlePostWish}
              onRequireAuth={() =>
                handleOpenAuthModal('login', {
                  type: 'post',
                  message: 'Sign in to publish your wish to the marketplace feed.',
                })
              }
              onViewWishFeed={() => setActiveView('browse')}
            />
          </div>
        )}

        {/* VIEW 3: My Wishes, Offers & Orders (Direct Hub) */}
        {activeView === 'offers' && (
          <div className="space-y-6">
            <TransactionsSection
              currentUser={currentUser}
              allUsers={users}
              wishes={wishes}
              offers={offers}
              transactions={transactions}
              reviews={reviews}
              requestedTab={hubNavigationRequest}
              onAcceptOffer={handleAcceptOffer}
              onDeclineOffer={handleDeclineOffer}
              onUndoDeclineOffer={handleUndoDeclineOffer}
              onRemoveOfferAsAdmin={handleRemoveOfferAsAdmin}
              onWithdrawOffer={handleWithdrawOffer}
              onEditOffer={(offer) => setEditingOffer(offer)}
              onEditWish={(wish) => setEditingWish(wish)}
              onDeleteWish={handleRequestDeleteWish}
              onSelectWish={(wish) => {
                setSelectedWishId(wish.id);
                setActiveView('browse');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateToPost={() => {
                setSelectedWishId(null);
                setActiveView('post');
              }}
              onCompleteTransaction={handleCompleteTransaction}
              onSubmitReview={handleSubmitReview}
              onRequireAuth={() =>
                handleOpenAuthModal('login', {
                  type: 'accept',
                  message: 'Sign in to review and accept offers.',
                })
              }
              onOpenChat={handleOpenChat}
              onViewUserProfile={handleViewUserProfile}
            />
          </div>
        )}

        {/* VIEW 4: Admin Moderation Center (Admin View) */}
        {activeView === 'admin' && (
          <div className="space-y-6">
            <AdminDashboardSection
              wishes={wishes}
              users={users}
              warnings={warnings}
              onOpenEditWish={(wish) => setEditingWish(wish)}
              onOpenWarningModal={(targetWish, targetUser) => setWarningTarget({ wish: targetWish, user: targetUser })}
              onDeleteWish={handleDeleteWish}
              onToggleFlagWish={handleToggleFlagWish}
              onRevokeWarning={handleRevokeWarning}
              onViewFeed={() => {
                setSelectedWishId(null);
                setActiveView('browse');
              }}
              onSelectWish={(wish) => {
                setSelectedWishId(wish.id);
                setActiveView('browse');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}
      </main>

      {/* Edit Listing Modal (Supports up to 5 photos) */}
      <EditWishModal
        wish={editingWish}
        isOpen={!!editingWish}
        onClose={() => setEditingWish(null)}
        onSave={handleEditWish}
        isAdmin={currentUser?.isAdmin}
      />

      {/* Edit Seller Offer Modal */}
      <EditOfferModal
        offer={editingOffer}
        isOpen={!!editingOffer}
        onClose={() => setEditingOffer(null)}
        onSave={handleEditOffer}
      />

      {/* Admin Issue Warning Modal */}
      <AdminWarningModal
        isOpen={!!warningTarget}
        onClose={() => setWarningTarget(null)}
        targetWish={warningTarget?.wish}
        targetUser={warningTarget?.user}
        onIssueWarning={handleIssueWarning}
      />

      {/* Messenger-Style Multi-Chat Floating Windows Dock */}
      {!currentUser?.isAdmin && (
        <FloatingChatDock
          openWindows={openChatWindows}
          currentUser={currentUser}
          allUsers={users}
          wishes={wishes}
          offers={offers}
          chats={chats}
          onCloseWindow={handleCloseChatWindow}
          onMinimizeWindow={handleMinimizeChatWindow}
          onRestoreWindow={handleRestoreChatWindow}
          onFocusWindow={handleFocusChatWindow}
          onMoveWindow={handleMoveChatWindow}
          onResetWindowPosition={handleResetWindowPosition}
          onSendMessage={handleSendMessage}
          onSwitchUser={handleSelectUser}
          onViewUserProfile={handleViewUserProfile}
          onViewWish={(wishId) => {
            setSelectedWishId(wishId);
            setActiveView('browse');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onEditOffer={(offer) => setEditingOffer(offer)}
        />
      )}

      {/* All Chats Directory Modal (Trading members only, never admin) */}
      {!currentUser?.isAdmin && (
        <ChatsListModal
          isOpen={isChatsListOpen}
          onClose={() => setIsChatsListOpen(false)}
          conversations={chatSummaries}
          currentUser={currentUser}
          allUsers={users}
          onSelectChat={handleOpenChat}
        />
      )}

      {/* User Profile & Settings Drawer */}
      <UserProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={currentUser}
        allUsers={users}
        onUpdateProfile={handleUpdateProfile}
        onUpdateNotifications={(enabled, settings) => {
          if (!currentUser) return;
          const updatedUser: User = {
            ...currentUser,
            notificationsEnabled: enabled,
            notificationSettings: settings || currentUser.notificationSettings || {
              offers: true,
              messages: true,
              orders: true,
            },
          };
          setUsers((prev) => ({
            ...prev,
            [currentUser.id]: updatedUser,
          }));
          setCurrentUser(updatedUser);
        }}
        onUpdatePreferences={(newPrefs) => {
          if (!currentUser) return;
          setUsers((prev) => ({
            ...prev,
            [currentUser.id]: {
              ...prev[currentUser.id],
              notificationPreferences: newPrefs,
            },
          }));
          setCurrentUser((prev) =>
            prev ? { ...prev, notificationPreferences: newPrefs } : null
          );
        }}
        userWishes={wishes.filter((w) => currentUser && w.buyerId === currentUser.id)}
        userOffers={offers.filter(
          (o) => currentUser && (o.buyerId === currentUser.id || o.sellerId === currentUser.id)
        )}
        userTransactions={transactions.filter(
          (t) => currentUser && (t.buyerId === currentUser.id || t.sellerId === currentUser.id)
        )}
        reviews={reviews}
        onSubmitReview={handleSubmitReview}
        onAcceptOffer={handleAcceptOffer}
        onDeclineOffer={handleDeclineOffer}
        onUndoDeclineOffer={handleUndoDeclineOffer}
        onOpenAuth={() => handleOpenAuthModal('login')}
        onOpenAllChats={() => {
          if (currentUser?.isAdmin) return;
          setIsProfileOpen(false);
          setIsChatsListOpen(true);
        }}
        onChangeView={setActiveView}
        onOpenOfferChat={(off) => {
          if (currentUser?.isAdmin) return;
          handleOpenChat({
            wishId: off.wishId,
            title: off.wishTitle,
            buyerId: off.buyerId,
            buyerName: off.buyerName,
            sellerId: off.sellerId,
            sellerName: off.sellerName,
            agreedPrice: off.offeredPrice,
            budget: off.targetBudget,
            isOrder: false,
          });
        }}
        onOpenOrderChat={(tx) => {
          if (currentUser?.isAdmin) return;
          handleOpenChat({
            wishId: tx.wishId,
            title: tx.wishTitle,
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
        }}
        onEditWish={(wish) => setEditingWish(wish)}
        onDeleteWish={handleDeleteWish}
        onRequestDeleteWish={handleRequestDeleteWish}
        onViewUserProfile={handleViewUserProfile}
        onOpenWarningDetail={(warn) => {
          setSelectedWarningForModal(warn);
          handleMarkWarningAsRead(warn.id);
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onSelectTheme={(newTheme) => setTheme(newTheme)}
      />

      {/* Buyer Official Moderation Warning Detail Modal */}
      <BuyerWarningDetailModal
        isOpen={Boolean(selectedWarningForModal)}
        warning={selectedWarningForModal}
        onClose={() => setSelectedWarningForModal(null)}
        onAcknowledge={(warnId) => {
          handleMarkWarningAsRead(warnId);
          setSelectedWarningForModal(null);
        }}
        onViewWish={(wishId) => {
          setSelectedWishId(wishId);
          setActiveView('browse');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Delete Wish Quick Confirmation Modal */}
      <DeleteWishModal
        isOpen={!!wishToDelete}
        wish={wishToDelete}
        onClose={() => setWishToDelete(null)}
        onConfirmDelete={handleConfirmDeleteWish}
      />

      {/* Decline Offer Quick Confirmation Modal */}
      <DeclineOfferModal
        isOpen={!!offerToDecline}
        offer={offerToDecline}
        onClose={() => setOfferToDecline(null)}
        onConfirmDecline={handleConfirmDeclineOffer}
      />

      {/* Public User Profile Modal (Wishlist & Reviews inspection) */}
      <PublicUserProfileModal
        isOpen={!!viewingUserProfile}
        onClose={() => setViewingUserProfile(null)}
        userId={viewingUserProfile?.userId || null}
        userFallback={viewingUserProfile?.fallback}
        allUsers={users}
        wishes={wishes}
        reviews={reviews}
        currentUser={currentUser}
        onOpenChat={(target) => {
          if (currentUser?.isAdmin) return;
          handleOpenChat(target);
        }}
        onSendOffer={(wish) => {
          setViewingUserProfile(null);
          setSelectedWishId(wish.id);
          setActiveView('browse');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onEditWish={(wish) => setEditingWish(wish)}
        onDeleteWish={handleDeleteWish}
      />

      {/* Authentication Experience (Login, Register, Forgot Password, Reset Password) */}
      <AuthPage
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setIntendedAction(null);
        }}
        currentUser={currentUser}
        allUsers={users}
        onLoginUser={handleSuccessfulAuth}
        onRegisterUser={(name, email, password, avatarUrl) => {
          const user = handleRegisterUser(name, email, password, avatarUrl);
          handleSuccessfulAuth(user);
          return user;
        }}
        onUpdateUserPassword={handleUpdateUserPassword}
        initialMode={authModalMode}
        intendedActionMessage={intendedAction?.message}
        onContinueAsGuest={() => {
          setCurrentUser(null);
          setIntendedAction(null);
          showToast('Browsing as Guest');
        }}
      />
    </div>
  );
}
