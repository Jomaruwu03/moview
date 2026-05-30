'use client';

import { useState } from 'react';
import { ReviewBuilder } from '@/components/ReviewBuilder';
import { TopMovies } from '@/components/TopMovies';
import { DailyRecommendation } from '@/components/DailyRecommendation';
import { AdminPanel } from '@/components/AdminPanel';
import { Clapperboard, Star, User, LogOut, Menu, X, Languages, Calendar, Cat, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';

type Tab = 'review' | 'top5' | 'daily' | 'profile' | 'admin';

export function DashboardClient({ user }: { user: any }) {
  const [currentUser, setCurrentUser] = useState(user);
  const [activeTab, setActiveTab] = useState<Tab>('review');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  const { language, setLanguage, t } = useLanguage();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const tabs = [
    { id: 'review', label: t('sidebar.review'), icon: Star },
    { id: 'top5', label: t('sidebar.top5'), icon: Clapperboard },
    { id: 'daily', label: t('sidebar.daily'), icon: Calendar },
    { id: 'profile', label: t('sidebar.profile'), icon: User },
  ];

  if (currentUser.is_admin) {
    tabs.splice(3, 0, { id: 'admin', label: t('sidebar.admin'), icon: Shield });
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-background font-body selection:bg-primary/30">
      {/* Top Navigation Shell */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/50 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-4 md:px-margin-desktop py-4">
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
            {tabs.filter(t => t.id !== 'profile').map((tab) => (
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

        <div className="flex items-center gap-6 md:gap-8">
          <button 
            onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
            className="text-primary/60 hover:text-primary text-xs font-bold transition-colors flex items-center gap-2"
          >
            <Languages className="w-4 h-4 opacity-40" />
            {language === 'es' ? 'EN' : 'ES'}
          </button>
          
          <div className="w-px h-4 bg-white/10"></div>
          
          <button 
            onClick={() => {
              setConfirmModal({
                isOpen: true,
                title: language === 'es' ? 'Cerrar Sesión' : 'Sign Out',
                message: language === 'es' ? '¿Estás seguro de que deseas abandonar la sesión actual?' : 'Are you sure you want to leave the current session?',
                onConfirm: () => {
                  const form = document.createElement('form');
                  form.action = '/auth/signout';
                  form.method = 'post';
                  document.body.appendChild(form);
                  form.submit();
                }
              });
            }}
            className="text-on-surface-variant hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Custom Confirmation Modal */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setConfirmModal(null)}></div>
          <div className="glass-card border border-white/10 p-8 md:p-12 rounded-[2.5rem] max-w-md w-full relative z-10 shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 cubic-out">
            <div className="w-12 h-[1px] bg-primary/30 mb-8"></div>
            <h3 className="font-display text-3xl text-white italic mb-4">{confirmModal.title}</h3>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-10 opacity-80">{confirmModal.message}</p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-4 border-[0.5px] border-white/5 font-body text-[10px] uppercase tracking-[0.2em] text-on-surface-variant hover:bg-white/5 transition-all duration-300"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button 
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="flex-1 py-4 border-[0.5px] border-primary/40 bg-primary/5 font-body text-[10px] uppercase tracking-[0.2em] text-primary hover:bg-primary hover:text-on-primary transition-all duration-500"
              >
                {language === 'es' ? 'Confirmar' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pt-24 md:pt-32 pb-32 md:pb-12 max-w-container-max mx-auto w-full px-4 md:px-margin-desktop">
        {activeTab === 'review' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 cubic-out">
            <div className="mb-12 flex flex-col items-center text-center">
              <span className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-4">{language === 'es' ? 'Crea Contenido' : 'Create Content'}</span>
              <h2 className="font-display text-4xl md:text-display-lg italic">{language === 'es' ? 'Constructor de Reseñas' : 'Review Builder'}</h2>
              <div className="w-12 h-[1px] bg-primary/30 mt-8"></div>
            </div>
            <ReviewBuilder user={currentUser} />
          </div>
        )}
        
        {activeTab === 'top5' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 cubic-out">
            <div className="mb-12 flex flex-col items-center text-center">
              <span className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-4">{language === 'es' ? 'Selección Personal' : 'Personal Selection'}</span>
              <h2 className="font-display text-4xl md:text-display-lg italic">{language === 'es' ? 'Tus 5 Obras Maestras' : 'Top 5 Masterpieces'}</h2>
              <div className="w-12 h-[1px] bg-primary/30 mt-8"></div>
            </div>
            <TopMovies user={currentUser} />
          </div>
        )}

        {activeTab === 'daily' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 cubic-out">
            <DailyRecommendation user={currentUser} />
          </div>
        )}

        {activeTab === 'admin' && currentUser.is_admin && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 cubic-out">
            <AdminPanel language={language} currentUserId={currentUser.id} />
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
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-12 border-b border-white/5 pb-8">
                <div className="relative group shrink-0">
                  <img 
                    src={currentUser.avatar_url && currentUser.avatar_url.includes('/cats/') 
                      ? currentUser.avatar_url.replace('/cats/', '/avataaars/') 
                      : (currentUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`)} 
                    className="w-24 h-24 rounded-full border border-white/10 object-cover" 
                  />
                  <div className="absolute inset-0 bg-primary/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="font-display text-3xl text-white break-all">@{currentUser.username}</h3>
                  <p className="font-body text-xs uppercase tracking-widest text-on-surface-variant mt-1 flex flex-wrap justify-center sm:justify-start items-center gap-2">
                    {language === 'es' ? 'Mecenas de MeoWiew' : 'MeoWiew Patron'}
                    {currentUser.is_admin && (
                      <span className="bg-primary/20 text-primary border border-primary/30 text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" />
                        Admin
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="group">
                  <label className="block font-body text-xs uppercase tracking-widest text-on-surface-variant mb-3">{language === 'es' ? 'Identidad' : 'Identity'}</label>
                  <div className="bg-white/5 border border-white/10 rounded p-4 text-on-surface/60 font-body">
                    @{currentUser.username}
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
                      
                      setConfirmModal({
                        isOpen: true,
                        title: language === 'es' ? 'Actualizar Seguridad' : 'Update Security',
                        message: language === 'es' ? 'Tu sesión se mantendrá activa, pero deberás usar la nueva contraseña la próxima vez que ingreses.' : 'Your session will remain active, but you must use the new password the next time you log in.',
                        onConfirm: async () => {
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
                        }
                      });
                    }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block font-body text-xs uppercase tracking-widest text-on-surface-variant">{language === 'es' ? 'Nueva Contraseña' : 'New Password'}</label>
                        <input type="password" name="password" minLength={6} required className="w-full bg-white/5 border border-white/10 rounded p-4 text-white focus:border-primary outline-none transition-colors font-body" />
                      </div>
                      <div className="space-y-2">
                        <label className="block font-body text-xs uppercase tracking-widest text-on-surface-variant">{language === 'es' ? 'Confirmar Contraseña' : 'Confirm Password'}</label>
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
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-2xl border-t border-white/5 shadow-[0_-10px_40px_rgba(212,178,255,0.05)] flex justify-around items-center h-20 px-4 md:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`${isActive ? 'text-primary' : 'text-on-surface-variant opacity-60'} relative transition-all duration-500 group flex flex-col items-center`}
            >
              <Icon className={`w-6 h-6 group-active:scale-90 transition-transform duration-200 ${isActive ? 'text-primary' : ''}`} />
              {isActive && (
                <div className="absolute -bottom-2 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(212,178,255,0.8)]"></div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
);
}
