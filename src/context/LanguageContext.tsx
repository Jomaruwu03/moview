'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'es' | 'en';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  es: {
    'sidebar.review': 'Reseñas',
    'sidebar.top5': 'Top Personal',
    'sidebar.lists': 'Mis Colecciones',
    'sidebar.daily': 'Película Diaria',
    'sidebar.profile': 'Perfil',
    'sidebar.logout': 'Cerrar Sesión',
    'sidebar.admin': 'Administración',
    'search.placeholder': 'Buscar una película...',
    'search.no_results': 'No se encontraron resultados',
    'top5.title': 'Mi Top Personal',
    'top5.export': 'Exportar como Imagen',
    'top5.empty': 'Aún no has agregado películas a tu top.',
    'top5.add': 'Añadir al Top',
    'review.title': 'Escribe tu Reseña',
    'review.publish': 'Exportar Reseña',
    'profile.title': 'Tu Perfil',
    'profile.update': 'Actualizar',
    'profile.password': 'Nueva Contraseña',
    'profile.confirm': 'Confirmar Contraseña',
  },
  en: {
    'sidebar.review': 'Reviews',
    'sidebar.top5': 'Personal Top',
    'sidebar.lists': 'My Collections',
    'sidebar.daily': 'Daily Movie',
    'sidebar.profile': 'Profile',
    'sidebar.logout': 'Sign Out',
    'sidebar.admin': 'Management',
    'search.placeholder': 'Search for a movie...',
    'search.no_results': 'No results found',
    'top5.title': 'My Personal Top',
    'top5.export': 'Export as Image',
    'top5.empty': 'You have not added any movies to your top yet.',
    'top5.add': 'Add to Top',
    'review.title': 'Write your Review',
    'review.publish': 'Export Review',
    'profile.title': 'Your Profile',
    'profile.update': 'Update',
    'profile.password': 'New Password',
    'profile.confirm': 'Confirm Password',
  }
};

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es');

  useEffect(() => {
    const saved = localStorage.getItem('app_lang') as Language;
    if (saved && (saved === 'es' || saved === 'en')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_lang', lang);
  };

  const t = (key: string): string => {
    const langObj = translations[language] as Record<string, string>;
    return langObj[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
