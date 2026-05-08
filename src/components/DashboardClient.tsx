'use client';

import { useState } from 'react';
import { ReviewBuilder } from '@/components/ReviewBuilder';
import { TopMovies } from '@/components/TopMovies';
import { Film, Star, User, LogOut, Menu, X, Languages } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';

type Tab = 'review' | 'top5' | 'profile';

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
    { id: 'profile', label: t('sidebar.profile'), icon: User },
  ];

  return (
    <div className="flex min-h-screen bg-neutral-950 text-white font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-neutral-900 border-r border-neutral-800
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            MoView
          </h1>
          <button onClick={closeSidebar} className="lg:hidden text-neutral-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="flex items-center gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
            <img 
              src={user.avatar_url} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full bg-neutral-800 shrink-0"
            />
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">@{user.username}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as Tab); closeSidebar(); }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-white border border-transparent'}
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : 'text-neutral-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-800">
          <button
            onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-all mb-2"
          >
            <div className="flex items-center gap-3">
              <Languages className="w-5 h-5 opacity-70" />
              {language === 'es' ? 'Idioma: Español' : 'Language: English'}
            </div>
            <span className="text-xs font-bold bg-neutral-950 px-2 py-1 rounded border border-neutral-800 text-neutral-500">
              {language === 'es' ? 'ES' : 'EN'}
            </span>
          </button>
          <form action="/auth/signout" method="post">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
              <LogOut className="w-5 h-5 opacity-70" />
              {t('sidebar.logout')}
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="lg:hidden p-4 border-b border-neutral-800 flex items-center justify-between sticky top-0 bg-neutral-950/80 backdrop-blur-md z-30">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            MoView
          </h1>
          <button onClick={toggleSidebar} className="p-2 bg-neutral-900 rounded-lg border border-neutral-800">
            <Menu className="w-5 h-5 text-neutral-300" />
          </button>
        </header>

        <div className="p-6 md:p-8 max-w-6xl w-full mx-auto">
          {activeTab === 'review' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">{language === 'es' ? 'Crear Reseña' : 'Create Review'}</h2>
                <p className="text-neutral-400">{language === 'es' ? 'Busca una película y genera un widget personalizado para compartir.' : 'Search for a movie and generate a custom widget to share.'}</p>
              </div>
              <ReviewBuilder user={user} />
            </div>
          )}
          
          {activeTab === 'top5' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">{language === 'es' ? 'Top 5 Películas' : 'Top 5 Movies'}</h2>
                <p className="text-neutral-400">{language === 'es' ? 'Selecciona tus favoritas y comparte tu cartelera.' : 'Select your favorites and share your billboard.'}</p>
              </div>
              <TopMovies user={user} />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">{t('sidebar.profile')}</h2>
                <p className="text-neutral-400">{language === 'es' ? 'Configura tus datos de usuario y seguridad.' : 'Configure your user and security data.'}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 max-w-2xl">
                <div className="flex items-center gap-6 mb-8">
                  <img src={user.avatar_url} className="w-24 h-24 rounded-full border-4 border-neutral-800 object-cover" />
                  <div>
                    <h3 className="text-2xl font-bold text-white">@{user.username}</h3>
                    <p className="text-neutral-400">Usuario de MoView</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-neutral-500 mb-1">Nombre de usuario</label>
                    <input type="text" readOnly value={user.username} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-300 cursor-not-allowed outline-none" />
                  </div>
                  
                  <div className="pt-6 border-t border-neutral-800">
                    <h4 className="text-lg font-bold mb-4">Seguridad</h4>
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const password = formData.get('password') as string;
                        const confirmPassword = formData.get('confirmPassword') as string;
                        
                        if (!password || password.length < 6) return toast.error('Contraseña inválida', { description: 'La contraseña debe tener al menos 6 caracteres' });
                        if (password !== confirmPassword) return toast.error('Las contraseñas no coinciden', { description: 'Asegúrate de escribir la misma contraseña en ambos campos' });
                        
                        setIsUpdatingPassword(true);
                        try {
                          const { createClient } = await import('@/utils/supabase/client');
                          const supabase = createClient();
                          const { error } = await supabase.auth.updateUser({ password });
                          
                          if (error) {
                            toast.error('Error al actualizar', { description: error.message });
                          } else {
                            toast.success('¡Contraseña actualizada!', { description: 'Tu contraseña se ha cambiado con éxito.' });
                            (e.target as HTMLFormElement).reset();
                          }
                        } finally {
                          setIsUpdatingPassword(false);
                        }
                      }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-neutral-500 mb-1">Nueva Contraseña</label>
                          <input 
                            type="password" 
                            name="password"
                            placeholder="Mínimo 6 caracteres"
                            minLength={6}
                            required
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-colors" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-neutral-500 mb-1">Confirmar Contraseña</label>
                          <input 
                            type="password" 
                            name="confirmPassword"
                            placeholder="Repite la contraseña"
                            minLength={6}
                            required
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-colors" 
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end pt-2">
                        <button 
                          disabled={isUpdatingPassword}
                          type="submit"
                          className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                          {isUpdatingPassword ? 'Actualizando...' : 'Cambiar Contraseña'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
