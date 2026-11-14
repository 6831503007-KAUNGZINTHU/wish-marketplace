import React, { useState } from 'react';
import { Offer } from '../types';
import { AlertTriangle, Trash2, X, ShieldAlert, Tag, User as UserIcon, DollarSign } from 'lucide-react';
import { formatBaht } from '../utils/currency';

interface AdminRemoveOfferModalProps {
  isOpen: boolean;
  offer: Offer | null;
  onClose: () => void;
  onConfirmRemoval: (offerId: string, reason?: string) => Promise<void> | void;
}

export const AdminRemoveOfferModal: React.FC<AdminRemoveOfferModalProps> = ({
  isOpen,
  offer,
  onClose,
  onConfirmRemoval,
}) => {
  const [reason, setReason] = useState('Prohibited item or policy non-compliance');
  const [customReason, setCustomReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !offer) return null;

  const defaultReasons = [
    'Prohibited item or policy non-compliance',
    'Unrealistic pricing / troll offer',
    'Solicitation of off-platform transactions',
    'Duplicate or spam proposal',
    'Counterfeit, replica, or fraudulent item report',
  ];

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    setErrorMsg(null);
    setIsProcessing(true);

    try {
      const finalReason = customReason.trim() || reason;
      await onConfirmRemoval(offer.id, finalReason);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to remove offer. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white dark:bg-[#111827] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 dark:border-rose-900/60 space-y-5 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-offer-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#E0E7F0] dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 id="remove-offer-title" className="text-base font-bold text-[#263244] dark:text-slate-100">
                Remove this offer?
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400 mt-0.5">
                Moderator action will remove this proposal from active marketplace feeds.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-[#667085] dark:text-slate-400 hover:text-[#263244] dark:hover:text-slate-100 hover:bg-[#F7F9FC] dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description Warning */}
        <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
          Are you sure you want to remove this offer from WishMarket? This action will remove it from the active marketplace and prevent the buyer from accepting it.
        </p>

        {/* Relevant Offer Information Card */}
        <div className="p-4 rounded-xl bg-[#F7F9FC] dark:bg-slate-800/70 border border-[#E0E7F0] dark:border-slate-700 space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E0E7F0] dark:border-slate-700">
            <span className="font-semibold text-[#667085] dark:text-slate-400 uppercase tracking-wider text-[10px]">
              Offer Details ({offer.id})
            </span>
            <span className="font-mono text-[10px] text-[#667085] dark:text-slate-400">
              Category: <strong className="text-[#263244] dark:text-slate-200">{offer.category}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[11px] text-[#667085] dark:text-slate-400 block">Listing / Item Title</span>
              <span className="font-bold text-[#263244] dark:text-slate-100 line-clamp-1 block" title={offer.wishTitle}>
                {offer.wishTitle}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-[#667085] dark:text-slate-400 block">Seller Name</span>
              <span className="font-bold text-[#263244] dark:text-slate-100 block">
                {offer.sellerName} (★ {offer.sellerRating.toFixed(1)})
              </span>
            </div>

            <div>
              <span className="text-[11px] text-[#667085] dark:text-slate-400 block">Target Budget</span>
              <span className="font-mono font-semibold text-[#667085] dark:text-slate-300 block">
                {formatBaht(offer.targetBudget)}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-[#667085] dark:text-slate-400 block">Offer Price</span>
              <span className="font-mono font-extrabold text-[#287A55] dark:text-emerald-400 text-sm block">
                {formatBaht(offer.offeredPrice)}
              </span>
            </div>
          </div>

          {offer.details && (
            <div className="pt-2 border-t border-[#E0E7F0] dark:border-slate-700 text-[11px] text-[#667085] dark:text-slate-400">
              <span className="font-semibold text-[#263244] dark:text-slate-200">Proposal Note: </span>
              <span className="italic">"{offer.details}"</span>
            </div>
          )}
        </div>

        {/* Optional Removal Reason */}
        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#263244] dark:text-slate-200">
              Moderation Reason for Record
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isProcessing}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#E0E7F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#263244] dark:text-slate-100 focus:outline-none focus:border-[#4F86D9] font-medium"
            >
              {defaultReasons.map((r, idx) => (
                <option key={idx} value={r}>
                  {r}
                </option>
              ))}
              <option value="other">Other reason...</option>
            </select>

            {reason === 'other' && (
              <input
                type="text"
                required
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Specify reason for audit logs..."
                disabled={isProcessing}
                className="w-full mt-2 px-3 py-2 text-xs rounded-xl border border-[#E0E7F0] dark:border-slate-700 focus:border-[#4F86D9] text-[#263244] dark:text-slate-100 bg-white dark:bg-slate-900"
              />
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E0E7F0] dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 text-xs font-semibold text-[#667085] dark:text-slate-300 hover:text-[#263244] dark:hover:text-slate-100 bg-[#F7F9FC] dark:bg-slate-800 hover:bg-[#E0E7F0] dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-soft hover:shadow-card-hover transition cursor-pointer flex items-center gap-1.5"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Removing...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Removal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
