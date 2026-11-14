import React, { useState, useEffect, useRef } from 'react';
import { Wish, User, ChatMessage, ChatTarget } from '../types';
import { X, Send, MessageSquare, Package, CheckCheck, ArrowRightLeft, ShieldCheck, Tag } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { formatBaht } from '../utils/currency';

interface ChatModalProps {
  chatTarget: ChatTarget | Wish | null;
  currentUser: User;
  onClose: () => void;
  onBackToAllChats?: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string, senderOverride?: User) => void;
  allUsers: Record<string, User>;
  onSwitchUser: (user: User) => void;
  onViewUserProfile?: (userId: string, userFallback?: { id: string; name: string; avatar?: string }) => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  chatTarget,
  currentUser,
  onClose,
  onBackToAllChats,
  messages,
  onSendMessage,
  allUsers,
  onSwitchUser,
  onViewUserProfile,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!chatTarget || currentUser.isAdmin) return null;

  // Normalize target information
  const wishId = 'wishId' in chatTarget ? chatTarget.wishId : (chatTarget as Wish).id;
  const title = chatTarget.title;
  const buyerId = chatTarget.buyerId;
  const buyerName = chatTarget.buyerName || 'Buyer';
  const sellerId = 'sellerId' in chatTarget ? chatTarget.sellerId : undefined;
  const sellerName = 'sellerName' in chatTarget ? chatTarget.sellerName : undefined;
  const agreedPrice = 'agreedPrice' in chatTarget ? chatTarget.agreedPrice : undefined;
  const budget = 'budget' in chatTarget ? chatTarget.budget : (chatTarget as any).targetBudget;
  const isOrder = 'isOrder' in chatTarget ? !!chatTarget.isOrder : !!agreedPrice;
  const orderId = 'orderId' in chatTarget ? chatTarget.orderId : undefined;
  const trackingNumber = 'trackingNumber' in chatTarget ? chatTarget.trackingNumber : undefined;

  // Determine other participant
  const isCurrentUserBuyer = currentUser.id === buyerId;
  const otherPartyName = isCurrentUserBuyer
    ? (sellerName || 'Seller')
    : buyerName;
  const otherPartyRole = isCurrentUserBuyer ? 'Seller' : 'Buyer';

  // Find candidate for quick user switcher (e.g. switch between Sarah and Alex)
  const otherUserId = isCurrentUserBuyer ? (sellerId || 'user-alex') : (buyerId || 'user-sarah');
  const otherUserObj = allUsers[otherUserId];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const quickReplies = isOrder
    ? [
        'Thanks for accepting! When will you ship?',
        'Package is being prepped with secure bubble wrap.',
        'Tracking updated! Dropping off at the carrier today.',
        'Package arrived safely and works great! Leaving 5 stars.',
      ]
    : [
        'Is this item still needed?',
        'What condition are you looking for?',
        'I have this available and can ship immediately!',
        'Can negotiate price or include accessories.',
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#111827] text-[#263244] dark:text-slate-100 w-full max-w-lg rounded-2xl shadow-2xl border border-[#E0E7F0] dark:border-slate-800 overflow-hidden flex flex-col h-[580px] max-h-[92vh]">
        {/* Chat Header */}
        <div className="p-4 bg-[#243B64] dark:bg-slate-900 text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            {onBackToAllChats && (
              <button
                type="button"
                onClick={onBackToAllChats}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition cursor-pointer text-xs font-bold flex items-center gap-1 shrink-0"
                title="Back to all chats"
              >
                <span>← All Chats</span>
              </button>
            )}
            <UserAvatar
              user={otherUserObj}
              name={otherPartyName}
              size="lg"
              className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-xs ring-1 ring-white/20"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold truncate max-w-[210px] sm:max-w-[260px] text-white">
                  {title}
                </h3>
                {isOrder ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                    Order Active
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#4F86D9]/25 text-sky-200 border border-[#4F86D9]/40 whitespace-nowrap">
                    Chat
                  </span>
                )}
              </div>

              {/* Subtitle with order details or budget */}
              <div className="text-xs text-slate-300 flex flex-wrap items-center gap-2 mt-0.5">
                <span>
                  Chatting with{' '}
                  <button
                    type="button"
                    onClick={() => {
                      if (onViewUserProfile && otherUserId) {
                        onClose();
                        onViewUserProfile(otherUserId, {
                          id: otherUserId,
                          name: otherPartyName,
                          avatar: otherUserObj?.avatar,
                        });
                      }
                    }}
                    className="text-white font-bold hover:text-sky-300 hover:underline cursor-pointer"
                    title={`View ${otherPartyName}'s profile, wishlist & reviews`}
                  >
                    {otherPartyName}
                  </button>{' '}
                  ({otherPartyRole})
                </span>
                {agreedPrice !== undefined ? (
                  <>
                    <span>•</span>
                    <span>Agreed: <strong className="text-emerald-400 font-mono">{formatBaht(agreedPrice)}</strong></span>
                  </>
                ) : budget !== undefined ? (
                  <>
                    <span>•</span>
                    <span>Budget: <strong className="text-emerald-400 font-mono">{formatBaht(budget)}</strong></span>
                  </>
                ) : null}
              </div>

              {trackingNumber && (
                <div className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                  <Package className="w-3 h-3 text-emerald-400" />
                  <span className="font-mono">{trackingNumber}</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Identity Switcher Bar (Useful for testing buyer-seller conversation) */}
        {otherUserObj && (
          <div className="bg-slate-800/90 text-slate-300 px-3.5 py-1.5 flex items-center justify-between text-[11px] border-b border-slate-700">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-slate-400">Replying as:</span>
              <strong className="text-white">{currentUser.name}</strong>
              <span className="text-[10px] text-slate-400">({currentUser.isAdmin ? 'Admin' : isCurrentUserBuyer ? 'Buyer' : 'Seller'})</span>
            </div>
            <button
              type="button"
              onClick={() => onSwitchUser(otherUserObj)}
              className="px-2 py-0.5 rounded bg-[#4F86D9] hover:bg-[#3568B5] text-white font-semibold text-[10px] flex items-center gap-1 transition cursor-pointer shrink-0"
              title={`Switch identity to ${otherUserObj.name} to simulate reply`}
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>Switch to {otherUserObj.name.split(' ')[0]}</span>
            </button>
          </div>
        )}

        {/* Quick Message Suggestions */}
        <div className="bg-[#F7F9FC] dark:bg-slate-800/50 border-b border-[#E0E7F0] dark:border-slate-800 px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-semibold text-[#5B6B82] dark:text-slate-400 whitespace-nowrap">Quick Reply:</span>
          {quickReplies.map((q) => (
            <button
              key={q}
              onClick={() => onSendMessage(q)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-[#EDF4FF] dark:hover:bg-slate-800 hover:text-[#3568B5] dark:hover:text-sky-300 text-[#263244] dark:text-slate-200 border border-[#E0E7F0] dark:border-slate-700 transition cursor-pointer whitespace-nowrap shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F7F9FC] dark:bg-[#0B0F19]">
          {isOrder && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
              <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950 dark:text-emerald-100">
                  Order In Progress {orderId ? `(#${orderId})` : ''}
                </p>
                <p className="text-emerald-800 dark:text-emerald-300 text-[11px] mt-0.5">
                  The offer has been accepted! You and the seller can use this direct chat to confirm shipping address, tracking, or handoff.
                </p>
              </div>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="text-center py-12 text-[#5B6B82] dark:text-slate-400 text-xs">
              <div className="w-10 h-10 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="font-semibold text-[#263244] dark:text-white">No messages in this conversation yet</p>
              <p className="mt-1 max-w-xs mx-auto text-[#5B6B82] dark:text-slate-400">
                {isOrder
                  ? 'Send a message to discuss shipping, packaging condition, or tracking.'
                  : 'Send a message to ask about specifications, condition, or shipping.'}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUser.id;
              const senderUser = allUsers[msg.senderId];

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMine && (
                    <UserAvatar
                      user={senderUser}
                      name={msg.senderName}
                      size="xs"
                      className="w-6 h-6 rounded-full object-cover shrink-0 mt-3"
                    />
                  )}
                  <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] text-[#5B6B82] dark:text-slate-400 font-medium">
                        {isMine ? 'You' : msg.senderName}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{msg.timestamp}</span>
                    </div>
                    <div
                      className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs ${
                        isMine
                          ? 'bg-[#4F86D9] text-white rounded-tr-xs'
                          : 'bg-white dark:bg-[#111827] border border-[#E0E7F0] dark:border-slate-800 text-[#263244] dark:text-slate-100 rounded-tl-xs'
                      }`}
                    >
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                  {isMine && (
                    <UserAvatar
                      user={currentUser}
                      name={currentUser.name}
                      size="xs"
                      className="w-6 h-6 rounded-full object-cover shrink-0 mt-3"
                    />
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white dark:bg-[#111827] border-t border-[#E0E7F0] dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isOrder
                ? `Message ${otherPartyName} about order #${orderId || ''}...`
                : `Type a message to ${otherPartyName}...`
            }
            className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E0E7F0] dark:border-slate-700 bg-white dark:bg-[#0B0F19] focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 outline-none text-[#263244] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          <button
            type="submit"
            className="p-2.5 rounded-xl bg-[#4F86D9] hover:bg-[#3568B5] active:bg-[#243B64] text-white transition cursor-pointer shrink-0 shadow-xs"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
