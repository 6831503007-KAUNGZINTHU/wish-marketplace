import React, { useState } from 'react';
import { Wish, WarningRecord } from '../types';
import { 
  AlertTriangle, ShieldAlert, X, Send, 
  CheckCircle2, Shield, Info, UserX 
} from 'lucide-react';

interface AdminWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetWish?: Wish | null;
  targetUser?: { id: string; name: string } | null;
  onIssueWarning: (warning: {
    targetUserId: string;
    targetUserName: string;
    targetWishId?: string;
    targetWishTitle?: string;
    reason: string;
    severity: 'NOTICE' | 'POLICY_WARNING' | 'FINAL_WARNING';
    details: string;
  }) => void;
}

export const AdminWarningModal: React.FC<AdminWarningModalProps> = ({
  isOpen,
  onClose,
  targetWish,
  targetUser,
  onIssueWarning,
}) => {
  if (!isOpen) return null;

  const recipientId = targetUser?.id || targetWish?.buyerId || '';
  const recipientName = targetUser?.name || targetWish?.buyerName || 'Buyer';

  const defaultReasons = [
    'Unrealistic budget / price trolling on requested item',
    'Inappropriate, prohibited, or counterfeit item request',
    'Soliciting off-platform payment or contact information',
    'Duplicate spam listings violating community feed guidelines',
    'Unsafe meeting location or refusing verified exchange standards',
    'Disrespectful communication towards sellers',
  ];

  const [selectedReason, setSelectedReason] = useState(defaultReasons[0]);
  const [customReason, setCustomReason] = useState('');
  const [severity, setSeverity] = useState<'NOTICE' | 'POLICY_WARNING' | 'FINAL_WARNING'>('POLICY_WARNING');
  const [details, setDetails] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!recipientId) {
      setErrorMsg('No recipient buyer specified.');
      return;
    }

    const finalReason = selectedReason === 'CUSTOM' ? customReason.trim() : (selectedReason || '').trim();
    if (!finalReason) {
      setErrorMsg('Please select or enter a valid violation reason.');
      return;
    }

    const finalExplanation = details.trim();
    if (!finalExplanation) {
      setErrorMsg('Please provide a moderator explanation for the buyer.');
      return;
    }

    onIssueWarning({
      targetUserId: recipientId,
      targetUserName: recipientName,
      targetWishId: targetWish?.id,
      targetWishTitle: targetWish?.title,
      reason: finalReason,
      severity,
      details: finalExplanation,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="relative bg-white dark:bg-[#111827] rounded-2xl max-w-lg w-full border border-amber-200 dark:border-amber-800/60 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-200/70 dark:border-amber-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Issue Admin Warning</span>
                <span className="text-[10px] bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold px-2 py-0.5 rounded-full uppercase">
                  Moderator Action
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Direct moderator notice to <strong className="text-slate-900 dark:text-slate-200">{recipientName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-amber-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-xs text-red-700 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          {/* Target Subject Box */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Recipient Buyer:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{recipientName}</span>
            </div>
            {targetWish && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Referenced Listing:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                  {targetWish.title}
                </span>
              </div>
            )}
          </div>

          {/* Severity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Warning Severity Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSeverity('NOTICE')}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  severity === 'NOTICE'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 font-bold ring-1 ring-blue-200 dark:ring-blue-800'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs'
                }`}
              >
                <div className="text-xs font-bold">1. Notice</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Friendly reminder</div>
              </button>

              <button
                type="button"
                onClick={() => setSeverity('POLICY_WARNING')}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  severity === 'POLICY_WARNING'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-bold ring-1 ring-amber-200 dark:ring-amber-800'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs'
                }`}
              >
                <div className="text-xs font-bold">2. Warning</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Policy violation</div>
              </button>

              <button
                type="button"
                onClick={() => setSeverity('FINAL_WARNING')}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  severity === 'FINAL_WARNING'
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-200 font-bold ring-1 ring-red-200 dark:ring-red-800'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs'
                }`}
              >
                <div className="text-xs font-bold">3. Final Notice</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Prior to ban</div>
              </button>
            </div>
          </div>

          {/* Reason Preset */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Violation Reason Preset
            </label>
            <select
              value={selectedReason}
              onChange={(e) => {
                setSelectedReason(e.target.value);
                setCustomReason('');
              }}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-500/20 outline-none cursor-pointer"
            >
              {defaultReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="CUSTOM">Other / Custom Reason...</option>
            </select>
          </div>

          {/* Custom Reason if selected */}
          {selectedReason === 'CUSTOM' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Custom Violation Headline
              </label>
              <input
                type="text"
                required
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Briefly state the specific violation..."
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-500/20 outline-none"
              />
            </div>
          )}

          {/* Detailed Message to Buyer */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Moderator Explanation / Instructions for Buyer
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. Please update your listing with realistic pricing. Repeat offenses will result in marketplace account restrictions."
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-500/20 outline-none resize-none"
            />
          </div>

          {/* Notice Box */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200/70 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span>
              This warning will be logged in the system, increment the buyer's warning count, and appear on their account drawer to enforce community safety standards.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Warning to Buyer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
