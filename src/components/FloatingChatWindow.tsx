import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, ChatTarget, Wish, Offer } from '../types';
import {
  X, Send, MessageSquare, Package, ArrowRightLeft,
  Minus, Maximize2, RotateCcw, Image as ImageIcon, AlertCircle,
  ExternalLink, ShoppingBag, Edit3, ChevronUp, ChevronDown
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { formatBaht } from '../utils/currency';

interface FloatingChatWindowProps {
  target: ChatTarget;
  currentUser: User;
  allUsers: Record<string, User>;
  wishes?: Wish[];
  offers?: Offer[];
  messages: ChatMessage[];
  isMinimized: boolean;
  zIndex: number;
  position?: { x: number; y: number };
  dockStyle?: React.CSSProperties;
  onClose: () => void;
  onMinimize: () => void;
  onRestore: () => void;
  onFocus: () => void;
  onMove: (pos: { x: number; y: number }) => void;
  onResetPosition: () => void;
  onSendMessage: (wishId: string, text: string, images?: string[], senderOverride?: User) => void;
  onSwitchUser: (user: User) => void;
  onViewUserProfile?: (userId: string, userFallback?: { id: string; name: string; avatar?: string }) => void;
  onViewWish?: (wishId: string) => void;
  onEditOffer?: (offer: Offer) => void;
}

export const FloatingChatWindow: React.FC<FloatingChatWindowProps> = ({
  target,
  currentUser,
  allUsers,
  wishes = [],
  offers = [],
  messages,
  isMinimized,
  zIndex,
  position,
  dockStyle,
  onClose,
  onMinimize,
  onRestore,
  onFocus,
  onMove,
  onResetPosition,
  onSendMessage,
  onSwitchUser,
  onViewUserProfile,
  onViewWish,
  onEditOffer,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isDealExpanded, setIsDealExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialLeft: number;
    initialTop: number;
  } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxImage(null);
      }
    };
    if (lightboxImage) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [lightboxImage]);

  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  // Resolve full product & offer context from live wishes/offers if available
  const wishId = target.wishId;
  const linkedWish = wishes.find((w) => w.id === wishId);
  const linkedOffers = offers.filter(
    (o) => o.wishId === wishId && o.status !== 'CLOSED' && o.status !== 'REMOVED_BY_ADMIN'
  );
  const relevantOffer =
    (target.offerId ? linkedOffers.find((o) => o.id === target.offerId) : undefined) ||
    linkedOffers.find(
      (o) =>
        (target.sellerId && o.sellerId === target.sellerId) ||
        o.sellerId === currentUser.id
    ) ||
    linkedOffers[0];

  const title = linkedWish?.title || target.title;
  const productImage =
    target.wishImage ||
    linkedWish?.images?.[0] ||
    linkedWish?.imageUrl;
  const category = target.category || linkedWish?.category || relevantOffer?.category;
  const buyerId = target.buyerId || linkedWish?.buyerId;
  const buyerName = target.buyerName || linkedWish?.buyerName || 'Buyer';
  const sellerId = target.sellerId || relevantOffer?.sellerId;
  const sellerName = target.sellerName || relevantOffer?.sellerName;
  const budget = target.budget ?? linkedWish?.budget ?? relevantOffer?.targetBudget;
  const agreedPrice = target.agreedPrice;
  const offerPrice = target.offerPrice ?? relevantOffer?.offeredPrice;
  const offerDetails = target.offerDetails ?? relevantOffer?.details;
  const offerStatus = target.offerStatus ?? relevantOffer?.status;
  const offerId = target.offerId ?? relevantOffer?.id;
  const isOrder = !!target.isOrder;
  const orderId = target.orderId;
  const trackingNumber = target.trackingNumber;

  const displayOfferAmount = isOrder ? agreedPrice : offerPrice;
  const priceDelta =
    budget !== undefined && displayOfferAmount !== undefined
      ? budget - displayOfferAmount
      : undefined;

  // Determine other participant
  const isCurrentUserBuyer = currentUser.id === buyerId;
  const otherPartyName = isCurrentUserBuyer
    ? (sellerName || 'Seller')
    : buyerName;
  const otherPartyRole = isCurrentUserBuyer ? 'Seller' : 'Buyer';

  const otherUserId = isCurrentUserBuyer ? (sellerId || 'user-alex') : (buyerId || 'user-sarah');
  const otherUserObj = allUsers[otherUserId];
  const canEditLinkedOffer = Boolean(
    onEditOffer &&
    relevantOffer &&
    relevantOffer.sellerId === currentUser.id &&
    !isOrder &&
    relevantOffer.status !== 'ACCEPTED'
  );

  // Drag handling
  const handleStartDrag = (clientX: number, clientY: number, targetEl: EventTarget | null) => {
    if (!windowRef.current) return;
    if (targetEl instanceof HTMLElement && (
      targetEl.closest('button') ||
      targetEl.closest('input') ||
      targetEl.closest('a')
    )) {
      return;
    }

    onFocus();

    const rect = windowRef.current.getBoundingClientRect();
    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initialLeft: rect.left,
      initialTop: rect.top,
    };

    const handlePointerMove = (moveEvt: MouseEvent | TouchEvent) => {
      if (!dragStartRef.current || !windowRef.current) return;
      const currentX = 'touches' in moveEvt ? moveEvt.touches[0].clientX : moveEvt.clientX;
      const currentY = 'touches' in moveEvt ? moveEvt.touches[0].clientY : moveEvt.clientY;

      const deltaX = currentX - dragStartRef.current.startX;
      const deltaY = currentY - dragStartRef.current.startY;

      const rawLeft = dragStartRef.current.initialLeft + deltaX;
      const rawTop = dragStartRef.current.initialTop + deltaY;

      const winWidth = windowRef.current.offsetWidth || 384;
      const winHeight = windowRef.current.offsetHeight || (isMinimized ? 48 : 580);

      const clampedX = Math.max(8, Math.min(window.innerWidth - winWidth - 8, rawLeft));
      const clampedY = Math.max(8, Math.min(window.innerHeight - winHeight - 8, rawTop));

      onMove({ x: clampedX, y: clampedY });
    };

    const handlePointerUp = () => {
      dragStartRef.current = null;
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleStartDrag(e.clientX, e.clientY, e.target);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleStartDrag(e.touches[0].clientX, e.touches[0].clientY, e.target);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImageError(null);

    if (attachedImages.length + files.length > 5) {
      setImageError('You can attach a maximum of 5 images per message.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = file.name.toLowerCase();
      const hasValidExt = allowedExtensions.some((ext) => fileName.endsWith(ext));
      const hasValidMime = allowedTypes.includes(file.type);

      if (!hasValidMime && !hasValidExt) {
        setImageError(`"${file.name}" is not supported. Please choose JPG, PNG, or WebP.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        setImageError(`"${file.name}" exceeds 5MB limit (${sizeMb}MB). Max 5MB per image.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      validFiles.push(file);
    }

    const readPromises = validFiles.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read image'));
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises)
      .then((dataUrls) => {
        setAttachedImages((prev) => [...prev, ...dataUrls].slice(0, 5));
      })
      .catch(() => {
        setImageError('Could not process images. Please try again.');
      })
      .finally(() => {
        if (fileInputRef.current) fileInputRef.current.value = '';
      });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setAttachedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setImageError(null);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && attachedImages.length === 0) return;
    onSendMessage(
      wishId,
      inputText.trim(),
      attachedImages.length > 0 ? attachedImages : undefined
    );
    setInputText('');
    setAttachedImages([]);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const quickReplies = isOrder
    ? [
        'Thanks! When will you ship?',
        'Package is being prepped securely.',
        'Tracking updated! Dropping off today.',
        'Package arrived safely and works great!',
      ]
    : [
        'Is this item still available?',
        'What condition is it in?',
        'I have this ready to ship!',
        'Can negotiate price or accessories.',
      ];

  const computedStyle: React.CSSProperties = {
    zIndex,
    ...(position
      ? {
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
        }
      : dockStyle || { position: 'fixed', bottom: 0, right: 16 }),
  };

  /* -------------------------------------------------------------
   * MINIMIZED BAR STATE (Clear Product + Offer/Price + Person)
   * ------------------------------------------------------------- */
  if (isMinimized) {
    return (
      <div
        ref={windowRef}
        style={computedStyle}
        onClick={onFocus}
        className="select-none animate-in fade-in slide-in-from-bottom-2 duration-150"
      >
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="flex items-center justify-between gap-2 bg-[#172033] hover:bg-[#1E293B] text-white px-3 py-2 rounded-xl sm:rounded-t-xl sm:rounded-b-none shadow-2xl border border-slate-700/80 cursor-grab active:cursor-grabbing w-60 sm:w-80 transition-colors"
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              onRestore();
            }}
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
            title={`Click to expand chat about ${title}`}
          >
            {productImage ? (
              <img
                src={productImage}
                alt={title}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-lg object-cover ring-1 ring-white/20 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4 text-sky-200" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate text-white leading-tight">
                {title}
              </p>
              <p className="text-[11px] text-slate-300 truncate leading-tight flex items-center gap-1 mt-0.5 tabular-nums">
                {(displayOfferAmount || budget) && (
                  <span className="text-emerald-300 font-mono font-bold shrink-0">
                    {isOrder ? 'Order' : offerPrice ? 'Offer' : 'Budget'} {formatBaht((displayOfferAmount ?? budget) || 0)}
                  </span>
                )}
                <span aria-hidden="true">·</span>
                <span className="truncate">{otherPartyName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {position && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onResetPosition();
                }}
                className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-white/10 transition cursor-pointer"
                title="Dock window back to bottom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRestore();
              }}
              className="p-1.5 text-slate-200 hover:text-white rounded hover:bg-white/10 transition cursor-pointer"
              title="Restore chat window"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 text-slate-300 hover:text-red-300 rounded hover:bg-white/10 transition cursor-pointer"
              title="Close chat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dealStageLabel = isOrder
    ? `Order #${orderId || wishId}`
    : displayOfferAmount !== undefined
    ? `Offer ${offerId || ''}${offerStatus ? ` · ${offerStatus}` : ''}`.trim()
    : `Wish ${wishId}`;

  /* -------------------------------------------------------------
   * EXPANDED CHAT WINDOW WITH PROMINENT PRODUCT & OFFER HEADER
   * ------------------------------------------------------------- */
  return (
    <div
      ref={windowRef}
      style={computedStyle}
      onClick={onFocus}
      className="w-full sm:w-[400px] h-[88dvh] sm:h-[580px] max-h-[90dvh] sm:max-h-[88vh] bg-white dark:bg-[#111827] rounded-t-2xl shadow-2xl border border-[#E0E7F0] dark:border-slate-700 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-3 duration-200 pb-safe"
    >
      {/* 1. Slim Top Drag Bar: Counterparty & Window Controls */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="px-3.5 py-2.5 bg-[#172033] dark:bg-slate-950 text-white flex items-center justify-between cursor-grab active:cursor-grabbing select-none shrink-0"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          <UserAvatar
            user={otherUserObj}
            name={otherPartyName}
            size="sm"
            className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/15 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onViewUserProfile && otherUserId) {
                    onViewUserProfile(otherUserId, {
                      id: otherUserId,
                      name: otherPartyName,
                      avatar: otherUserObj?.avatar,
                    });
                  }
                }}
                className="font-bold text-white hover:text-sky-300 hover:underline truncate cursor-pointer"
                title={`View ${otherPartyName}'s profile`}
              >
                {otherPartyName}
              </button>
              <span className="text-slate-400" aria-hidden="true">·</span>
              <span className="text-[11px] font-medium text-slate-300 shrink-0">
                {otherPartyRole}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate leading-tight">
              {otherUserObj ? `You: ${currentUser.name.split(' ')[0]}` : 'Direct Message'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {otherUserObj && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSwitchUser(otherUserObj);
              }}
              className="px-2 py-1 rounded-md bg-white/10 hover:bg-[#4F86D9] text-slate-200 hover:text-white font-semibold text-[10px] flex items-center gap-1 transition cursor-pointer mr-0.5 whitespace-nowrap"
              title={`Switch demo user to ${otherUserObj.name}`}
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span className="hidden sm:inline">As {otherUserObj.name.split(' ')[0]}</span>
            </button>
          )}
          {position && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onResetPosition();
              }}
              className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Snap back to docked position"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Minimize chat"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 rounded-md text-slate-300 hover:text-rose-300 hover:bg-white/10 transition cursor-pointer"
            title="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. OUTSTANDING PRODUCT & OFFER SUBJECT BANNER */}
      <div className="bg-[#F7F9FC] dark:bg-slate-900/95 border-b border-[#E0E7F0] dark:border-slate-800 shrink-0">
        {isDealExpanded ? (
          <div className="p-3.5 space-y-3">
            {/* Top Row: 64px Product Photo + Unboxed Metadata + Bold Product Title */}
            <div className="flex items-start gap-3">
              <div
                onClick={() => onViewWish?.(wishId)}
                className={`w-16 h-16 rounded-xl overflow-hidden border border-[#E0E7F0] dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 ${
                  onViewWish ? 'cursor-pointer hover:ring-2 hover:ring-[#4F86D9] transition' : ''
                }`}
                title="View full product & offer details"
              >
                {productImage ? (
                  <img
                    src={productImage}
                    alt={title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#4F86D9] bg-[#EDF4FF] dark:bg-slate-800">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#667085] dark:text-slate-400 truncate">
                    {category && <span className="font-semibold text-[#243B64] dark:text-sky-300">{category}</span>}
                    {category && <span aria-hidden="true">·</span>}
                    <span className={`font-semibold truncate ${
                      isOrder ? 'text-[#287A55] dark:text-emerald-400' : 'text-[#4F86D9] dark:text-sky-300'
                    }`}>
                      {dealStageLabel}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDealExpanded(false)}
                    className="p-1 rounded-md text-[#667085] dark:text-slate-400 hover:text-[#263244] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer shrink-0"
                    title="Collapse item summary"
                    aria-label="Collapse item summary"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3
                  onClick={() => onViewWish?.(wishId)}
                  className={`text-[13px] font-bold text-[#172033] dark:text-slate-100 leading-snug line-clamp-2 ${
                    onViewWish ? 'cursor-pointer hover:text-[#4F86D9] dark:hover:text-sky-400 transition-colors' : ''
                  }`}
                  title={title}
                >
                  {title}
                </h3>

                <div className="flex items-center gap-3 pt-0.5">
                  {onViewWish && (
                    <button
                      type="button"
                      onClick={() => onViewWish(wishId)}
                      className="text-[11px] font-bold text-[#4F86D9] hover:text-[#3568B5] dark:text-sky-400 inline-flex items-center gap-1 cursor-pointer hover:underline whitespace-nowrap"
                    >
                      <span>View Listing</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                  {canEditLinkedOffer && relevantOffer && (
                    <button
                      type="button"
                      onClick={() => onEditOffer?.(relevantOffer)}
                      className="text-[11px] font-bold text-[#243B64] dark:text-slate-200 hover:text-[#4F86D9] inline-flex items-center gap-1 cursor-pointer hover:underline whitespace-nowrap"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Offer</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 2-Column Financial Deal Comparison Bar */}
            {(budget !== undefined || displayOfferAmount !== undefined) && (
              <div className="grid grid-cols-2 rounded-xl bg-white dark:bg-[#111827] border border-[#E0E7F0] dark:border-slate-800 divide-x divide-[#E0E7F0] dark:divide-slate-800">
                <div className="px-3 py-2">
                  <span className="text-[10px] font-semibold text-[#667085] dark:text-slate-400 block">
                    Buyer Budget
                  </span>
                  <span className="text-sm font-bold font-mono tabular-nums text-[#263244] dark:text-slate-100">
                    {budget !== undefined ? formatBaht(budget) : '—'}
                  </span>
                </div>
                <div className="px-3 py-2">
                  <span className="text-[10px] font-semibold text-[#667085] dark:text-slate-400 block">
                    {isOrder ? 'Agreed Price' : displayOfferAmount !== undefined ? 'Proposed Offer' : 'Status'}
                  </span>
                  {displayOfferAmount !== undefined ? (
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-sm font-extrabold font-mono tabular-nums text-[#287A55] dark:text-emerald-400">
                        {formatBaht(displayOfferAmount)}
                      </span>
                      {priceDelta !== undefined && priceDelta > 0 && (
                        <span className="text-[10px] font-semibold text-[#287A55] dark:text-emerald-400 tabular-nums">
                          (-{formatBaht(priceDelta)})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-[#667085] dark:text-slate-400">
                      Open Inquiry
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Offer Terms / Condition Note */}
            {offerDetails && (
              <p
                className="text-[11px] text-[#475467] dark:text-slate-300 leading-snug line-clamp-2 px-0.5"
                title={offerDetails}
              >
                <span className="font-semibold text-[#263244] dark:text-slate-200">Offer terms:</span> {offerDetails}
              </p>
            )}
          </div>
        ) : (
          /* Compact Collapsed Strip */
          <div className="px-3.5 py-2 flex items-center justify-between gap-2">
            <div
              onClick={() => setIsDealExpanded(true)}
              className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
            >
              {productImage && (
                <img
                  src={productImage}
                  alt={title}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-md object-cover border border-[#E0E7F0] dark:border-slate-700 shrink-0"
                />
              )}
              <span className="text-xs font-bold text-[#172033] dark:text-slate-100 truncate">
                {title}
              </span>
              {displayOfferAmount !== undefined && (
                <span className="text-xs font-mono font-bold text-[#287A55] dark:text-emerald-400 shrink-0 tabular-nums">
                  {formatBaht(displayOfferAmount)}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsDealExpanded(true)}
              className="text-[11px] font-bold text-[#4F86D9] flex items-center gap-0.5 cursor-pointer shrink-0"
            >
              <span>Deal Details</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Quick replies */}
      <div className="bg-white dark:bg-slate-900/80 border-b border-[#E0E7F0] dark:border-slate-800 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
        <span className="text-[10px] font-bold text-[#667085] dark:text-slate-400 shrink-0">
          Quick:
        </span>
        {quickReplies.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onSendMessage(wishId, q)}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-[#F7F9FC] dark:bg-slate-800 hover:bg-[#EDF4FF] dark:hover:bg-sky-950/50 hover:text-[#243B64] dark:hover:text-sky-300 text-[#475467] dark:text-slate-300 border border-[#E0E7F0] dark:border-slate-700 transition cursor-pointer whitespace-nowrap"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message thread body */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#F7F9FC]/60 dark:bg-[#0B0F19] text-xs">
        <div className="text-center pb-1">
          <span className="text-[10px] font-medium text-[#667085] dark:text-slate-400">
            Conversation for {title}
          </span>
        </div>

        {isOrder && trackingNumber && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-[11px] font-mono text-emerald-800 dark:text-emerald-300 truncate">
              Tracking: <strong>{trackingNumber}</strong>
            </p>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            <div className="w-8 h-8 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto mb-1.5">
              <MessageSquare className="w-4 h-4" />
            </div>
            <p className="font-bold text-slate-700 dark:text-slate-200 text-xs">Start the conversation</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-[220px] mx-auto">
              Discuss condition, offer price, or arrange delivery for <strong>{title}</strong>.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === currentUser.id;
            const senderUser = allUsers[msg.senderId];
            const hasImages = !!msg.images && msg.images.length > 0;
            const hasText = !!msg.text?.trim();

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-1.5 ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                {!isMine && (
                  <UserAvatar
                    user={senderUser}
                    name={msg.senderName}
                    size="xs"
                    className="w-5 h-5 rounded-full object-cover shrink-0 mt-2"
                  />
                )}
                <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[85%]`}>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                      {isMine ? 'You' : msg.senderName.split(' ')[0]}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">{msg.timestamp}</span>
                  </div>
                  <div
                    className={`rounded-2xl shadow-soft leading-relaxed break-words overflow-hidden ${
                      isMine
                        ? 'bg-[#4F86D9] text-white rounded-tr-xs'
                        : 'bg-white dark:bg-slate-800 border border-[#E0E7F0] dark:border-slate-700 text-[#263244] dark:text-slate-100 rounded-tl-xs'
                    } ${hasImages && !hasText ? 'p-1.5' : 'px-3 py-2 text-xs'}`}
                  >
                    {hasImages && (
                      <div className={`${hasText ? 'mb-2' : ''}`}>
                        {msg.images!.length === 1 ? (
                          <img
                            src={msg.images![0]}
                            alt="Attachment"
                            onClick={() => setLightboxImage(msg.images![0])}
                            className="max-h-56 w-auto max-w-full rounded-xl object-cover cursor-pointer hover:opacity-95 transition"
                            title="Click to view full size"
                          />
                        ) : (
                          <div
                            className={`grid gap-1.5 ${
                              msg.images!.length === 2
                                ? 'grid-cols-2'
                                : msg.images!.length === 3
                                ? 'grid-cols-3'
                                : msg.images!.length === 4
                                ? 'grid-cols-2'
                                : 'grid-cols-3'
                            }`}
                          >
                            {msg.images!.map((imgUrl, imgIdx) => (
                              <img
                                key={imgIdx}
                                src={imgUrl}
                                alt={`Attachment ${imgIdx + 1}`}
                                onClick={() => setLightboxImage(imgUrl)}
                                className="w-full aspect-square rounded-lg object-cover cursor-pointer hover:scale-[1.02] transition"
                                title="Click to view full size"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {hasText && <div className="break-words">{msg.text}</div>}
                  </div>
                </div>
                {isMine && (
                  <UserAvatar
                    user={currentUser}
                    name={currentUser.name}
                    size="xs"
                    className="w-5 h-5 rounded-full object-cover shrink-0 mt-2"
                  />
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image validation error alert banner */}
      {imageError && (
        <div className="mx-2.5 my-1.5 p-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-[11px] flex items-center justify-between gap-1.5 shrink-0 animate-in fade-in">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 dark:text-red-400 shrink-0" />
            <span className="truncate">{imageError}</span>
          </div>
          <button
            type="button"
            onClick={() => setImageError(null)}
            className="text-red-400 hover:text-red-700 dark:hover:text-red-200 text-xs font-bold px-1 cursor-pointer"
            title="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Small thumbnails preview strip before sending */}
      {attachedImages.length > 0 && (
        <div className="px-2.5 pt-2 pb-1 flex items-center gap-2 overflow-x-auto shrink-0 bg-[#F7F9FC] dark:bg-slate-900 border-t border-[#E0E7F0] dark:border-slate-800">
          {attachedImages.map((imgUrl, idx) => (
            <div
              key={idx}
              className="relative group shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-[#E0E7F0] dark:border-slate-700 shadow-soft bg-white dark:bg-slate-800"
            >
              <img
                src={imgUrl}
                alt={`Selected thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#243B64]/85 hover:bg-red-600 text-white flex items-center justify-center transition cursor-pointer shadow-soft"
                title="Remove image"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
          <span className="text-[10px] text-[#667085] dark:text-slate-400 font-medium shrink-0 ml-1">
            {attachedImages.length}/5
          </span>
        </div>
      )}

      {/* Message input */}
      <form onSubmit={handleSend} className="p-2.5 bg-white dark:bg-[#111827] border-t border-[#E0E7F0] dark:border-slate-800 flex items-center gap-1.5 shrink-0">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={attachedImages.length >= 5}
          className={`p-2 rounded-xl border border-[#E0E7F0] dark:border-slate-700 text-[#667085] dark:text-slate-400 hover:text-[#4F86D9] hover:border-[#4F86D9] hover:bg-[#EDF4FF]/50 dark:hover:bg-slate-800 transition cursor-pointer shrink-0 shadow-soft ${
            attachedImages.length >= 5 ? 'opacity-40 cursor-not-allowed' : ''
          }`}
          title={attachedImages.length >= 5 ? 'Maximum 5 images attached' : 'Attach images (JPG, PNG, WebP - max 5MB)'}
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message ${otherPartyName.split(' ')[0]}...`}
          className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#E0E7F0] dark:border-slate-700 focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/15 outline-none text-[#263244] dark:text-slate-100 bg-white dark:bg-slate-900 placeholder:text-[#667085] dark:placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim() && attachedImages.length === 0}
          className="p-2 rounded-xl bg-[#4F86D9] hover:bg-[#3568B5] disabled:opacity-40 disabled:hover:bg-[#4F86D9] text-white transition cursor-pointer shrink-0 shadow-soft"
          title="Send message"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Lightbox full-size view modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs select-none animate-in fade-in duration-150"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-slate-800/90 text-white hover:bg-slate-700 transition cursor-pointer shadow-lg"
              title="Close full-size view (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage}
              alt="Full size view"
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
