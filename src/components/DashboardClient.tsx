'use client';

import { useState } from 'react';
import { ReviewBuilder } from '@/components/ReviewBuilder';
import { TopMovies } from '@/components/TopMovies';
import { DailyRecommendation } from '@/components/DailyRecommendation';
import { Film, Star, User, LogOut, Menu, X, Languages, Calendar, Cat } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';

type Tab = 'review' | 'top5' | 'daily' | 'profile';

export function DashboardClient({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<Tab>('review');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const tabs = [
    { id: 'review', label: t('sidebar.review'), icon: Star },
    { id: 'top5', label: t('sidebar.top5'), icon: Film },
    { id: 'daily', label: t('sidebar.daily'), icon: Calendar },
    { id: 'profile', label: t('sidebar.profile'), icon: User },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-background font-body selection:bg-primary/30">
      {/* Top Navigation Shell */}
      <header className="fixed top-0 w-full z-50 bg-surface/50 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-4 md:px-margin-desktop py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Cat className="w-6 h-6 text-primary" />
            <h1 className="font-display text-2xl md:text-headline-lg uppercase tracking-widest text-primary">
              MEOWIEW
            </h1>
          </div>
        </div>
        
        <div className="hidden md:flex gap-8 items-center">
          <nav className="flex gap-12">
            {tabs.slice(0, 3).map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`font-body text-xs uppercase tracking-[0.2em] transition-colors duration-500 ${activeTab === tab.id ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="w-px h-4 bg-white/10 mx-2"></div>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`font-body text-xs uppercase tracking-[0.2em] transition-colors duration-500 ${activeTab === 'profile' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
          >
            {t('sidebar.profile')}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
            className="text-primary/60 hover:text-primary text-xs font-bold transition-colors"
          >
            {language === 'es' ? 'EN' : 'ES'}
          </button>
          <form action="/auth/signout" method="post" className="flex items-center">
            <button className="text-on-surface-variant hover:text-red-400 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-24 md:pt-32 pb-32 md:pb-12 max-w-container-max mx-auto w-full px-4 md:px-margin-desktop">
        {activeTab === 'review' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 cubic-out">
            <div className="mb-12 flex flex-col items-center text-center">
              <span className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-4">{language === 'es' ? 'Crea Contenido' : 'Create Content'}</span>
              <h2 className="font-display text-4xl md:text-display-lg italic">{language === 'es' ? 'Constructor de Reseñas' : 'Review Builder'}</h2>
              <div className="w-12 h-[1px] bg-primary/30 mt-8"></div>
            </div>
            <ReviewBuilder user={user} />
          </div>
        )}
        
        {activeTab === 'top5' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 cubic-out">
            <div className="mb-12 flex flex-col items-center text-center">
              <span className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-4">{language === 'es' ? 'Selección Personal' : 'Personal Selection'}</span>
              <h2 className="font-display text-4xl md:text-display-lg italic">{language === 'es' ? 'Tus 5 Obras Maestras' : 'Top 5 Masterpieces'}</h2>
              <div className="w-12 h-[1px] bg-primary/30 mt-8"></div>
            </div>
            <TopMovies user={user} />
          </div>
        )}

        {activeTab === 'daily' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 cubic-out">
            <DailyRecommendation user={user} />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 cubic-out max-w-2xl mx-auto">
            <div className="mb-12 flex flex-col items-center text-center">
              <span className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-4">{language === 'es' ? 'Configuración' : 'Settings'}</span>
              <h2 className="font-display text-4xl md:text-display-lg italic">{t('sidebar.profile')}</h2>
              <div className="w-12 h-[1px] bg-primary/30 mt-8"></div>
            </div>
            
            <div className="glass-card p-8 rounded-lg">
              <div className="flex items-center gap-6 mb-12 border-b border-white/5 pb-8">
                <div className="relative group">
                  <img src={user.avatar_url} className="w-24 h-24 rounded-full border border-white/10 object-cover" />
                  <div className="absolute inset-0 bg-primary/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div>
                  <h3 className="font-display text-3xl text-white">@{user.username}</h3>
                  <p className="font-body text-xs uppercase tracking-widest text-on-surface-variant mt-1">{language === 'es' ? 'Mecenas de MeoWiew' : 'MeoWiew Patron'}</p>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="group">
                  <label className="block font-body text-xs uppercase tracking-widest text-on-surface-variant mb-3">{language === 'es' ? 'Identidad' : 'Identity'}</label>
                  <div className="bg-white/5 border border-white/10 rounded p-4 text-on-surface/60 font-body">
                    @{user.username}
                  </div>
                </div>
                
                <div className="pt-8 border-t border-white/5">
                  <h4 className="font-display text-2xl mb-6">{language === 'es' ? 'Seguridad y Llaves' : 'Security & Keys'}</h4>
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const password = formData.get('password') as string;
                      const confirmPassword = formData.get('confirmPassword') as string;
                      
                      if (!password || password.length < 6) return toast.error(language === 'es' ? 'Contraseña inválida' : 'Invalid Password');
                      if (password !== confirmPassword) return toast.error(language === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match');
                      
                      setIsUpdatingPassword(true);
                      try {
                        const { createClient } = await import('@/utils/supabase/client');
                        const supabase = createClient();
                        const { error } = await supabase.auth.updateUser({ password });
                        if (error) toast.error(error.message);
                        else {
                          toast.success(language === 'es' ? '¡Actualizado!' : 'Updated!');
                          (e.target as HTMLFormElement).reset();
                        }
                      } finally {
                        setIsUpdatingPassword(false);
                      }
                    }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block font-body text-xs uppercase tracking-widest text-on-surface-variant">{language === 'es' ? 'Nueva' : 'New'}</label>
                        <input type="password" name="password" minLength={6} required className="w-full bg-white/5 border border-white/10 rounded p-4 text-white focus:border-primary outline-none transition-colors font-body" />
                      </div>
                      <div className="space-y-2">
                        <label className="block font-body text-xs uppercase tracking-widest text-on-surface-variant">{language === 'es' ? 'Confirmar' : 'Confirm'}</label>
                        <input type="password" name="confirmPassword" minLength={6} required className="w-full bg-white/5 border border-white/10 rounded p-4 text-white focus:border-primary outline-none transition-colors font-body" />
                      </div>
                    </div>
                    
                    <button 
                      disabled={isUpdatingPassword}
                      type="submit"
                      className="w-full py-4 border-[0.5px] border-primary/30 font-body text-xs uppercase tracking-[0.2em] text-on-surface hover:bg-primary hover:text-on-primary hover:border-primary transition-all duration-500 cubic-out"
                    >
                      {isUpdatingPassword ? '...' : (language === 'es' ? 'Actualizar Seguridad' : 'Update Security')}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation NavBar (Mobile only) */}
      <nav className="fixed bottom-0 w-full z-50 bg-surface/80 backdrop-blur-2xl border-t border-white/5 shadow-[0_-10px_40px_rgba(236,178,255,0.05)] flex justify-around items-center h-20 px-4 md:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`${isActive ? 'text-primary' : 'text-on-surface-variant opacity-60'} relative transition-all duration-500 group flex flex-col items-center`}
            >
              <Icon className={`w-6 h-6 group-active:scale-90 transition-transform duration-200 ${isActive ? 'fill-primary' : ''}`} />
              {isActive && (
                <div className="absolute -bottom-2 w-1 h-1 bg-primary rounded-full"></div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
);
}
