import React from 'react';
import { WarningRecord } from '../types';
import { ShieldAlert, AlertTriangle, Info, X, Calendar, Tag, ExternalLink, CheckCircle2, Shield } from 'lucide-react';

interface BuyerWarningDetailModalProps {
  isOpen: boolean;
  warning: WarningRecord | null;
  onClose: () => void;
  onAcknowledge?: (warningId: string) => void;
  onViewWish?: (wishId: string) => void;
}

export const BuyerWarningDetailModal: React.FC<BuyerWarningDetailModalProps> = ({
  isOpen,
  warning,
  onClose,
  onAcknowledge,
  onViewWish,
}) => {
  if (!isOpen || !warning) return null;

  const isFinal = warning.severity === 'FINAL_WARNING';
  const isWarning = warning.severity === 'POLICY_WARNING';
  const isNotice = warning.severity === 'NOTICE';

  // Severity styling configuration
  const theme = isFinal
    ? {
        bg: 'bg-rose-50/70 dark:bg-rose-950/40',
        border: 'border-rose-200 dark:border-rose-800/60',
        badgeBg: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700',
        titleColor: 'text-rose-900 dark:text-rose-200',
        iconBg: 'bg-rose-600 text-white',
        label: 'Final Notice',
        summary: 'Urgent moderation notice. Continued infractions will result in marketplace account restriction.',
        IconComponent: ShieldAlert,
      }
    : isWarning
    ? {
        bg: 'bg-amber-50/70 dark:bg-amber-950/40',
        border: 'border-amber-200 dark:border-amber-800/60',
        badgeBg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700',
        titleColor: 'text-amber-900 dark:text-amber-200',
        iconBg: 'bg-amber-500 text-white',
        label: 'Policy Warning',
        summary: 'Official warning regarding marketplace guidelines. Please review trading policies.',
        IconComponent: AlertTriangle,
      }
    : {
        bg: 'bg-[#EDF4FF]/70 dark:bg-[#4F86D9]/15',
        border: 'border-[#4F86D9]/30 dark:border-[#4F86D9]/40',
        badgeBg: 'bg-[#EDF4FF] dark:bg-[#4F86D9]/20 text-[#243B64] dark:text-sky-200 border-[#4F86D9]/30 dark:border-sky-500/40',
        titleColor: 'text-[#243B64] dark:text-sky-200',
        iconBg: 'bg-[#243B64] text-white',
        label: 'Informational Notice',
        summary: 'Guideline reminder sent by moderation to help ensure safe and fair marketplace transactions.',
        IconComponent: Info,
      };

  const handleAcknowledge = () => {
    if (onAcknowledge) {
      onAcknowledge(warning.id);
    }
    onClose();
  };

  const { IconComponent } = theme;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white dark:bg-[#111827] rounded-2xl max-w-lg w-full shadow-2xl border border-[#E0E7F0] dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150 space-y-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="warning-modal-title"
      >
        {/* Top Header Banner with Dynamic Severity Color */}
        <div className={`p-5 ${theme.bg} border-b ${theme.border} flex items-start justify-between gap-3`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${theme.iconBg} flex items-center justify-center shadow-xs shrink-0`}>
              <IconComponent className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 id="warning-modal-title" className={`text-base font-bold ${theme.titleColor}`}>
                  Moderation Notice
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${theme.badgeBg}`}>
                  {theme.label}
                </span>
              </div>
              <p className="text-xs text-[#667085] dark:text-slate-400 mt-0.5">
                Official communication from WishMarket Community Trust & Safety
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#667085] dark:text-slate-400 hover:text-[#263244] dark:hover:text-slate-100 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Severity guidance alert */}
          <div className="p-3 rounded-xl bg-[#F7F9FC] dark:bg-slate-800/70 border border-[#E0E7F0] dark:border-slate-700 text-xs text-[#263244] dark:text-slate-200 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-[#4F86D9] dark:text-sky-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">{theme.summary}</span>
              <span className="text-[11px] text-[#667085] dark:text-slate-400 block mt-0.5">
                Issued to: <strong className="text-[#263244] dark:text-slate-200">{warning.targetUserName}</strong> · Date: {warning.issuedAt}
              </span>
            </div>
          </div>

          {/* Violation Reason */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-[#667085] dark:text-slate-400 tracking-wider block">
              Policy Violation Reason
            </span>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#E0E7F0] dark:border-slate-700 text-xs font-semibold text-[#263244] dark:text-slate-100 shadow-2xs">
              {warning.reason}
            </div>
          </div>

          {/* Moderator Explanation */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-[#667085] dark:text-slate-400 tracking-wider block">
              Moderator Explanation & Details
            </span>
            <div className="p-3.5 rounded-xl bg-[#F7F9FC] dark:bg-slate-800/70 border border-[#E0E7F0] dark:border-slate-700 text-xs text-[#263244] dark:text-slate-200 leading-relaxed whitespace-pre-line">
              {warning.details || 'No additional explanation provided.'}
            </div>
          </div>

          {/* Related Listing Card if applicable */}
          {warning.targetWishTitle && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-[#667085] dark:text-slate-400 tracking-wider block">
                Related Marketplace Wish / Listing
              </span>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#E0E7F0] dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Tag className="w-4 h-4 text-[#4F86D9] dark:text-sky-400 shrink-0" />
                  <span className="font-semibold text-[#263244] dark:text-slate-100 truncate" title={warning.targetWishTitle}>
                    {warning.targetWishTitle}
                  </span>
                </div>
                {warning.targetWishId && onViewWish && (
                  <button
                    type="button"
                    onClick={() => {
                      onViewWish(warning.targetWishId!);
                      onClose();
                    }}
                    className="text-xs font-bold text-[#4F86D9] dark:text-sky-400 hover:text-[#3568B5] dark:hover:text-sky-300 shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Listing</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Permanent History Notice */}
          <p className="text-[11px] text-[#667085] dark:text-slate-400 pt-1 italic">
            * This moderation record is preserved in your permanent account history. Buyers cannot alter or delete administrator warnings.
          </p>

          {/* Footer Action */}
          <div className="pt-3 border-t border-[#E0E7F0] dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleAcknowledge}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#243B64] hover:bg-[#1A2B49] text-white text-xs font-bold shadow-soft transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>I Understand & Acknowledge</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
