import React, { useState } from 'react';
import { ChatTarget, User } from '../types';
import { MessageSquare, Search, X, Package, ArrowRight, Inbox, Clock, User as UserIcon } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { formatBaht } from '../utils/currency';

interface ChatsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ChatTarget[];
  currentUser: User | null;
  allUsers?: Record<string, User>;
  onSelectChat: (target: ChatTarget) => void;
}

export const ChatsListModal: React.FC<ChatsListModalProps> = ({
  isOpen,
  onClose,
  conversations,
  currentUser,
  allUsers,
  onSelectChat,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen || currentUser?.isAdmin) return null;

  const filteredConversations = conversations
    .filter((conv) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const otherPartyName = currentUser?.id === conv.buyerId 
        ? (conv.sellerName || 'Seller') 
        : (conv.buyerName || 'Buyer');
      return (
        conv.title.toLowerCase().includes(term) ||
        otherPartyName.toLowerCase().includes(term) ||
        (conv.lastMessage && conv.lastMessage.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => {
      if (Boolean(a.hasUnread) !== Boolean(b.hasUnread)) {
        return a.hasUnread ? -1 : 1;
      }
      return (b.lastMessageCreatedAt || 0) - (a.lastMessageCreatedAt || 0);
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#111827] w-full max-w-lg rounded-2xl shadow-card-hover border border-[#EAECF0] dark:border-slate-800 overflow-hidden flex flex-col h-[580px] max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-[#172033] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4F86D9] flex items-center justify-center text-white font-bold shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Messages & Deals</h3>
                <span className="text-xs text-slate-300 font-medium tabular-nums">
                  ({conversations.length})
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Each thread is anchored to its product wish & active offer
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-[#F7F9FC] dark:bg-slate-800/80 border-b border-[#E0E7F0] dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#667085] dark:text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search chats by product, offer, or person..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-slate-900 border border-[#E0E7F0] dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/15 text-[#172033] dark:text-slate-100 placeholder:text-[#667085] dark:placeholder:text-slate-500 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Chat List Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#F7F9FC] dark:bg-[#0B0F19]">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EDF4FF] dark:bg-[#4F86D9]/15 text-[#4F86D9] flex items-center justify-center mx-auto border border-[#4F86D9]/20">
                <Inbox className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#172033] dark:text-slate-100">
                  {searchTerm ? 'No matching chats found' : 'No active chats yet'}
                </p>
                <p className="text-xs text-[#667085] dark:text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                  {searchTerm
                    ? 'Try searching with another keyword or username.'
                    : 'Click "Chat" on any wish or offer to start talking directly with buyers and sellers.'}
                </p>
              </div>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isCurrentUserBuyer = currentUser?.id === conv.buyerId;
              const otherPartyName = isCurrentUserBuyer
                ? (conv.sellerName || 'Seller')
                : (conv.buyerName || 'Buyer');
              const isUnread = !!conv.hasUnread;

              return (
                <div
                  key={conv.wishId}
                  onClick={() => {
                    onClose();
                    onSelectChat(conv);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex items-start justify-between gap-3 relative ${
                    isUnread
                      ? 'bg-[#EDF4FF]/80 dark:bg-[#162238] border-[#4F86D9]/45 hover:shadow-card-hover'
                      : 'bg-white dark:bg-[#111827] border-[#E0E7F0] dark:border-slate-800 hover:border-[#4F86D9]/45 hover:shadow-card-hover'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {(() => {
                      const otherUserId = currentUser?.id === conv.buyerId ? conv.sellerId : conv.buyerId;
                      const otherUser = otherUserId && allUsers ? allUsers[otherUserId] : null;
                      return (
                        <div className="relative shrink-0">
                          {conv.wishImage ? (
                            <img
                              src={conv.wishImage}
                              alt={conv.title}
                              referrerPolicy="no-referrer"
                              className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#E0E7F0] dark:border-slate-700"
                            />
                          ) : (
                            <UserAvatar
                              user={otherUser}
                              name={otherPartyName}
                              size="lg"
                              className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#E0E7F0] dark:border-slate-700"
                            />
                          )}
                          {isUnread && (
                            <span
                              className="absolute -top-1 -right-1 w-3 h-3 bg-[#4F86D9] rounded-full ring-2 ring-white dark:ring-[#111827]"
                              title="Unread message"
                            />
                          )}
                        </div>
                      );
                    })()}

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#667085] dark:text-slate-400">
                        <span className={`font-bold ${
                          conv.isOrder
                            ? 'text-[#287A55] dark:text-emerald-400'
                            : conv.offerPrice !== undefined
                            ? 'text-[#4F86D9] dark:text-sky-400'
                            : 'text-[#243B64] dark:text-slate-300'
                        }`}>
                          {conv.isOrder ? `Order #${conv.orderId || ''}` : conv.offerPrice !== undefined ? 'Offer Thread' : 'Wish Inquiry'}
                        </span>
                        {conv.category && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{conv.category}</span>
                          </>
                        )}
                        {isUnread && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-bold text-[#4F86D9]">Unread</span>
                          </>
                        )}
                      </div>

                      <h4 className={`text-[13px] truncate transition ${
                        isUnread ? 'font-bold text-[#172033] dark:text-slate-100' : 'font-bold text-[#172033] dark:text-slate-200 group-hover:text-[#4F86D9] dark:group-hover:text-sky-400'
                      }`}>
                        {conv.title}
                      </h4>

                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-[#667085] dark:text-slate-400 tabular-nums">
                        <span>With <strong className="text-[#172033] dark:text-slate-200">{otherPartyName}</strong></span>
                        {conv.budget !== undefined && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Budget <strong className="font-mono text-[#263244] dark:text-slate-200">{formatBaht(conv.budget)}</strong></span>
                          </>
                        )}
                        {(conv.agreedPrice !== undefined || conv.offerPrice !== undefined) && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#287A55] dark:text-emerald-400 font-mono font-bold">
                              {conv.isOrder ? 'Agreed' : 'Offer'} {formatBaht((conv.agreedPrice ?? conv.offerPrice) || 0)}
                            </span>
                          </>
                        )}
                      </div>

                      {conv.lastMessage && (
                        <p className={`text-[11px] truncate pt-0.5 ${
                          isUnread
                            ? 'text-[#172033] dark:text-slate-100 font-semibold'
                            : 'text-[#667085] dark:text-slate-400'
                        }`}>
                          {conv.lastMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end justify-between self-stretch">
                    {conv.lastTimestamp && (
                      <span className="text-[10px] text-[#667085] dark:text-slate-400">
                        {conv.lastTimestamp}
                      </span>
                    )}
                    <span className="text-[11px] text-[#4F86D9] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 mt-2">
                      <span>Open</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
