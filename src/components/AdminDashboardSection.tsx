import React, { useState } from 'react';
import { Wish, User, WarningRecord } from '../types';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Trash2, 
  Edit3, UserX, CheckCircle2, Search, Filter, 
  Eye, FileText, ArrowUpRight, MessageSquare 
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { formatBaht } from '../utils/currency';

interface AdminDashboardSectionProps {
  wishes: Wish[];
  users: Record<string, User>;
  warnings: WarningRecord[];
  onOpenEditWish: (wish: Wish) => void;
  onOpenWarningModal: (targetWish?: Wish, targetUser?: { id: string; name: string }) => void;
  onDeleteWish: (wishId: string) => void;
  onToggleFlagWish: (wishId: string) => void;
  onRevokeWarning: (warningId: string) => void;
  onViewFeed: () => void;
  onSelectWish?: (wish: Wish) => void;
}

export const AdminDashboardSection: React.FC<AdminDashboardSectionProps> = ({
  wishes,
  users,
  warnings,
  onOpenEditWish,
  onOpenWarningModal,
  onDeleteWish,
  onToggleFlagWish,
  onRevokeWarning,
  onViewFeed,
  onSelectWish,
}) => {
  const [tab, setTab] = useState<'warnings' | 'listings' | 'users'>('warnings');
  const [searchQuery, setSearchQuery] = useState('');

  const flaggedWishesCount = wishes.filter((w) => w.isFlagged).length;
  const totalWarningsCount = warnings.length;

  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#EAECF0] dark:border-slate-800 shadow-soft p-5 sm:p-6 transition-all space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold shadow-xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Admin Moderation & Safety Center
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 uppercase">
                Admin Console
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Enforce community guidelines, issue formal warnings to buyers, and moderate item listings.
            </p>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-xs">
            <span className="text-amber-800 dark:text-amber-300 font-bold">{totalWarningsCount}</span>{' '}
            <span className="text-amber-700 dark:text-amber-400">Warnings Issued</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 text-xs">
            <span className="text-purple-800 dark:text-purple-300 font-bold">{wishes.length}</span>{' '}
            <span className="text-purple-700 dark:text-purple-400">Live Listings</span>
          </div>
          {flaggedWishesCount > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-800/50 text-xs">
              <span className="text-red-800 dark:text-rose-300 font-bold">{flaggedWishesCount}</span>{' '}
              <span className="text-red-700 dark:text-rose-400">Flagged</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
          <button
            onClick={() => setTab('warnings')}
            className={`px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              tab === 'warnings'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Warnings ({warnings.length})</span>
          </button>

          <button
            onClick={() => setTab('listings')}
            className={`px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              tab === 'listings'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Listings ({wishes.length})</span>
          </button>

          <button
            onClick={() => setTab('users')}
            className={`px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              tab === 'users'
                ? 'bg-[#5B4BEE] text-white shadow-soft'
                : 'bg-[#F7F8FC] dark:bg-slate-800 text-[#667085] dark:text-slate-300 hover:bg-[#EAECF0] dark:hover:bg-slate-700'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Users</span>
          </button>
        </div>

        {/* Global Issue Warning Button */}
        <button
          onClick={() => onOpenWarningModal()}
          className="w-full sm:w-auto justify-center px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>+ Issue Warning</span>
        </button>
      </div>

      {/* TAB 1: WARNINGS LOG */}
      {tab === 'warnings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>All warnings issued to buyers and users for community safety.</span>
          </div>

          {warnings.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-700 dark:text-slate-200">No active warnings</p>
              <p className="text-slate-400 mt-0.5">The marketplace is compliant with community guidelines.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {warnings.map((warn) => {
                const badgeColor = 
                  warn.severity === 'FINAL_WARNING'
                    ? 'bg-red-100 dark:bg-rose-950/60 text-red-800 dark:text-rose-300 border-red-200 dark:border-rose-800/50'
                    : warn.severity === 'POLICY_WARNING'
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                    : 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800/50';

                return (
                  <div
                    key={warn.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-amber-200 dark:hover:border-amber-700/60 transition space-y-2.5 shadow-2xs"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {warn.targetUserName}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${badgeColor}`}>
                          {warn.severity.replace('_', ' ')}
                        </span>
                        {warn.targetWishTitle && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                            Wish: {warn.targetWishTitle}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {warn.issuedAt} by {warn.issuedBy}
                        </span>
                        <button
                          onClick={() => onRevokeWarning(warn.id)}
                          className="text-[11px] font-bold text-slate-500 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 px-2 py-0.8 rounded transition cursor-pointer"
                          title="Revoke / Clear warning"
                        >
                          Resolve / Clear
                        </button>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Reason: <span className="font-normal text-slate-700 dark:text-slate-300">{warn.reason}</span>
                    </p>

                    {warn.details && (
                      <p className="text-xs text-slate-500 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                        {warn.details}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LISTINGS MODERATION */}
      {tab === 'listings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Directly edit listings, remove non-compliant items, or issue buyer warnings.</span>
            <button
              onClick={onViewFeed}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View Public Feed</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {wishes.map((wish) => (
              <div
                key={wish.id}
                className={`p-4 rounded-xl border transition space-y-3 bg-white dark:bg-slate-800/80 ${
                  wish.isFlagged
                    ? 'border-red-300 dark:border-rose-800/60 bg-red-50/20 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    {(wish.images?.[0] || wish.imageUrl) ? (
                      <img
                        src={wish.images?.[0] || wish.imageUrl}
                        alt={wish.title}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 font-bold text-xs shrink-0">
                        No Img
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{wish.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 font-semibold text-slate-600 dark:text-slate-300">
                          {wish.category}
                        </span>
                        {wish.isFlagged && (
                          <span className="text-[10px] bg-red-100 dark:bg-rose-950/60 text-red-800 dark:text-rose-300 font-bold px-1.5 py-0.5 rounded">
                            Flagged
                          </span>
                        )}
                        {wish.images && wish.images.length > 1 && (
                          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold px-1.5 py-0.5 rounded">
                            {wish.images.length} photos
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span>Buyer: <strong className="text-slate-800 dark:text-slate-200">{wish.buyerName}</strong></span>
                        <span>•</span>
                        <span>Budget: <strong className="text-emerald-700 dark:text-emerald-400">{formatBaht(wish.budget)}</strong></span>
                        <span>•</span>
                        <span>{wish.offersCount} offers</span>
                      </div>
                    </div>
                  </div>

                  {/* Admin Actions */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* View Details Page */}
                    {onSelectWish && (
                      <button
                        onClick={() => onSelectWish(wish)}
                        className="px-2.5 py-1.5 text-xs font-bold text-[#243B64] dark:text-sky-300 bg-[#EDF4FF] dark:bg-[#4F86D9]/15 hover:bg-[#D9E8FF] dark:hover:bg-[#4F86D9]/25 border border-[#4F86D9]/30 rounded-xl transition cursor-pointer flex items-center gap-1"
                        title="View listing detail page"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#4F86D9]" />
                        <span>View Page</span>
                      </button>
                    )}

                    {/* Warning button */}
                    <button
                      onClick={() => onOpenWarningModal(wish)}
                      className="px-2.5 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200/80 dark:border-amber-800/50 rounded-xl transition cursor-pointer flex items-center gap-1"
                      title="Issue Warning to this Buyer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Warn Buyer</span>
                    </button>

                    {/* Edit Listing */}
                    <button
                      onClick={() => onOpenEditWish(wish)}
                      className="px-2.5 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/80 dark:border-indigo-800/50 rounded-xl transition cursor-pointer flex items-center gap-1"
                      title="Edit this listing"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Edit Listing</span>
                    </button>

                    {/* Flag Toggle */}
                    <button
                      onClick={() => onToggleFlagWish(wish.id)}
                      className={`px-2.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 ${
                        wish.isFlagged
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                      }`}
                      title={wish.isFlagged ? 'Remove flag' : 'Flag listing'}
                    >
                      <span>{wish.isFlagged ? 'Flagged' : 'Flag'}</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                  {wish.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: USER STANDINGS */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Marketplace participants and safety standing.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {Object.values(users).map((u) => {
              const userWarningsCount = warnings.filter((w) => w.targetUserId === u.id).length;
              const hasWarnings = userWarningsCount > 0;

              return (
                <div
                  key={u.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      user={u}
                      size="lg"
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{u.name}</span>
                        {u.isAdmin && (
                          <span className="text-[9px] bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-bold px-1.5 py-0.2 rounded uppercase">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{u.email}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px]">
                        {u.isAdmin ? (
                          <span className="text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/50 px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-800/50">
                            Staff Console
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">★ {u.rating.toFixed(1)}</span>
                        )}
                        <span className="text-slate-400">•</span>
                        {hasWarnings ? (
                          <span className="text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800/50">
                            ⚠️ {userWarningsCount} Warning(s)
                          </span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded">
                            Clean Standing
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!u.isAdmin && (
                    <button
                      onClick={() => onOpenWarningModal(undefined, { id: u.id, name: u.name })}
                      className="px-2.5 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800/50 rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Warn</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
