import React, { useState, useEffect } from 'react';
import { Offer } from '../types';
import { X, Check, AlertTriangle, Tag, DollarSign, FileText, Sparkles } from 'lucide-react';
import { formatBaht } from '../utils/currency';

interface EditOfferModalProps {
  offer: Offer | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedOffer: Offer) => void;
}

export const EditOfferModal: React.FC<EditOfferModalProps> = ({
  offer,
  isOpen,
  onClose,
  onSave,
}) => {
  const [offeredPrice, setOfferedPrice] = useState('');
  const [details, setDetails] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (offer) {
      setOfferedPrice(offer.offeredPrice.toString());
      setDetails(offer.details || '');
      setErrorMsg('');
    }
  }, [offer, isOpen]);

  if (!isOpen || !offer) return null;

  const parsedPrice = parseFloat(offeredPrice);
  const isValidPrice = !isNaN(parsedPrice) && parsedPrice > 0;
  const priceDiff = isValidPrice ? offer.targetBudget - parsedPrice : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPrice) {
      setErrorMsg('Please enter a valid offer price greater than ฿0.');
      return;
    }

    const updatedOffer: Offer = {
      ...offer,
      offeredPrice: parsedPrice,
      details: details.trim() || offer.details,
    };

    onSave(updatedOffer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white dark:bg-[#111827] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-card-hover border border-[#E0E7F0] dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-offer-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-[#E0E7F0] dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 id="edit-offer-modal-title" className="text-base sm:text-lg font-extrabold text-[#263244] dark:text-slate-100">
                Edit Your Offer
              </h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-[#EDF4FF] dark:bg-[#4F86D9]/20 text-[#243B64] dark:text-sky-300 font-bold border border-[#4F86D9]/25">
                {offer.id}
              </span>
            </div>
            <p className="text-xs text-[#667085] dark:text-slate-400 mt-0.5">
              Update your proposed price or condition notes for this buyer request.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#667085] dark:text-slate-400 hover:text-[#263244] dark:hover:text-white hover:bg-[#F7F9FC] dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Wish Summary */}
        <div className="p-3.5 rounded-xl bg-[#F7F9FC] dark:bg-slate-800/60 border border-[#E0E7F0] dark:border-slate-700 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4F86D9] flex items-center gap-1">
              <Tag className="w-3 h-3" />
              <span>{offer.category}</span>
            </span>
            <span className="text-[11px] text-[#667085] dark:text-slate-400">
              Buyer: <strong className="text-[#263244] dark:text-slate-200">{offer.buyerName}</strong>
            </span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-[#263244] dark:text-slate-100">
            {offer.wishTitle}
          </p>
          <p className="text-xs text-[#667085] dark:text-slate-400">
            Buyer's Target Budget:{' '}
            <strong className="font-mono text-[#287A55] dark:text-emerald-400">
              {formatBaht(offer.targetBudget)}
            </strong>
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Offered Price */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#263244] dark:text-slate-200">
              Your Offer Price (฿ THB) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#667085] dark:text-slate-400">
                ฿
              </span>
              <input
                type="text"
                inputMode="decimal"
                required
                value={offeredPrice}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                    setOfferedPrice(val);
                    if (errorMsg) setErrorMsg('');
                  }
                }}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 text-sm font-mono font-bold rounded-xl border border-[#E0E7F0] dark:border-slate-700 focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 outline-none text-[#263244] dark:text-white bg-white dark:bg-[#0B0F19]"
              />
            </div>
            {isValidPrice && (
              <p className="text-[11px] font-medium flex items-center gap-1">
                {priceDiff >= 0 ? (
                  <span className="text-[#287A55] dark:text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {priceDiff === 0
                      ? 'Matches the buyer target budget exactly'
                      : `${formatBaht(priceDiff)} under buyer target budget`}
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">
                    {formatBaht(Math.abs(priceDiff))} above buyer target budget
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Condition & Details */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#263244] dark:text-slate-200">
              Condition & Inclusions Note
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe item condition, included accessories, warranty, or delivery timeframe..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E0E7F0] dark:border-slate-700 focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 outline-none text-[#263244] dark:text-white bg-white dark:bg-[#0B0F19] resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-[#E0E7F0] dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#667085] dark:text-slate-300 hover:text-[#263244] dark:hover:text-white bg-[#F7F9FC] dark:bg-slate-800 hover:bg-[#E0E7F0] dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#4F86D9] hover:bg-[#3568B5] rounded-xl shadow-soft transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save Offer Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
