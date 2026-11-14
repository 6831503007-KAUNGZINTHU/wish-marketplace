export type WishCategory = 
  | 'Electronics' 
  | 'Crafts' 
  | 'Fashion' 
  | 'Collectibles' 
  | 'Food' 
  | 'Home' 
  | 'Books' 
  | 'Toys' 
  | 'Sports' 
  | 'Other';

export type Category = WishCategory | 'All';

export interface WarningRecord {
  id: string;
  targetUserId: string;
  targetUserName: string;
  targetWishId?: string;
  targetWishTitle?: string;
  reason: string;
  severity: 'NOTICE' | 'POLICY_WARNING' | 'FINAL_WARNING';
  details: string;
  issuedAt: string;
  issuedBy: string;
  adminId?: string;
  active: boolean;
  read?: boolean;
  readAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  avatarUrl?: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  joinedDate: string;
  isAdmin?: boolean;
  password?: string;
  resetToken?: string;
  resetTokenExpiry?: number;
  warningCount?: number;
  warnings?: WarningRecord[];
  phone?: string;
  notificationsEnabled?: boolean;
  notificationSettings?: {
    offers: boolean;
    messages: boolean;
    orders: boolean;
  };
  notificationPreferences?: {
    Electronics?: boolean;
    Crafts?: boolean;
    Fashion?: boolean;
    Collectibles?: boolean;
    Food?: boolean;
    Home?: boolean;
    Books?: boolean;
    Toys?: boolean;
    Sports?: boolean;
    Other?: boolean;
    [key: string]: boolean | undefined;
  };
}

export type WishStatus = 'OPEN' | 'OFFER_RECEIVED' | 'MATCHED' | 'FULFILLED' | 'CANCELLED';

export interface Wish {
  id: string; // e.g. WISH-1989
  title: string;
  category: WishCategory;
  budget: number;
  description: string;
  brand?: string;
  keywords?: string[];
  buyerId: string;
  buyerName: string;
  buyerAvatar?: string;
  buyerAvatarUrl?: string;
  buyerRating: number;
  createdAt: string;
  status: WishStatus;
  offersCount: number;
  imageUrl?: string;
  images?: string[]; // Up to 5 images
  isFlagged?: boolean;
  adminNotes?: string;
}

export type OfferStatus = 'PENDING' | 'COUNTERED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CLOSED' | 'REMOVED_BY_ADMIN';

export interface CounterOffer {
  price: number;
  note?: string;
  createdAt: string;
  byUserId: string;
  byUserName: string;
}

export interface Offer {
  id: string; // e.g. OFF-4421
  wishId: string;
  wishTitle: string;
  category: WishCategory;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  sellerRating: number;
  sellerReviewCount: number;
  offeredPrice: number;
  targetBudget: number;
  details: string;
  createdAt: string;
  status: OfferStatus;
  declinedAt?: string;
  closedAt?: string;
  removedAt?: string;
  removedBy?: string;
  removedById?: string;
  removalReason?: string;
  counterOffer?: CounterOffer;
}

export type TransactionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Review {
  id: string;
  transactionId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface Transaction {
  id: string; // e.g. TX-9032
  wishId: string;
  wishTitle: string;
  offerId: string;
  category: WishCategory;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  agreedPrice: number;
  targetBudget: number;
  status: TransactionStatus;
  createdAt: string;
  completedAt?: string;
  trackingNumber?: string;
  notes?: string;
  buyerReviewed?: boolean;
  sellerReviewed?: boolean;
}

export interface ChatMessage {
  id: string;
  wishId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  createdAt?: number;
  readBy?: string[];
  images?: string[];
}

export interface ChatTarget {
  wishId: string;
  title: string;
  wishImage?: string;
  category?: string;
  wishStatus?: string;
  buyerId?: string;
  buyerName?: string;
  sellerId?: string;
  sellerName?: string;
  budget?: number;
  agreedPrice?: number;
  offerId?: string;
  offerPrice?: number;
  offerStatus?: string;
  offerDetails?: string;
  isOrder?: boolean;
  orderId?: string;
  status?: string;
  trackingNumber?: string;
  lastMessage?: string;
  lastTimestamp?: string;
  lastMessageCreatedAt?: number;
  lastSenderName?: string;
  hasUnread?: boolean;
  unreadCount?: number;
}

export interface ActiveChatWindowState {
  target: ChatTarget;
  isMinimized: boolean;
  zIndex: number;
  position?: { x: number; y: number };
}

export interface AISearchMatch {
  id: string;
  reason: string;
}

export interface AISearchResponse {
  query: string;
  interpretedIntent: string;
  matchedWishes: AISearchMatch[];
  matchedOffers: AISearchMatch[];
  suggestedQueries: string[];
}
