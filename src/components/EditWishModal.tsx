import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Wish, WishCategory } from '../types';
import { 
  X, Image as ImageIcon, Upload, DollarSign, 
  Tag, FileText, Check, AlertTriangle, Sparkles, Shield, 
  Info, CheckCircle2, AlertCircle 
} from 'lucide-react';

interface EditWishModalProps {
  wish: Wish | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedWish: Wish) => void;
  isAdmin?: boolean;
}

export const EditWishModal: React.FC<EditWishModalProps> = ({
  wish,
  isOpen,
  onClose,
  onSave,
  isAdmin = false,
}) => {
  if (!isOpen || !wish) return null;

  // Form Fields
  const [title, setTitle] = useState(wish.title);
  const [category, setCategory] = useState<WishCategory>(wish.category);
  const [budget, setBudget] = useState(wish.budget.toString());
  const [description, setDescription] = useState(wish.description);
  
  // Images up to 5
  const [images, setImages] = useState<string[]>(
    wish.images && wish.images.length > 0 
      ? [...wish.images] 
      : (wish.imageUrl ? [wish.imageUrl] : [])
  );
  
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isFlagged, setIsFlagged] = useState(wish.isFlagged || false);
  const [adminNotes, setAdminNotes] = useState(wish.adminNotes || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync if wish changes
  useEffect(() => {
    if (wish) {
      setTitle(wish.title);
      setCategory(wish.category);
      setBudget(wish.budget.toString());
      setDescription(wish.description);
      setImages(
        wish.images && wish.images.length > 0 
          ? [...wish.images] 
          : (wish.imageUrl ? [wish.imageUrl] : [])
      );
      setIsFlagged(wish.isFlagged || false);
      setAdminNotes(wish.adminNotes || '');
      setErrorMsg('');
      setSaveSuccess(false);
      setShowDiscardConfirm(false);
    }
  }, [wish]);

  // Determine if form has unsaved edits
  const isDirty = useMemo(() => {
    if (!wish) return false;
    const initialImages = wish.images && wish.images.length > 0 
      ? wish.images 
      : (wish.imageUrl ? [wish.imageUrl] : []);
    
    const titleChanged = title.trim() !== wish.title.trim();
    const categoryChanged = category !== wish.category;
    const budgetChanged = budget.trim() !== wish.budget.toString();
    const descriptionChanged = description.trim() !== wish.description.trim();
    const flaggedChanged = isFlagged !== (wish.isFlagged || false);
    const notesChanged = adminNotes.trim() !== (wish.adminNotes || '').trim();
    const imagesChanged = JSON.stringify(images) !== JSON.stringify(initialImages);

    return (
      titleChanged ||
      categoryChanged ||
      budgetChanged ||
      descriptionChanged ||
      flaggedChanged ||
      notesChanged ||
      imagesChanged
    );
  }, [wish, title, category, budget, description, isFlagged, adminNotes, images]);

  const handleAttemptClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - images.length;
    if (remainingSlots <= 0) {
      setErrorMsg('Maximum 5 photos allowed.');
      return;
    }

    const filesToRead = Array.from(files).slice(0, remainingSlots);

    filesToRead.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('One or more photos exceeded 5MB and were skipped.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImages((prev) => {
            if (prev.length >= 5) return prev;
            return [...prev, reader.result as string];
          });
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
    setErrorMsg('');
  };

  const handleAddUrlImage = () => {
    if (!urlInput.trim()) return;
    if (images.length >= 5) {
      setErrorMsg('Maximum 5 photos reached.');
      return;
    }
    setImages((prev) => [...prev, urlInput.trim()]);
    setUrlInput('');
    setShowUrlInput(false);
    setErrorMsg('');
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const budgetNum = parseFloat(budget);
    if (!title.trim() || isNaN(budgetNum) || budgetNum <= 0) {
      setErrorMsg('Please enter a valid title and positive target budget (฿).');
      return;
    }

    const updated: Wish = {
      ...wish,
      title: title.trim(),
      category,
      budget: budgetNum,
      description: description.trim(),
      imageUrl: images.length > 0 ? images[0] : undefined,
      images: images.slice(0, 5),
      isFlagged,
      adminNotes: adminNotes.trim() || undefined,
    };

    setSaveSuccess(true);
    setTimeout(() => {
      onSave(updated);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#111827] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-card-hover border border-[#EAECF0] dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-wish-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#EAECF0] dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 id="edit-wish-modal-title" className="text-base sm:text-lg font-extrabold text-[#172033] dark:text-slate-100 tracking-tight">
                {isAdmin ? 'Review and Edit Wish' : 'Edit Wish Post'}
              </h2>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#F7F8FC] dark:bg-slate-800 text-[#667085] dark:text-slate-400 font-bold border border-[#EAECF0] dark:border-slate-700">
                {wish.id}
              </span>
              {wish.isFlagged && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60">
                  Flagged Listing
                </span>
              )}
            </div>
            <p className="text-xs text-[#667085] dark:text-slate-400 mt-0.5">
              {isAdmin 
                ? 'Review buyer listing details, update category/budget, and record moderation notes.' 
                : 'Update your wanted item details, target budget, condition notes, or photos.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAttemptClose}
            className="p-1.5 text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-slate-100 hover:bg-[#F7F8FC] dark:hover:bg-slate-800 rounded-lg transition cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {saveSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold">Changes saved successfully! Updating listing...</span>
          </div>
        )}

        {/* Discard Unsaved Changes Warning Prompt */}
        {showDiscardConfirm && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-xl space-y-2.5 animate-in fade-in">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>You have unsaved changes on this listing</span>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              If you leave now, any changes you made will be lost. Would you like to keep editing or discard your changes?
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 hover:bg-amber-100/60 dark:hover:bg-slate-700 text-amber-900 dark:text-amber-200 rounded-lg cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer shadow-2xs"
              >
                Discard Changes
              </button>
            </div>
          </div>
        )}

        {/* Main Form Grouped into 4 Distinct Sections */}
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* SECTION A: WISH DETAILS */}
          <div className="bg-[#F7F9FC] dark:bg-slate-800/40 rounded-xl p-4 border border-[#E0E7F0] dark:border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-[#E0E7F0] dark:border-slate-700/80">
              <span className="w-5 h-5 rounded-md bg-[#243B64] dark:bg-[#4F86D9] text-white flex items-center justify-center font-bold text-[10px]">
                A
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#263244] dark:text-white">
                Wish Details
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#263244] dark:text-white mb-1">
                  Item Title / Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Nintendo Switch OLED Model"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E0E7F0] dark:border-slate-700 focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 outline-none text-[#263244] dark:text-white bg-white dark:bg-[#0B0F19] font-medium"
                />
                <p className="text-[11px] text-[#5B6B82] dark:text-slate-400 mt-1">
                  The primary listing title visible to all marketplace sellers.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#263244] dark:text-white mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as WishCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E0E7F0] dark:border-slate-700 focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 outline-none text-[#263244] dark:text-white bg-white dark:bg-[#0B0F19] cursor-pointer font-medium"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Crafts">Crafts & Handmade</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Collectibles">Collectibles</option>
                  <option value="Food">Food & Gourmet</option>
                  <option value="Home">Home & Living</option>
                  <option value="Books">Books & Media</option>
                  <option value="Toys">Toys & Hobbies</option>
                  <option value="Sports">Sports & Outdoors</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION B: BUDGET AND REQUIREMENTS */}
          <div className="bg-[#F7F9FC] dark:bg-slate-800/40 rounded-xl p-4 border border-[#E0E7F0] dark:border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-[#E0E7F0] dark:border-slate-700/80">
              <span className="w-5 h-5 rounded-md bg-[#243B64] dark:bg-[#4F86D9] text-white flex items-center justify-center font-bold text-[10px]">
                B
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#263244] dark:text-white">
                Budget & Requirements
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#263244] dark:text-white mb-1">
                  Target Budget (฿ THB) <span className="text-rose-500">*</span>
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#5B6B82] dark:text-slate-400">
                    ฿
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={budget}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                        setBudget(val);
                      }
                    }}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3.5 py-2 text-sm font-mono font-bold rounded-xl border border-[#E0E7F0] dark:border-slate-700 focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 outline-none text-[#263244] dark:text-white bg-white dark:bg-[#0B0F19] tabular-nums"
                  />
                </div>
                <p className="text-[11px] text-[#5B6B82] dark:text-slate-400 mt-1">
                  Target budget in Thai Baht (฿). Offers are evaluated against this threshold.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#263244] dark:text-white mb-1">
                  Condition & Requirements Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe acceptable conditions, color preferences, accessories, or packaging requirements..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E0E7F0] dark:border-slate-700 focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 outline-none text-[#263244] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-[#0B0F19] resize-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION C: REFERENCE PHOTOS */}
          <div className="bg-[#F7F9FC] dark:bg-slate-800/40 rounded-xl p-4 border border-[#E0E7F0] dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#E0E7F0] dark:border-slate-700/80">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-[#243B64] dark:bg-[#4F86D9] text-white flex items-center justify-center font-bold text-[10px]">
                  C
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#263244] dark:text-white">
                  Reference Photos
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-[#5B6B82] dark:text-slate-400">
                {images.length} / 5 photos
              </span>
            </div>

            <p className="text-[11px] text-[#5B6B82] dark:text-slate-400">
              Upload or manage reference photos showing exact models, versions, or conditions expected by the buyer.
            </p>

            {/* Photo Previews Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative rounded-xl overflow-hidden border border-[#E0E7F0] dark:border-slate-700 aspect-square bg-white dark:bg-[#0B0F19] shadow-soft group"
                >
                  <img
                    src={img}
                    alt={`Listing photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {idx === 0 && (
                    <span className="absolute top-1 left-1 bg-[#243B64] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-soft">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-700 transition cursor-pointer"
                    title="Remove photo"
                    aria-label="Remove photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Upload Slot if < 5 */}
              {images.length < 5 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center border-2 border-dashed border-[#E0E7F0] dark:border-slate-700 hover:border-[#4F86D9] dark:hover:border-[#4F86D9] rounded-xl aspect-square bg-white dark:bg-[#0B0F19] hover:bg-[#EDF4FF]/50 dark:hover:bg-slate-800 transition p-2 text-center cursor-pointer group"
                >
                  <Upload className="w-4 h-4 text-[#5B6B82] dark:text-slate-400 group-hover:text-[#4F86D9] dark:group-hover:text-sky-400 mb-1" />
                  <span className="text-[10px] font-bold text-[#263244] dark:text-white group-hover:text-[#4F86D9] dark:group-hover:text-sky-400">
                    + Add Photo
                  </span>
                  <span className="text-[9px] text-[#5B6B82] dark:text-slate-400">
                    ({5 - images.length} left)
                  </span>
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
            />

            {/* URL Paste Option */}
            <div className="pt-1 flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-[#4F86D9] dark:text-sky-400 hover:text-[#3568B5] dark:hover:text-sky-300 font-semibold cursor-pointer"
              >
                {showUrlInput ? 'Hide URL field' : '+ Attach image from direct URL'}
              </button>
              {images.length > 0 && (
                <button
                  type="button"
                  onClick={() => setImages([])}
                  className="text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold cursor-pointer"
                >
                  Clear all photos
                </button>
              )}
            </div>

            {showUrlInput && (
              <div className="flex items-center gap-2 pt-1 animate-in fade-in">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Paste direct image URL (https://...)"
                  className="text-xs px-3 py-1.5 rounded-xl border border-[#E0E7F0] dark:border-slate-700 flex-1 outline-none focus:border-[#4F86D9] bg-white dark:bg-[#0B0F19] text-[#263244] dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddUrlImage}
                  className="px-3 py-1.5 bg-[#4F86D9] hover:bg-[#3568B5] active:bg-[#243B64] text-white text-xs font-bold rounded-xl cursor-pointer shadow-soft"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* SECTION D: ADMIN MODERATION & REVIEW */}
          {isAdmin && (
            <div className="bg-purple-50/70 dark:bg-purple-950/30 border-2 border-purple-200/90 dark:border-purple-800/60 rounded-xl p-4 sm:p-5 space-y-3.5 shadow-soft">
              <div className="flex items-center justify-between pb-1.5 border-b border-purple-200 dark:border-purple-800/60">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-purple-700 text-white flex items-center justify-center font-bold text-[10px]">
                    D
                  </span>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" />
                    <span>Admin Moderation & Review</span>
                  </h3>
                </div>
                <span className="text-[10px] font-bold uppercase bg-purple-200/80 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 px-2 py-0.5 rounded-full">
                  Staff Only
                </span>
              </div>

              {/* Policy Review Flag Toggle */}
              <div className="flex items-center justify-between bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-purple-200 dark:border-purple-800/60">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-[#263244] dark:text-white block">
                    Flag Listing for Policy Review
                  </span>
                  <span className="text-[11px] text-[#5B6B82] dark:text-slate-400 block">
                    Flags this wish with a visible moderation badge in the marketplace feed.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
                  <input
                    type="checkbox"
                    checked={isFlagged}
                    onChange={(e) => setIsFlagged(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Internal Admin Note */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-purple-950 dark:text-purple-200">
                  Internal Moderation Notes (Staff Only)
                </label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Verified legitimate buyer request; safe public meet-up advised."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-[#0B0F19] text-[#263244] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 font-medium"
                />
                <div className="flex items-center gap-1.5 text-[11px] text-purple-800 dark:text-purple-300">
                  <Info className="w-3.5 h-3.5 shrink-0 text-purple-600 dark:text-purple-400" />
                  <span>
                    Moderation notes are strictly internal and visible only to administrators. Buyers and sellers will never see this note.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions Footer */}
          <div className="pt-3 border-t border-[#E0E7F0] dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-[#5B6B82] dark:text-slate-400 order-2 sm:order-1">
              {isDirty ? (
                <span className="text-amber-600 dark:text-amber-400 font-semibold">● Unsaved changes</span>
              ) : (
                <span>No changes made yet</span>
              )}
            </span>

            <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto order-1 sm:order-2">
              <button
                type="button"
                onClick={handleAttemptClose}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-[#5B6B82] dark:text-slate-300 hover:text-[#263244] dark:hover:text-white bg-[#F7F9FC] dark:bg-slate-800 hover:bg-[#E0E7F0] dark:hover:bg-slate-700 rounded-xl transition cursor-pointer min-h-[40px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2 text-xs font-bold text-white bg-[#4F86D9] hover:bg-[#3568B5] active:bg-[#243B64] rounded-xl shadow-soft hover:shadow-card-hover transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[40px]"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
