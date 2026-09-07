export const LANG_STORAGE_KEY = 'dv-lang';

export const SUPPORTED_LANGS = ['fr', 'en'] as const;

export type Lang = (typeof SUPPORTED_LANGS)[number];

export const DEFAULT_LANG: Lang = 'en';

function isLang(value: string): value is Lang {
  return (SUPPORTED_LANGS as readonly string[]).includes(value);
}

export function getLangFromPathname(pathname: string): Lang {
  return pathname === '/fr' || pathname.startsWith('/fr/') ? 'fr' : 'en';
}

export function getAlternatePathname(pathname: string, targetLang: Lang): string {
  const isFr = getLangFromPathname(pathname) === 'fr';
  if (targetLang === 'fr') {
    return isFr ? pathname : `/fr${pathname}`;
  }
  return isFr ? pathname.replace(/^\/fr/, '') || '/' : pathname;
}

export function detectBrowserLang(): Lang {
  const candidates = navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language];

  const match = candidates
    .map((locale) => locale.slice(0, 2).toLowerCase())
    .find(isLang);

  return match ?? DEFAULT_LANG;
}
