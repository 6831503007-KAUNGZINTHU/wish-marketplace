import React from 'react';
import { Wish } from '../types';
import { Trash2, AlertCircle } from 'lucide-react';

interface DeleteWishModalProps {
  isOpen: boolean;
  wish: Wish | null;
  onClose: () => void;
  onConfirmDelete: (wishId: string) => void;
}

export const DeleteWishModal: React.FC<DeleteWishModalProps> = ({
  isOpen,
  wish,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !wish) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#111827] rounded-2xl max-w-md w-full p-6 shadow-card-hover border border-[#EAECF0] dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-wish-title"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 id="delete-wish-title" className="text-base font-bold text-[#172033] dark:text-slate-100">
              Delete this wish?
            </h3>
            <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
              "{wish.title}" will be permanently removed from the marketplace. Any offers on this wish will be marked as closed.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAECF0] dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#667085] dark:text-slate-300 hover:text-[#172033] dark:hover:text-slate-100 bg-[#F7F8FC] dark:bg-slate-800 hover:bg-[#EAECF0] dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirmDelete(wish.id)}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-soft transition cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Wish</span>
          </button>
        </div>
      </div>
    </div>
  );
};
