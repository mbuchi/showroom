import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Locale } from '@swissnovo/shared';

/**
 * Translation table for the showroom UI shell. Each key resolves to the
 * matching string in the active locale; missing keys fall back to English.
 * First pass covers the navbar shell only — the gallery, reporter widgets and
 * lightbox copy still display in English; extend `translations` to grow.
 */
const translations: Record<Locale, Record<string, string>> = {
  en: {
    'nav.search_placeholder': 'Search exports, addresses, parcel IDs…',
    'nav.select_language': 'Select language',
  },
  fr: {
    'nav.search_placeholder': 'Rechercher exports, adresses, ID parcelles…',
    'nav.select_language': 'Sélectionner la langue',
  },
  de: {
    'nav.search_placeholder': 'Exporte, Adressen, Parzellen-IDs suchen…',
    'nav.select_language': 'Sprache wählen',
  },
  it: {
    'nav.search_placeholder': 'Cerca export, indirizzi, ID parcelle…',
    'nav.select_language': 'Seleziona lingua',
  },
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const SUPPORTED_LOCALES: Locale[] = ['en', 'fr', 'de', 'it'];
const STORAGE_KEY = 'showroom:locale';

function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && SUPPORTED_LOCALES.includes(saved)) return saved;
  } catch {
    // localStorage may be disabled — fall through to browser/default.
  }
  const browserLang = navigator.language.slice(0, 2).toLowerCase() as Locale;
  return SUPPORTED_LOCALES.includes(browserLang) ? browserLang : 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore — locale is best-effort persisted.
    }
  }, [locale]);

  const setLocale = (next: Locale) => {
    if (SUPPORTED_LOCALES.includes(next)) setLocaleState(next);
  };

  const t = (key: string): string =>
    translations[locale]?.[key] ?? translations.en[key] ?? key;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}
