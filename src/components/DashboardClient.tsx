'use client';

import { useState, useEffect } from 'react';
import { ReviewBuilder } from '@/components/ReviewBuilder';
import { TopMovies } from '@/components/TopMovies';
import { CustomLists } from '@/components/CustomLists';
import { DailyRecommendation } from '@/components/DailyRecommendation';
import { AdminPanel } from '@/components/AdminPanel';
import { Clapperboard, Star, User, LogOut, Menu, X, Languages, Calendar, Cat, Shield, List, Camera, Copy, UserPlus, UserMinus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';

type Tab = 'review' | 'top5' | 'lists' | 'daily' | 'profile' | 'admin' | 'community';

export function DashboardClient({ user, initialTab }: { user: any; initialTab?: string }) {
  const [currentUser, setCurrentUser] = useState(user);
  const [activeTab, setActiveTab] = useState<Tab>((initialTab as Tab) || 'review');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  const { language, setLanguage, t } = useLanguage();

  // Social / Followers states
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [searchUsername, setSearchUsername] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Community tab lists and loading state
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [isLoadingSocial, setIsLoadingSocial] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const fetchFollowsCount = async () => {
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      const { count: followers, error: err1 } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', currentUser.id);
        
      const { count: following, error: err2 } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', currentUser.id);
        
      if (!err1 && !err2) {
        setFollowerCount(followers || 0);
        setFollowingCount(following || 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSocialDetails = async () => {
    setIsLoadingSocial(true);
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      const { data: followingData, error: err1 } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUser.id);
        
      const { data: followersData, error: err2 } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', currentUser.id);
        
      if (err1) throw err1;
      if (err2) throw err2;
      
      const followingIds = followingData?.map(f => f.following_id) || [];
      const followerIds = followersData?.map(f => f.follower_id) || [];
      
      let followingProfiles: any[] = [];
      if (followingIds.length > 0) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', followingIds);
        if (!error && data) {
          followingProfiles = data.map(p => ({ ...p, isFollowing: true }));
        }
      }
      
      let followerProfiles: any[] = [];
      if (followerIds.length > 0) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', followerIds);
        if (!error && data) {
          followerProfiles = data.map(p => ({
            ...p,
            isFollowing: followingIds.includes(p.id)
          }));
        }
      }
      
      setFollowingList(followingProfiles);
      setFollowersList(followerProfiles);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSocial(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'profile' || activeTab === 'community') {
      fetchFollowsCount();
    }
    if (activeTab === 'community') {
      fetchSocialDetails();
    }
  }, [activeTab, currentUser.id]);

  const searchUsers = async (val: string) => {
    if (!val.trim()) {
      setUserSearchResults([]);
      return;
    }
    setIsSearchingUsers(true);
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .neq('id', currentUser.id)
        .ilike('username', `%${val.trim()}%`)
        .limit(10);
        
      if (error) throw error;
      
      const formattedResults = [];
      for (const u of data || []) {
        const { data: isFollowing } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', currentUser.id)
          .eq('following_id', u.id)
          .maybeSingle();
          
        formattedResults.push({
          ...u,
          isFollowing: !!isFollowing
        });
      }
      setUserSearchResults(formattedResults);
    } catch (err: any) {
      console.error(err);
      toast.error(language === 'es' ? 'Error al buscar usuarios' : 'Failed to search users');
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleFollowToggle = async (targetUser: any) => {
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      if (targetUser.isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', targetUser.id);
          
        if (error) throw error;
        toast.success(language === 'es' ? `Dejaste de seguir a @${targetUser.username}` : `Unfollowed @${targetUser.username}`);
        setUserSearchResults(prev => prev.map(u => u.id === targetUser.id ? { ...u, isFollowing: false } : u));
        fetchFollowsCount();
        fetchSocialDetails();
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: targetUser.id
          });
          
        if (error) throw error;
        toast.success(language === 'es' ? `Ahora sigues a @${targetUser.username}` : `Now following @${targetUser.username}`);
        setUserSearchResults(prev => prev.map(u => u.id === targetUser.id ? { ...u, isFollowing: true } : u));
        fetchFollowsCount();
        fetchSocialDetails();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingAvatar(true);
    const toastId = toast.loading(language === 'es' ? 'Procesando imagen...' : 'Processing image...');
    
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 256;
          const MAX_HEIGHT = 256;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const base64Data = canvas.toDataURL('image/jpeg', 0.7);
          
          const { createClient } = await import('@/utils/supabase/client');
          const supabase = createClient();
          const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: base64Data })
            .eq('id', currentUser.id);
            
          if (error) throw error;
          
          setCurrentUser((prev: any) => ({ ...prev, avatar_url: base64Data }));
          toast.success(language === 'es' ? '¡Foto de perfil actualizada!' : 'Profile picture updated!', { id: toastId });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      toast.error(language === 'es' ? 'Error al actualizar imagen' : 'Failed to update image', { id: toastId, description: err.message });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/profile/${currentUser.username}`;
    navigator.clipboard.writeText(profileUrl);
    toast.success(language === 'es' ? '¡Enlace de perfil copiado al portapapeles!' : 'Profile link copied to clipboard!');
  };

  const tabs = [
    { id: 'review', label: t('sidebar.review'), icon: Star },
    { id: 'top5', label: t('sidebar.top5'), icon: Clapperboard },
    { id: 'lists', label: t('sidebar.lists'), icon: List },
    { id: 'daily', label: t('sidebar.daily'), icon: Calendar },
    { id: 'community', label: language === 'es' ? 'Comunidad' : 'Community', icon: Users },
    { id: 'profile', label: t('sidebar.profile'), icon: User },
  ];

  if (currentUser.is_admin) {
    tabs.splice(4, 0, { id: 'admin', label: t('sidebar.admin'), icon: Shield });
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

        {activeTab === 'lists' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 cubic-out">
            <CustomLists user={currentUser} />
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

        {activeTab === 'community' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 cubic-out">
            <div className="mb-12 flex flex-col items-center text-center">
              <span className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-4">
                {language === 'es' ? 'Comunidad de Críticos' : 'Critics Community'}
              </span>
              <h2 className="font-display text-4xl md:text-display-lg italic">
                {language === 'es' ? 'Descubre y Conecta' : 'Discover & Connect'}
              </h2>
              <div className="w-12 h-[1px] bg-primary/30 mt-8"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Buscador de Usuarios */}
              <div className="lg:col-span-6 glass-card p-8 rounded-3xl border border-white/5 space-y-6">
                <h3 className="font-display text-2xl italic text-white mb-2">
                  {language === 'es' ? 'Buscar Críticos' : 'Search Critics'}
                </h3>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={searchUsername}
                    onChange={(e) => {
                      setSearchUsername(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    placeholder={language === 'es' ? 'Escribe un nombre de usuario...' : 'Type a username...'}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 font-body text-sm text-white focus:border-primary outline-none transition-colors"
                  />
                </div>

                {isSearchingUsers ? (
                  <div className="text-center py-6 font-body text-xs text-on-surface-variant/60">
                    {language === 'es' ? 'Buscando...' : 'Searching...'}
                  </div>
                ) : userSearchResults.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {userSearchResults.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-all border border-white/5">
                        <div className="flex items-center gap-3">
                          <img 
                            src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} 
                            className="w-10 h-10 rounded-full border border-white/10 object-cover" 
                          />
                          <a 
                            href={`/profile/${u.username}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="font-display text-lg text-white hover:text-primary transition-colors italic"
                          >
                            @{u.username}
                          </a>
                        </div>
                        <button
                          onClick={() => handleFollowToggle(u)}
                          className={`px-4 py-2 rounded-xl font-body text-[9px] uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5 border ${
                            u.isFollowing 
                              ? 'border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500' 
                              : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-black hover:border-primary'
                          }`}
                        >
                          {u.isFollowing ? (
                            <>
                              <UserMinus className="w-3.5 h-3.5" />
                              {language === 'es' ? 'Dejar de seguir' : 'Unfollow'}
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" />
                              {language === 'es' ? 'Seguir' : 'Follow'}
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : searchUsername.trim() !== '' ? (
                  <p className="font-body text-xs text-on-surface-variant/40 italic ml-2">
                    {language === 'es' ? 'No se encontraron usuarios.' : 'No users found.'}
                  </p>
                ) : (
                  <p className="font-body text-xs text-on-surface-variant/40 italic ml-2">
                    {language === 'es' ? 'Busca creadores para ver sus colecciones y críticas.' : 'Search for creators to see their collections and reviews.'}
                  </p>
                )}
              </div>

              {/* Listas Sociales (Seguidos y Seguidores) */}
              <div className="lg:col-span-6 space-y-8">
                {/* Siguiendo (Following) */}
                <div className="glass-card p-8 rounded-3xl border border-white/5 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-display text-2xl italic text-white">
                      {language === 'es' ? 'Siguiendo' : 'Following'}
                    </h3>
                    <span className="font-body text-xs text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full font-bold">
                      {followingCount}
                    </span>
                  </div>

                  {isLoadingSocial ? (
                    <div className="text-center py-6 font-body text-xs text-on-surface-variant/60">
                      {language === 'es' ? 'Cargando...' : 'Loading...'}
                    </div>
                  ) : followingList.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {followingList.map((u) => (
                        <div key={u.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-all border border-white/5">
                          <div className="flex items-center gap-3">
                            <img 
                              src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} 
                              className="w-10 h-10 rounded-full border border-white/10 object-cover" 
                            />
                            <a 
                              href={`/profile/${u.username}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="font-display text-lg text-white hover:text-primary transition-colors italic"
                            >
                              @{u.username}
                            </a>
                          </div>
                          <button
                            onClick={() => handleFollowToggle(u)}
                            className="px-4 py-2 rounded-xl font-body text-[9px] uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5 border border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            {language === 'es' ? 'Dejar de seguir' : 'Unfollow'}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="font-body text-xs text-on-surface-variant/40 italic ml-2">
                      {language === 'es' ? 'No sigues a ningún usuario todavía.' : 'You are not following any users yet.'}
                    </p>
                  )}
                </div>

                {/* Seguidores (Followers) */}
                <div className="glass-card p-8 rounded-3xl border border-white/5 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-display text-2xl italic text-white">
                      {language === 'es' ? 'Seguidores' : 'Followers'}
                    </h3>
                    <span className="font-body text-xs text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full font-bold">
                      {followerCount}
                    </span>
                  </div>

                  {isLoadingSocial ? (
                    <div className="text-center py-6 font-body text-xs text-on-surface-variant/60">
                      {language === 'es' ? 'Cargando...' : 'Loading...'}
                    </div>
                  ) : followersList.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {followersList.map((u) => (
                        <div key={u.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-all border border-white/5">
                          <div className="flex items-center gap-3">
                            <img 
                              src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} 
                              className="w-10 h-10 rounded-full border border-white/10 object-cover" 
                            />
                            <a 
                              href={`/profile/${u.username}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="font-display text-lg text-white hover:text-primary transition-colors italic"
                            >
                              @{u.username}
                            </a>
                          </div>
                          <button
                            onClick={() => handleFollowToggle(u)}
                            className={`px-4 py-2 rounded-xl font-body text-[9px] uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5 border ${
                              u.isFollowing 
                                ? 'border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500' 
                                : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-black hover:border-primary'
                            }`}
                          >
                            {u.isFollowing ? (
                              <>
                                <UserMinus className="w-3.5 h-3.5" />
                                {language === 'es' ? 'Dejar de seguir' : 'Unfollow'}
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5" />
                                {language === 'es' ? 'Seguir de vuelta' : 'Follow back'}
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="font-body text-xs text-on-surface-variant/40 italic ml-2">
                      {language === 'es' ? 'Aún no tienes seguidores.' : 'You have no followers yet.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 cubic-out max-w-2xl mx-auto">
            <div className="mb-12 flex flex-col items-center text-center">
              <span className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-4">{language === 'es' ? 'Configuración' : 'Settings'}</span>
              <h2 className="font-display text-4xl md:text-display-lg italic">{t('sidebar.profile')}</h2>
              <div className="w-12 h-[1px] bg-primary/30 mt-8"></div>
            </div>
            
            <div className="glass-card p-8 rounded-3xl border border-white/5 space-y-10">
              {/* Profile Avatar Card */}
              <div className="flex flex-col sm:flex-row items-center gap-8 border-b border-white/5 pb-8">
                <div className="relative group shrink-0 w-24 h-24">
                  <img 
                    src={currentUser.avatar_url && currentUser.avatar_url.includes('/cats/') 
                      ? currentUser.avatar_url.replace('/cats/', '/avataaars/') 
                      : (currentUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`)} 
                    className="w-24 h-24 rounded-full border border-white/10 object-cover shadow-2xl transition-all group-hover:opacity-40" 
                  />
                  <label className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Camera className="w-6 h-6 text-white" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarChange} 
                      disabled={isUploadingAvatar}
                      className="hidden" 
                    />
                  </label>
                </div>
                <div className="text-center sm:text-left flex-1 min-w-0">
                  <h3 className="font-display text-3xl text-white break-all mb-1">@{currentUser.username}</h3>
                  <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 text-xs font-body text-on-surface-variant mb-3">
                    <div className="flex gap-1.5">
                      <span className="font-bold text-white">{followerCount}</span>
                      <span>{language === 'es' ? 'seguidores' : 'followers'}</span>
                    </div>
                    <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                    <div className="flex gap-1.5">
                      <span className="font-bold text-white">{followingCount}</span>
                      <span>{language === 'es' ? 'seguidos' : 'following'}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-3 items-center">
                    <button
                      onClick={handleShareProfile}
                      className="px-4 py-1.5 border border-white/10 rounded-full font-body text-[9px] uppercase tracking-widest text-on-surface-variant hover:text-white hover:border-white/30 transition-all flex items-center gap-2"
                    >
                      <Copy className="w-3 h-3" />
                      {language === 'es' ? 'Compartir Perfil' : 'Share Profile'}
                    </button>
                    {currentUser.is_admin && (
                      <span className="bg-primary/20 text-primary border border-primary/30 text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" />
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-10">
                <div className="group space-y-3">
                  <label className="block font-body text-xs uppercase tracking-widest text-on-surface-variant">{language === 'es' ? 'Identidad' : 'Identity'}</label>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-on-surface/60 font-body">
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
