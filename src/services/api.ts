import { User, Wish, Offer, Transaction, Review, WishCategory, WishStatus, OfferStatus, TransactionStatus } from '../types';

const API_BASE = '/api';

const VALID_CATEGORIES: Set<string> = new Set([
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
]);

function normalizeCategory(cat?: string): WishCategory {
  if (cat && VALID_CATEGORIES.has(cat)) {
    return cat as WishCategory;
  }
  return 'Other';
}

function formatBackendTimestamp(raw?: string): string {
  if (!raw) return 'Just now';
  if (
    raw === 'Just now' ||
    raw.includes('ago') ||
    raw.includes('Yesterday') ||
    raw.includes('Member')
  ) {
    return raw;
  }
  const parsed = new Date(raw);
  if (isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function mapBackendUser(u: any): User {
  const avatar =
    u.avatarUrl ||
    u.avatar ||
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80';
  return {
    id: String(u.id),
    name: u.name || 'Marketplace User',
    email: u.email || '',
    avatar,
    avatarUrl: avatar,
    rating: typeof u.rating === 'number' ? u.rating : Number(u.rating ?? 5.0),
    reviewCount: typeof u.reviewCount === 'number' ? u.reviewCount : Number(u.reviewCount ?? 0),
    verified: Boolean(u.verified ?? u.isVerified ?? true),
    isAdmin: Boolean(u.isAdmin ?? u.admin ?? false),
    joinedDate: u.joinedDate || 'Member since 2024',
    phone: u.phone || undefined,
    password: u.password || 'password123',
    warningCount: typeof u.warningCount === 'number' ? u.warningCount : 0,
    warnings: Array.isArray(u.warnings) ? u.warnings : [],
    notificationsEnabled: true,
    notificationSettings: {
      offers: true,
      messages: true,
      orders: true,
    },
  };
}

export function mapBackendWish(w: any): Wish {
  const buyer = w.buyer || {};
  const imageUrl = w.imageUrl || (Array.isArray(w.images) && w.images[0]) || undefined;
  const images =
    Array.isArray(w.images) && w.images.length > 0
      ? w.images
      : imageUrl
      ? [imageUrl]
      : [];

  return {
    id: String(w.id),
    title: w.title || 'Untitled Wish',
    brand: w.brand || undefined,
    category: normalizeCategory(w.category),
    budget: typeof w.budget === 'number' ? w.budget : Number(w.budget ?? 0),
    description: w.description || '',
    buyerId: String(w.buyerId || buyer.id || 'user-sarah'),
    buyerName: w.buyerName || buyer.name || 'Sarah Jenkins',
    buyerAvatar: w.buyerAvatar || buyer.avatarUrl || buyer.avatar || undefined,
    buyerAvatarUrl: w.buyerAvatar || buyer.avatarUrl || buyer.avatar || undefined,
    buyerRating:
      typeof w.buyerRating === 'number'
        ? w.buyerRating
        : Number(w.buyerRating ?? buyer.rating ?? 5.0),
    createdAt: formatBackendTimestamp(w.createdAt),
    status: (w.status || 'OPEN') as WishStatus,
    offersCount: typeof w.offersCount === 'number' ? w.offersCount : Number(w.offersCount ?? 0),
    imageUrl,
    images,
    isFlagged: Boolean(w.isFlagged),
  };
}

export function mapBackendOffer(o: any): Offer {
  const wish = o.wish || {};
  const seller = o.seller || {};
  const buyer = wish.buyer || {};

  return {
    id: String(o.id),
    wishId: String(o.wishId || wish.id || ''),
    wishTitle: o.wishTitle || wish.title || 'Marketplace Wish',
    category: normalizeCategory(o.category || wish.category),
    buyerId: String(o.buyerId || buyer.id || wish.buyerId || 'user-sarah'),
    buyerName: o.buyerName || buyer.name || wish.buyerName || 'Sarah Jenkins',
    sellerId: String(o.sellerId || seller.id || 'user-alex'),
    sellerName: o.sellerName || seller.name || 'Alex Miller',
    sellerRating:
      typeof o.sellerRating === 'number'
        ? o.sellerRating
        : Number(o.sellerRating ?? seller.rating ?? 5.0),
    sellerReviewCount:
      typeof o.sellerReviewCount === 'number'
        ? o.sellerReviewCount
        : Number(o.sellerReviewCount ?? seller.reviewCount ?? 0),
    offeredPrice: typeof o.offeredPrice === 'number' ? o.offeredPrice : Number(o.offeredPrice ?? 0),
    targetBudget:
      typeof o.targetBudget === 'number'
        ? o.targetBudget
        : Number(o.targetBudget ?? wish.budget ?? 0),
    details: o.details || '',
    createdAt: formatBackendTimestamp(o.createdAt),
    status: (o.status || 'PENDING') as OfferStatus,
    counterOffer:
      o.counterPrice != null
        ? {
            price: Number(o.counterPrice),
            note: o.counterNote || undefined,
            createdAt: 'Just now',
            byUserId: String(o.buyerId || buyer.id || 'user-sarah'),
            byUserName: o.buyerName || buyer.name || 'Buyer',
          }
        : o.counterOffer,
  };
}

export function mapBackendTransaction(tx: any): Transaction {
  const wish = tx.wish || {};
  const offer = tx.offer || {};
  const buyer = tx.buyer || wish.buyer || {};
  const seller = tx.seller || offer.seller || {};

  return {
    id: String(tx.id),
    wishId: String(tx.wishId || wish.id || ''),
    wishTitle: tx.wishTitle || wish.title || 'Marketplace Order',
    offerId: String(tx.offerId || offer.id || ''),
    category: normalizeCategory(tx.category || wish.category),
    buyerId: String(tx.buyerId || buyer.id || 'user-sarah'),
    buyerName: tx.buyerName || buyer.name || 'Sarah Jenkins',
    sellerId: String(tx.sellerId || seller.id || 'user-alex'),
    sellerName: tx.sellerName || seller.name || 'Alex Miller',
    agreedPrice:
      typeof tx.agreedPrice === 'number' ? tx.agreedPrice : Number(tx.agreedPrice ?? 0),
    targetBudget:
      typeof tx.targetBudget === 'number'
        ? tx.targetBudget
        : Number(tx.targetBudget ?? wish.budget ?? tx.agreedPrice ?? 0),
    status: (tx.status || 'IN_PROGRESS') as TransactionStatus,
    createdAt: formatBackendTimestamp(tx.createdAt),
    completedAt: tx.completedAt ? formatBackendTimestamp(tx.completedAt) : undefined,
    trackingNumber: tx.trackingNumber || undefined,
    notes: offer.details || tx.notes || undefined,
    buyerReviewed: Boolean(tx.buyerReviewed),
    sellerReviewed: Boolean(tx.sellerReviewed),
  };
}

export function mapBackendReview(r: any): Review {
  const tx = r.transaction || {};
  const fromUser = r.fromUser || {};
  const toUser = r.toUser || {};

  return {
    id: String(r.id),
    transactionId: String(r.transactionId || tx.id || ''),
    fromUserId: String(r.fromUserId || fromUser.id || ''),
    fromUserName: r.fromUserName || fromUser.name || 'User',
    toUserId: String(r.toUserId || toUser.id || ''),
    toUserName: r.toUserName || toUser.name || 'User',
    rating: typeof r.rating === 'number' ? r.rating : Number(r.rating ?? 5),
    comment: r.comment || '',
    createdAt: formatBackendTimestamp(r.createdAt),
  };
}

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} on ${path}`);
  }
  if (res.status === 204) {
    return undefined as unknown as T;
  }
  return res.json();
}

export async function fetchInitialMarketplaceData(): Promise<{
  users: Record<string, User>;
  wishes: Wish[];
  offers: Offer[];
  transactions: Transaction[];
  reviews: Review[];
} | null> {
  try {
    const [rawUsers, rawWishes, rawOffers, rawTransactions, rawReviews] = await Promise.all([
      requestJson<any[]>('/users'),
      requestJson<any[]>('/wishes'),
      requestJson<any[]>('/offers'),
      requestJson<any[]>('/transactions'),
      requestJson<any[]>('/reviews'),
    ]);

    const usersMap: Record<string, User> = {};
    for (const u of rawUsers) {
      const mapped = mapBackendUser(u);
      usersMap[mapped.id] = mapped;
    }

    return {
      users: usersMap,
      wishes: rawWishes.map(mapBackendWish),
      offers: rawOffers.map(mapBackendOffer),
      transactions: rawTransactions.map(mapBackendTransaction),
      reviews: rawReviews.map(mapBackendReview),
    };
  } catch (_err) {
    // Graceful fallback when running in static preview without Spring Boot server
    return null;
  }
}

export async function apiCreateWish(wish: Wish): Promise<Wish | null> {
  try {
    const payload = {
      id: wish.id,
      title: wish.title,
      brand: wish.brand,
      category: wish.category,
      budget: wish.budget,
      description: wish.description,
      imageUrl: wish.imageUrl || (wish.images && wish.images[0]) || null,
      status: wish.status,
      offersCount: wish.offersCount,
      buyerId: wish.buyerId,
      buyer: { id: wish.buyerId },
    };
    const saved = await requestJson<any>('/wishes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const mapped = mapBackendWish(saved);
    return {
      ...mapped,
      images: wish.images && wish.images.length > 0 ? wish.images : mapped.images,
    };
  } catch (_err) {
    return null;
  }
}

export async function apiUpdateWish(wish: Wish): Promise<Wish | null> {
  try {
    const payload = {
      title: wish.title,
      brand: wish.brand,
      category: wish.category,
      budget: wish.budget,
      description: wish.description,
      imageUrl: wish.imageUrl || (wish.images && wish.images[0]) || null,
      status: wish.status,
      offersCount: wish.offersCount,
      isFlagged: Boolean(wish.isFlagged),
    };
    const saved = await requestJson<any>(`/wishes/${encodeURIComponent(wish.id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const mapped = mapBackendWish(saved);
    return {
      ...mapped,
      images: wish.images && wish.images.length > 0 ? wish.images : mapped.images,
    };
  } catch (_err) {
    return null;
  }
}

export async function apiDeleteWish(wishId: string): Promise<boolean> {
  try {
    await requestJson<void>(`/wishes/${encodeURIComponent(wishId)}`, {
      method: 'DELETE',
    });
    return true;
  } catch (_err) {
    return false;
  }
}

export async function apiCreateOffer(wishId: string, offer: Offer): Promise<Offer | null> {
  try {
    const payload = {
      id: offer.id,
      wishId,
      sellerId: offer.sellerId,
      seller: { id: offer.sellerId },
      offeredPrice: offer.offeredPrice,
      targetBudget: offer.targetBudget,
      details: offer.details,
      status: offer.status || 'PENDING',
    };
    const saved = await requestJson<any>(`/wishes/${encodeURIComponent(wishId)}/offers`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapBackendOffer(saved);
  } catch (_err) {
    return null;
  }
}

export async function apiUpdateOffer(
  offerId: string,
  updates: Partial<{
    offeredPrice: number;
    details: string;
    status: OfferStatus;
    counterPrice: number;
    counterNote: string;
  }>
): Promise<Offer | null> {
  try {
    const saved = await requestJson<any>(`/offers/${encodeURIComponent(offerId)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return mapBackendOffer(saved);
  } catch (_err) {
    return null;
  }
}

export async function apiAcceptOffer(offerId: string): Promise<Transaction | null> {
  try {
    const savedTx = await requestJson<any>(`/offers/${encodeURIComponent(offerId)}/accept`, {
      method: 'POST',
    });
    return mapBackendTransaction(savedTx);
  } catch (_err) {
    return null;
  }
}

export async function apiDeleteOffer(
  offerId: string,
  options?: { reason?: string; withdraw?: boolean }
): Promise<boolean> {
  try {
    const params = new URLSearchParams();
    if (options?.reason) params.set('reason', options.reason);
    if (options?.withdraw) params.set('withdraw', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';
    await requestJson<void>(`/offers/${encodeURIComponent(offerId)}${query}`, {
      method: 'DELETE',
    });
    return true;
  } catch (_err) {
    return false;
  }
}

export async function apiCompleteTransaction(transactionId: string): Promise<Transaction | null> {
  try {
    const saved = await requestJson<any>(
      `/transactions/${encodeURIComponent(transactionId)}/complete`,
      { method: 'POST' }
    );
    return mapBackendTransaction(saved);
  } catch (_err) {
    return null;
  }
}

export async function apiCreateReview(review: Review): Promise<Review | null> {
  try {
    const payload = {
      id: review.id,
      transactionId: review.transactionId,
      fromUserId: review.fromUserId,
      toUserId: review.toUserId,
      rating: review.rating,
      comment: review.comment,
    };
    const saved = await requestJson<any>('/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapBackendReview(saved);
  } catch (_err) {
    return null;
  }
}

export async function apiRegisterUser(
  name: string,
  email: string,
  password?: string,
  avatarUrl?: string
): Promise<User | null> {
  try {
    const saved = await requestJson<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, avatarUrl }),
    });
    return mapBackendUser(saved);
  } catch (_err) {
    return null;
  }
}

export async function apiLoginUser(email: string, password?: string): Promise<User | null> {
  try {
    const saved = await requestJson<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return mapBackendUser(saved);
  } catch (_err) {
    return null;
  }
}

export async function apiResetUserPassword(email: string, password: string): Promise<User | null> {
  try {
    const saved = await requestJson<any>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return mapBackendUser(saved);
  } catch (_err) {
    return null;
  }
}

export async function apiUpdateUser(user: User): Promise<User | null> {
  try {
    const payload = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl || user.avatar,
      password: user.password,
      warningCount: user.warningCount,
      rating: user.rating,
      reviewCount: user.reviewCount,
    };
    const saved = await requestJson<any>(`/users/${encodeURIComponent(user.id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return mapBackendUser(saved);
  } catch (_err) {
    return null;
  }
}
