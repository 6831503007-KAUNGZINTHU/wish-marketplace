import React from 'react';
import { X, ShieldAlert, Key, Globe, ExternalLink, CheckCircle2 } from 'lucide-react';

interface SocialAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: 'Google' | 'Apple' | 'Facebook' | null;
}

export const SocialAuthModal: React.FC<SocialAuthModalProps> = ({
  isOpen,
  onClose,
  provider,
}) => {
  if (!isOpen || !provider) return null;

  const providerDetails = {
    Google: {
      name: 'Google Single Sign-On',
      envVar: 'VITE_GOOGLE_CLIENT_ID',
      docsUrl: 'https://console.cloud.google.com/apis/credentials',
      requiredItems: [
        'Google Cloud Console OAuth 2.0 Web Client ID',
        'Authorized JavaScript Origins (e.g. app domain URL)',
        'Authorized Redirect URIs (/auth/callback)',
        'Client-side Google Identity Services (GIS) SDK or backend OAuth endpoint',
      ],
      securityNote: 'Client secret must never be exposed in client-side code; use authorization code flow with a secure backend.',
    },
    Apple: {
      name: 'Sign in with Apple',
      envVar: 'VITE_APPLE_CLIENT_ID',
      docsUrl: 'https://developer.apple.com/account/resources/identifiers/list/serviceId',
      requiredItems: [
        'Apple Developer Team ID & Account Registration',
        'App Service ID (ServicesID)',
        'Sign in with Apple Private Key (.p8) stored in secure backend',
        'Return URL domain verification with Apple',
      ],
      securityNote: 'Apple authorization requires server-side token validation and private key signing. Never bundle .p8 keys in client assets.',
    },
    Facebook: {
      name: 'Meta / Facebook Login',
      envVar: 'VITE_FACEBOOK_APP_ID',
      docsUrl: 'https://developers.facebook.com/apps/',
      requiredItems: [
        'Meta for Developers App ID (FACEBOOK_APP_ID)',
        'Valid OAuth Redirect URIs configured in Meta App Dashboard',
        'App Secret stored securely on the backend server',
        'Facebook JavaScript SDK or OAuth 2.0 authorization endpoint',
      ],
      securityNote: 'Meta requires HTTPS endpoints and App Review for public production deployment.',
    },
  }[provider];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#111827] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-card-hover border border-[#EAECF0] dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="social-auth-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#EAECF0] dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 id="social-auth-title" className="text-base font-bold text-[#172033] dark:text-slate-100">
                {providerDetails.name} Configuration
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Single Sign-On Integration Notice
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-slate-100 hover:bg-[#F7F8FC] dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3 text-xs text-[#172033] dark:text-slate-100">
          <p className="leading-relaxed text-[#667085] dark:text-slate-400">
            Real social authentication with <strong className="text-[#172033] dark:text-slate-200">{provider}</strong> requires external identity provider credentials that are not yet provisioned in this environment. WishMarket does not simulate fake logins without actual verification.
          </p>

          {/* Required Configuration Checklist */}
          <div className="bg-[#F7F8FC] dark:bg-slate-800/70 rounded-xl p-3.5 border border-[#EAECF0] dark:border-slate-700 space-y-2">
            <span className="font-bold text-[#172033] dark:text-slate-200 text-[11px] uppercase tracking-wider block">
              Required Setup for {provider}:
            </span>
            <ul className="space-y-1.5">
              {providerDetails.requiredItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[#5B6B82] dark:text-slate-300">
                  <Key className="w-3.5 h-3.5 text-[#4F86D9] dark:text-sky-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Environment Variable Hint */}
          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-xl space-y-1 text-amber-900 dark:text-amber-200 text-[11px]">
            <span className="font-bold block">Environment Variable:</span>
            <code className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 font-mono text-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 inline-block">
              {providerDetails.envVar}="YOUR_{provider.toUpperCase()}_CLIENT_ID"
            </code>
            <p className="text-amber-800 dark:text-amber-300 pt-0.5">
              {providerDetails.securityNote}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#EAECF0] dark:border-slate-800 flex items-center justify-between gap-2">
          <a
            href={providerDetails.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-[#4F86D9] dark:text-sky-400 hover:text-[#3568B5] dark:hover:text-sky-300 flex items-center gap-1.5"
          >
            <span>{provider} Developer Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#172033] dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold transition cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
