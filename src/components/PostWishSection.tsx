import React, { useState, useRef } from 'react';
import { User, Wish, WishCategory } from '../types';
import { 
  Plus, Sparkles, Image as ImageIcon, DollarSign, 
  Tag, FileText, CheckCircle2, ArrowRight, ArrowLeft, X, Upload, 
  Check, AlertCircle, ShoppingBag, Eye, HelpCircle 
} from 'lucide-react';
import { formatBaht, CURRENCY_SYMBOL } from '../utils/currency';

interface PostWishSectionProps {
  currentUser: User | null;
  onPostWish: (wishData: {
    title: string;
    category: WishCategory;
    budget: number;
    description: string;
    imageUrl?: string;
    images?: string[];
  }) => Wish;
  onRequireAuth: () => void;
  onViewWishFeed?: () => void;
}

export const PostWishSection: React.FC<PostWishSectionProps> = ({
  currentUser,
  onPostWish,
  onRequireAuth,
  onViewWishFeed,
}) => {
  // Stepper state: 1 = Item Info, 2 = Budget & Requirements, 3 = Photos & Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<WishCategory>('Electronics');
  const [budget, setBudget] = useState<string>('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  
  // UI states
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdWishId, setCreatedWishId] = useState<string | null>(null);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [step2Error, setStep2Error] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [presetNotice, setPresetNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Popular curated inspiration presets for fast testing
  const inspirationPresets = [
    {
      label: 'iPhone 15 Pro',
      title: 'iPhone 15 Pro (128GB, Unlocked)',
      category: 'Electronics' as WishCategory,
      budget: '780',
      description: 'Looking for a clean unlocked iPhone 15 Pro with original box and good battery health.',
      images: [
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80',
      ],
    },
    {
      label: 'Sony XM5',
      title: 'Sony WH-1000XM5 Wireless Headphones',
      category: 'Electronics' as WishCategory,
      budget: '220',
      description: 'Looking for black Sony XM5 headphones with original carrying case and working noise cancelation.',
      images: [
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80',
      ],
    },
    {
      label: 'Ceramic Mug',
      title: 'Handmade Stoneware Ceramic Coffee Mug Set',
      category: 'Crafts' as WishCategory,
      budget: '45',
      description: 'Looking for artisanal pottery coffee mugs with earthy glaze finish, 12-14oz capacity.',
      images: [
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
      ],
    },
    {
      label: 'Air Jordans',
      title: 'Nike Air Jordan 1 Retro High (Size 10.5)',
      category: 'Fashion' as WishCategory,
      budget: '210',
      description: 'Looking for authentic Jordan 1 High in clean condition with original box and extra laces.',
      images: [
        'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&auto=format&fit=crop&q=80',
      ],
    },
    {
      label: 'Nintendo Switch',
      title: 'Nintendo Switch OLED Model (White)',
      category: 'Collectibles' as WishCategory,
      budget: '240',
      description: 'Looking for a clean Switch OLED console with TV dock, power adapter, and working Joy-Cons.',
      images: [
        'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&auto=format&fit=crop&q=80',
      ],
    },
    {
      label: 'Dune Hardcover',
      title: 'Dune Deluxe Collector’s Hardcover',
      category: 'Books' as WishCategory,
      budget: '55',
      description: 'Looking for the deluxe clothbound or foil-stamped edition of Dune in mint condition.',
      images: [
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      ],
    },
    {
      label: 'Japanese Matcha',
      title: 'Ceremonial Japanese Matcha (100g)',
      category: 'Food' as WishCategory,
      budget: '38',
      description: 'Looking for authentic Uji Kyoto ceremonial matcha in a fresh sealed tin.',
      images: [
        'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
      ],
    },
    {
      label: 'Arc Floor Lamp',
      title: 'Walnut Arc Floor Lamp',
      category: 'Home' as WishCategory,
      budget: '165',
      description: 'Looking for mid-century modern curved walnut and brass floor lamp with marble base.',
      images: [
        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80',
      ],
    },
  ];

  // Quick preset sample photos to attach with 1 click
  const samplePhotos = [
    { label: 'Smartphone', url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80' },
    { label: 'Headphones', url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80' },
    { label: 'Sneakers', url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&auto=format&fit=crop&q=80' },
    { label: 'Gaming Console', url: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&auto=format&fit=crop&q=80' },
    { label: 'Ceramics', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80' },
    { label: 'Books', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80' },
  ];

  const handleApplyPreset = (preset: typeof inspirationPresets[0]) => {
    setTitle(preset.title);
    setCategory(preset.category);
    setBudget(preset.budget);
    setDescription(preset.description);
    setImages([...preset.images]);
    setStep1Error(null);
    setStep2Error(null);
    setPresetNotice(`Loaded example: "${preset.title}". You can modify any field freely.`);
    setTimeout(() => setPresetNotice(null), 5000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - images.length;
    if (remainingSlots <= 0) {
      setGeneralError('Maximum 5 images allowed per wish.');
      return;
    }

    const filesToRead = Array.from(files).slice(0, remainingSlots);

    filesToRead.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        setGeneralError('One or more files exceeded 5MB and were skipped.');
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

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setGeneralError(null);
  };

  const handleAddSample = (url: string) => {
    if (images.length >= 5) {
      setGeneralError('Maximum 5 images reached. Remove an image to add a new one.');
      return;
    }
    setImages((prev) => [...prev, url]);
    setGeneralError(null);
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    if (images.length >= 5) {
      setGeneralError('Maximum 5 images reached.');
      return;
    }
    setImages((prev) => [...prev, urlInput.trim()]);
    setUrlInput('');
    setShowUrlInput(false);
    setGeneralError(null);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setGeneralError(null);
  };

  // Step 1 Validation & Next
  const handleNextFromStep1 = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setStep1Error('Please enter what item you are looking for (e.g. iPhone 15 Pro, Coffee Maker).');
      return;
    }
    setStep1Error(null);
    setCurrentStep(2);
  };

  // Step 2 Validation & Next
  const handleNextFromStep2 = (e: React.MouseEvent) => {
    e.preventDefault();
    const num = parseFloat(budget);
    if (!budget.trim() || isNaN(num) || num <= 0) {
      setStep2Error('Please enter a target budget greater than ฿0.');
      return;
    }
    setStep2Error(null);
    setCurrentStep(3);
  };

  // Final Submit on Step 3
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    if (!title.trim()) {
      setCurrentStep(1);
      setStep1Error('Please enter what item you are looking for.');
      return;
    }

    const budgetNum = parseFloat(budget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      setCurrentStep(2);
      setStep2Error('Please enter a valid target budget greater than ฿0.');
      return;
    }

    const newWish = onPostWish({
      title: title.trim(),
      category,
      budget: budgetNum,
      description: description.trim() || 'No additional condition notes specified.',
      imageUrl: images.length > 0 ? images[0] : undefined,
      images: images.slice(0, 5),
    });

    setCreatedWishId(newWish.id);
    setIsSuccess(true);
  };

  const handleResetForNewWish = () => {
    setTitle('');
    setCategory('Electronics');
    setBudget('');
    setDescription('');
    setImages([]);
    setCurrentStep(1);
    setIsSuccess(false);
    setCreatedWishId(null);
    setStep1Error(null);
    setStep2Error(null);
    setGeneralError(null);
    setPresetNotice(null);
  };

  // SUCCESS STATE
  if (isSuccess && createdWishId) {
    return (
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E0E7F0] dark:border-slate-800 shadow-soft p-6 sm:p-8 text-center space-y-5 animate-in fade-in duration-200">
        <div className="w-14 h-14 rounded-2xl bg-[#EAF6F0] dark:bg-emerald-950/50 border border-[#287A55]/30 dark:border-emerald-800/50 text-[#287A55] dark:text-emerald-400 mx-auto flex items-center justify-center shadow-xs">
          <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
        </div>

        <div className="space-y-1.5 max-w-md mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#287A55] dark:text-emerald-300 bg-[#EAF6F0] dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full font-mono border border-[#287A55]/20 dark:border-emerald-800/50">
            {createdWishId}
          </span>
          <h2 className="text-xl font-extrabold text-[#263244] dark:text-slate-100 tracking-tight">
            Wish Published Successfully!
          </h2>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-400 leading-relaxed">
            Your demand request is now live in the marketplace feed. Verified sellers will see your target budget of{' '}
            <strong className="text-[#287A55] dark:text-emerald-400 font-mono font-bold">{formatBaht(parseFloat(budget || '0'))}</strong> and can submit direct offers to you.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {onViewWishFeed && (
            <button
              type="button"
              onClick={onViewWishFeed}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#4F86D9] hover:bg-[#3568B5] active:bg-[#3568B5] text-white text-xs sm:text-sm font-bold shadow-soft flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>View in Buyer Feed</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleResetForNewWish}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-[#F7F9FC] dark:hover:bg-slate-700 text-[#263244] dark:text-slate-200 border border-[#E0E7F0] dark:border-slate-700 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
          >
            + Post Another Wish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E0E7F0] dark:border-slate-800 shadow-soft overflow-hidden transition-all duration-200">
      {/* Form Top Header */}
      <div className="p-5 sm:p-6 border-b border-[#E0E7F0] dark:border-slate-800 bg-gradient-to-r from-white via-[#EDF4FF]/40 to-white dark:from-[#111827] dark:via-slate-800/40 dark:to-[#111827]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-[#263244] dark:text-slate-100 tracking-tight flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#243B64] dark:bg-[#4F86D9] text-white flex items-center justify-center text-xs shadow-xs font-bold">
                W
              </span>
              <span>Post What You Want to Buy</span>
            </h1>
            <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
              Tell sellers what item you're looking for, your target budget, and condition. Sellers bring offers to you!
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[11px] font-semibold text-[#243B64] dark:text-sky-300 bg-[#EDF4FF] dark:bg-[#4F86D9]/15 px-2.5 py-1 rounded-full border border-[#4F86D9]/30 shadow-2xs">
              Step {currentStep} of 3
            </span>
          </div>
        </div>

        {/* 3-STEP PROGRESS STEPPER */}
        <div className="mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-[#E0E7F0]/80 dark:border-slate-800">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 relative">
            {/* Step 1 Pill */}
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-1.5 sm:gap-2 p-2 rounded-xl text-left transition-all cursor-pointer ${
                currentStep === 1
                  ? 'bg-white dark:bg-slate-800 shadow-soft ring-2 ring-[#4F86D9]'
                  : 'hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                  currentStep === 1
                    ? 'bg-[#4F86D9] text-white'
                    : currentStep > 1
                    ? 'bg-[#287A55] text-white'
                    : 'bg-[#E0E7F0] dark:bg-slate-700 text-[#667085] dark:text-slate-400'
                }`}
              >
                {currentStep > 1 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-[#263244] dark:text-slate-100 block truncate">
                  Item Info
                </span>
                <span className="text-[10px] text-[#667085] dark:text-slate-400 hidden sm:block truncate">
                  Name & category
                </span>
              </div>
            </button>

            {/* Step 2 Pill */}
            <button
              type="button"
              onClick={() => {
                if (title.trim()) setCurrentStep(2);
                else setStep1Error('Please fill in the item title before advancing.');
              }}
              className={`flex items-center gap-1.5 sm:gap-2 p-2 rounded-xl text-left transition-all cursor-pointer ${
                currentStep === 2
                  ? 'bg-white dark:bg-slate-800 shadow-soft ring-2 ring-[#4F86D9]'
                  : 'hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                  currentStep === 2
                    ? 'bg-[#4F86D9] text-white'
                    : currentStep > 2
                    ? 'bg-[#287A55] text-white'
                    : 'bg-[#E0E7F0] dark:bg-slate-700 text-[#667085] dark:text-slate-400'
                }`}
              >
                {currentStep > 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '2'}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-[#263244] dark:text-slate-100 block truncate">
                  Budget
                </span>
                <span className="text-[10px] text-[#667085] dark:text-slate-400 hidden sm:block truncate">
                  Price & requirements
                </span>
              </div>
            </button>

            {/* Step 3 Pill */}
            <button
              type="button"
              onClick={() => {
                if (!title.trim()) {
                  setStep1Error('Please fill in the item title first.');
                } else if (!budget.trim() || parseFloat(budget) <= 0) {
                  setStep2Error('Please enter a target budget greater than ฿0.');
                  setCurrentStep(2);
                } else {
                  setCurrentStep(3);
                }
              }}
              className={`flex items-center gap-1.5 sm:gap-2 p-2 rounded-xl text-left transition-all cursor-pointer ${
                currentStep === 3
                  ? 'bg-white dark:bg-slate-800 shadow-soft ring-2 ring-[#4F86D9]'
                  : 'hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                  currentStep === 3
                    ? 'bg-[#4F86D9] text-white'
                    : 'bg-[#E0E7F0] dark:bg-slate-700 text-[#667085] dark:text-slate-400'
                }`}
              >
                3
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-[#263244] dark:text-slate-100 block truncate">
                  Review
                </span>
                <span className="text-[10px] text-[#667085] dark:text-slate-400 hidden sm:block truncate">
                  Add photos & post
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Preset applied feedback notice */}
      {presetNotice && (
        <div className="mx-5 sm:mx-6 mt-4 p-3 bg-[#FEF7EC] dark:bg-amber-950/40 border border-[#B7791F]/30 dark:border-amber-800/50 rounded-xl text-xs text-[#B7791F] dark:text-amber-300 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#B7791F] dark:text-amber-400 shrink-0" />
            <span className="font-medium">{presetNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setPresetNotice(null)}
            className="text-[#B7791F] dark:text-amber-300 hover:text-[#7D5213] font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* MAIN STEP FORM CONTENT */}
      <form onSubmit={handleFinalSubmit} className="p-5 sm:p-6 space-y-6">
        {/* ================= STEP 1: WHAT ARE YOU LOOKING FOR? ================= */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#263244] dark:text-slate-100">
                Step 1 — What are you looking for?
              </h2>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Provide a descriptive name and choose the primary category so the right sellers see your post.
              </p>
            </div>

            {/* Quick Inspiration Chips */}
            <div className="bg-[#F7F9FC] dark:bg-slate-800/70 p-3.5 rounded-xl border border-[#E0E7F0] dark:border-slate-700 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#263244] dark:text-slate-200">
                <Sparkles className="w-3.5 h-3.5 text-[#4F86D9]" />
                <span>Quick suggestions (Click to pre-fill):</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {inspirationPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 hover:bg-[#EDF4FF] dark:hover:bg-[#4F86D9]/20 text-[#667085] dark:text-slate-300 hover:text-[#4F86D9] dark:hover:text-sky-300 border border-[#E0E7F0] dark:border-slate-700 hover:border-[#4F86D9]/40 transition-colors cursor-pointer shadow-2xs"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Item Title Input */}
            <div className="space-y-1.5">
              <label htmlFor="wish-title" className="block text-xs font-bold text-[#263244] dark:text-slate-200">
                Item Name / Title <span className="text-[#C0392B] dark:text-rose-400">*</span>
              </label>
              <input
                id="wish-title"
                type="text"
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (step1Error) setStep1Error(null);
                }}
                placeholder="e.g. iPhone 15 Pro (128GB, Natural Titanium) or Handmade Stoneware Mug"
                className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border outline-none transition-all text-[#263244] dark:text-slate-100 bg-[#F7F9FC] dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 font-medium placeholder:text-[#667085] dark:placeholder:text-slate-500 ${
                  step1Error
                    ? 'border-[#C0392B] ring-2 ring-[#C0392B]/15'
                    : 'border-[#E0E7F0] dark:border-slate-700 focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20'
                }`}
              />
              <p className="text-[11px] text-[#667085] dark:text-slate-400">
                Include brand, exact model, color, or edition to help sellers match your demand accurately.
              </p>
              {step1Error && (
                <p className="text-xs text-[#C0392B] dark:text-rose-400 font-semibold flex items-center gap-1 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{step1Error}</span>
                </p>
              )}
            </div>

            {/* Category Selector */}
            <div className="space-y-1.5">
              <label htmlFor="wish-category" className="block text-xs font-bold text-[#263244] dark:text-slate-200">
                Category <span className="text-[#C0392B] dark:text-rose-400">*</span>
              </label>
              <select
                id="wish-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as WishCategory)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E0E7F0] dark:border-slate-700 focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 outline-none transition-all text-[#263244] dark:text-slate-100 bg-white dark:bg-slate-800 cursor-pointer font-medium"
              >
                <option value="Electronics">Electronics (Phones, Laptops, Audio, Cameras)</option>
                <option value="Crafts">Crafts & Handmade (Pottery, Art, Woodwork)</option>
                <option value="Fashion">Fashion (Sneakers, Clothing, Watches, Bags)</option>
                <option value="Collectibles">Collectibles & Gaming (Consoles, Trading Cards)</option>
                <option value="Food">Food & Gourmet (Matcha, Specialty Coffee, Snacks)</option>
                <option value="Home">Home & Living (Furniture, Decor, Lighting, Kitchen)</option>
                <option value="Books">Books & Media (Hardcovers, Manga, Vinyl)</option>
                <option value="Toys">Toys & Hobbies (LEGO, Model Kits, Figures)</option>
                <option value="Sports">Sports & Outdoors (Gear, Fitness, Apparel)</option>
                <option value="Other">Other Miscellaneous Items</option>
              </select>
              <p className="text-[11px] text-[#667085] dark:text-slate-400">
                Sellers frequently browse specific categories to fulfill buyer wishes.
              </p>
            </div>

            {/* Step 1 Actions */}
            <div className="pt-4 border-t border-[#E0E7F0] dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-[#667085] dark:text-slate-400">
                {currentUser ? (
                  <span>Posting as <strong className="text-[#263244] dark:text-slate-200">{currentUser.name}</strong></span>
                ) : (
                  <span className="text-[#B7791F] dark:text-amber-400">You can sign in or switch account anytime</span>
                )}
              </span>

              <button
                type="button"
                onClick={handleNextFromStep1}
                className="px-5 py-2.5 rounded-xl bg-[#4F86D9] hover:bg-[#3568B5] active:bg-[#3568B5] text-white text-xs sm:text-sm font-bold shadow-soft hover:shadow-card-hover flex items-center gap-2 cursor-pointer transition-all min-h-[42px]"
              >
                <span>Continue to Budget</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: BUDGET & REQUIREMENTS ================= */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#263244] dark:text-slate-100">
                Step 2 — Budget and requirements
              </h2>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Set the target price you are prepared to pay. Sellers will propose direct offers based on this budget.
              </p>
            </div>

            {/* Target Budget Input */}
            <div className="space-y-1.5">
              <label htmlFor="wish-budget" className="block text-xs font-bold text-[#263244] dark:text-slate-200">
                Target Budget (฿ THB) <span className="text-[#C0392B] dark:text-rose-400">*</span>
              </label>
              <div className="relative max-w-sm">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-[#667085] dark:text-slate-400">
                  ฿
                </span>
                <input
                  id="wish-budget"
                  type="text"
                  inputMode="decimal"
                  required
                  value={budget}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                      setBudget(val);
                      if (step2Error) setStep2Error(null);
                    }
                  }}
                  placeholder="0.00"
                  className={`w-full pl-8 pr-4 py-2.5 text-base sm:text-lg font-mono font-bold rounded-xl border outline-none transition-all text-[#263244] dark:text-slate-100 bg-[#F7F9FC] dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 tabular-nums ${
                    step2Error
                      ? 'border-[#C0392B] ring-2 ring-[#C0392B]/15'
                      : 'border-[#E0E7F0] dark:border-slate-700 focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20'
                  }`}
                />
              </div>
              <p className="text-[11px] text-[#667085] dark:text-slate-400">
                The maximum price you are willing to pay. Sellers often submit competitive offers at or below your target.
              </p>
              {step2Error && (
                <p className="text-xs text-[#C0392B] dark:text-rose-400 font-semibold flex items-center gap-1 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{step2Error}</span>
                </p>
              )}
            </div>

            {/* Condition & Requirements Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="wish-description" className="block text-xs font-bold text-[#263244] dark:text-slate-200">
                  Condition & Requirements <span className="text-[#667085] dark:text-slate-400 font-normal">(Optional)</span>
                </label>
                <span className="text-[11px] text-[#667085] dark:text-slate-400">
                  {description.length}/500 chars
                </span>
              </div>
              <textarea
                id="wish-description"
                rows={3}
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Brand new in sealed box or pristine 9/10 condition. Include original cables, power brick, and packaging."
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E0E7F0] dark:border-slate-700 focus:border-[#4F86D9] focus:ring-2 focus:ring-[#4F86D9]/20 outline-none transition-all text-[#263244] dark:text-slate-100 placeholder:text-[#667085] dark:placeholder:text-slate-500 bg-[#F7F9FC] dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 resize-none"
              />
              <p className="text-[11px] text-[#667085] dark:text-slate-400">
                Describe acceptable condition (new, mint, refurbished), preferred accessories, color, or shipping requirements.
              </p>
            </div>

            {/* Quick Context Card */}
            <div className="p-3 bg-[#EDF4FF] dark:bg-[#4F86D9]/15 rounded-xl border border-[#4F86D9]/30 flex items-start gap-2.5 text-xs text-[#263244] dark:text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-[#4F86D9] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#243B64] dark:text-sky-300">Reverse Marketplace Tip</p>
                <p className="text-[#667085] dark:text-slate-400 text-[11px] mt-0.5">
                  Being transparent with your condition preferences helps sellers quickly match what they have in stock without back-and-forth questioning.
                </p>
              </div>
            </div>

            {/* Step 2 Actions */}
            <div className="pt-4 border-t border-[#E0E7F0] dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-[#F7F9FC] dark:hover:bg-slate-700 text-[#263244] dark:text-slate-200 border border-[#E0E7F0] dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer min-h-[42px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Step 1</span>
              </button>

              <button
                type="button"
                onClick={handleNextFromStep2}
                className="px-5 py-2.5 rounded-xl bg-[#4F86D9] hover:bg-[#3568B5] active:bg-[#3568B5] text-white text-xs sm:text-sm font-bold shadow-soft hover:shadow-card-hover flex items-center gap-2 cursor-pointer transition-all min-h-[42px]"
              >
                <span>Continue to Photos</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: REFERENCE PHOTOS & REVIEW ================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#263244] dark:text-slate-100">
                Step 3 — Reference photos & review
              </h2>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Reference photos help sellers understand the exact model, color, or condition expectations. Photos are optional.
              </p>
            </div>

            {/* Photo Uploader Box */}
            <div className="bg-[#F7F9FC] dark:bg-slate-800/70 rounded-2xl p-4 sm:p-5 border border-[#E0E7F0] dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-[#263244] dark:text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#4F86D9]" />
                    <span>Reference Photos</span>
                  </label>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 text-[#667085] dark:text-slate-400 border border-[#E0E7F0] dark:border-slate-700">
                    {images.length} of 5 photos added
                  </span>
                  <span className="text-[11px] text-[#667085] dark:text-slate-400">(Optional)</span>
                </div>
                {images.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setImages([])}
                    className="text-xs text-[#C0392B] dark:text-rose-400 hover:text-[#962D22] font-semibold cursor-pointer"
                  >
                    Clear all photos
                  </button>
                )}
              </div>

              {/* Grid of Photo Previews & Upload Slot */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-xl overflow-hidden border border-[#E0E7F0] dark:border-slate-700 aspect-square bg-white dark:bg-slate-900 shadow-soft group"
                  >
                    <img
                      src={img}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-[#243B64] dark:bg-[#4F86D9] text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-soft">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#C0392B] text-white flex items-center justify-center shadow-md hover:bg-[#962D22] hover:scale-105 transition cursor-pointer"
                      title="Remove photo"
                      aria-label="Remove photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Upload Slot if < 5 */}
                {images.length < 5 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-[#E0E7F0] dark:border-slate-700 hover:border-[#4F86D9] dark:hover:border-[#4F86D9] rounded-xl aspect-square bg-white dark:bg-slate-900 hover:bg-[#EDF4FF]/50 dark:hover:bg-[#4F86D9]/10 transition p-3 text-center cursor-pointer group min-h-[90px]"
                  >
                    <Upload className="w-5 h-5 text-[#667085] dark:text-slate-400 group-hover:text-[#4F86D9] mb-1 transition-colors" />
                    <span className="text-xs font-bold text-[#263244] dark:text-slate-200 group-hover:text-[#4F86D9]">
                      + Add Photo
                    </span>
                    <span className="text-[10px] text-[#667085] dark:text-slate-400 mt-0.5">
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

              {/* Additional Photo Actions: URL paste & Sample Stock click */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#E0E7F0] dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-xs font-semibold text-[#4F86D9] hover:text-[#3568B5] cursor-pointer"
                >
                  {showUrlInput ? 'Hide URL input' : '+ Attach image from web link (URL)'}
                </button>

                <span className="text-[10px] text-[#667085] dark:text-slate-400">
                  Supports JPG, PNG, WebP up to 5MB
                </span>
              </div>

              {showUrlInput && (
                <div className="flex items-center gap-2 pt-1 animate-in fade-in">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Paste direct image URL (https://...)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-[#E0E7F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#263244] dark:text-slate-100 outline-none focus:border-[#4F86D9]"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    className="px-3 py-1.5 bg-[#4F86D9] text-white text-xs font-bold rounded-xl hover:bg-[#3568B5] cursor-pointer shadow-soft"
                  >
                    Add URL
                  </button>
                </div>
              )}

              {/* Sample Photo Palette (Click to attach) */}
              <div className="pt-2 border-t border-[#E0E7F0] dark:border-slate-700">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 mb-2">
                  Sample Stock Photos (Click to attach):
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {samplePhotos.map((sample) => (
                    <button
                      key={sample.label}
                      type="button"
                      onClick={() => handleAddSample(sample.url)}
                      className="group relative rounded-lg overflow-hidden border border-[#E0E7F0] dark:border-slate-700 aspect-video hover:ring-2 hover:ring-[#4F86D9] transition cursor-pointer text-left bg-white dark:bg-slate-900 shadow-2xs"
                    >
                      <img
                        src={sample.url}
                        alt={sample.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-[#243B64]/90 text-white text-[9px] font-semibold px-1 py-0.5 truncate text-center block">
                        + {sample.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {generalError && (
                <p className="text-xs text-[#C0392B] dark:text-rose-400 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{generalError}</span>
                </p>
              )}
            </div>

            {/* PRE-POSTING REVIEW SUMMARY CARD */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border-2 border-[#4F86D9]/30 p-4 sm:p-5 shadow-soft space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E0E7F0] dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#4F86D9]" />
                  <span className="text-xs font-bold text-[#263244] dark:text-slate-200 uppercase tracking-wide">
                    Listing Summary Preview
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#287A55] dark:text-emerald-300 bg-[#EAF6F0] dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-[#287A55]/30 dark:border-emerald-800/50">
                  Ready to Post
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-[#263244] dark:text-slate-100">
                      {title || 'Untitled Item'}
                    </h3>
                    <span className="inline-block mt-0.5 text-[11px] font-semibold text-[#667085] dark:text-slate-300 bg-[#F7F9FC] dark:bg-slate-900 px-2 py-0.5 rounded-md border border-[#E0E7F0] dark:border-slate-700">
                      {category}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-[#667085] dark:text-slate-400 block uppercase">Target Budget</span>
                    <span className="text-base sm:text-lg font-mono font-extrabold text-[#287A55] dark:text-emerald-400 tabular-nums">
                      {formatBaht(parseFloat(budget || '0'))}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#667085] dark:text-slate-400 line-clamp-2 pt-1 border-t border-[#E0E7F0] dark:border-slate-700">
                  {description || 'No additional condition notes specified.'}
                </p>

                <div className="pt-1 text-[11px] text-[#667085] dark:text-slate-400 flex items-center justify-between">
                  <span>{images.length} reference photo(s) attached</span>
                  <span>Posting as: <strong className="text-[#263244] dark:text-slate-200">{currentUser?.name || 'Guest User'}</strong></span>
                </div>
              </div>
            </div>

            {/* Step 3 Actions */}
            <div className="pt-4 border-t border-[#E0E7F0] dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-[#F7F9FC] dark:hover:bg-slate-700 text-[#263244] dark:text-slate-200 border border-[#E0E7F0] dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer min-h-[42px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Budget</span>
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#4F86D9] hover:bg-[#3568B5] active:bg-[#3568B5] text-white text-xs sm:text-sm font-bold shadow-soft hover:shadow-card-hover flex items-center gap-2 cursor-pointer transition-all min-h-[44px]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Post My Wish</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
