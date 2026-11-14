import React from 'react';
import { Offer } from '../types';
import { AlertTriangle, X, RotateCcw } from 'lucide-react';
import { formatBaht } from '../utils/currency';

interface DeclineOfferModalProps {
  isOpen: boolean;
  offer: Offer | null;
  onClose: () => void;
  onConfirmDecline: (offerId: string) => void;
}

export const DeclineOfferModal: React.FC<DeclineOfferModalProps> = ({
  isOpen,
  offer,
  onClose,
  onConfirmDecline,
}) => {
  if (!isOpen || !offer) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#111827] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[#EAECF0] dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="decline-offer-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1 min-w-0">
              <h3 id="decline-offer-title" className="text-base font-bold text-[#172033] dark:text-slate-100">
                Are you sure you want to decline this offer?
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
                You are about to decline <strong className="text-[#172033] dark:text-slate-200">{offer.sellerName}</strong>'s offer of{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatBaht(offer.offeredPrice)}</strong> for{' '}
                <strong className="text-[#172033] dark:text-slate-200">"{offer.wishTitle}"</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
          <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            Changed your mind later? You can click <strong>"Cancel Decline"</strong> on any declined offer to restore it and buy again.
          </span>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAECF0] dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#667085] dark:text-slate-300 hover:text-[#172033] dark:hover:text-slate-100 bg-[#F7F8FC] dark:bg-slate-800 hover:bg-[#EAECF0] dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            No, Keep Offer
          </button>
          <button
            type="button"
            onClick={() => onConfirmDecline(offer.id)}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-soft transition cursor-pointer flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            <span>Yes, Decline Offer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
