'use client';

import { useState } from 'react';
import { tmdb } from '@/lib/tmdb';
import { Cat, Star, Share2, UserPlus, UserMinus, List, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileClientProps {
  profile: any;
  followersCountInit: number;
  followingCountInit: number;
  isFollowingInit: boolean;
  loggedInUserId: string | null;
  favoriteMovies: any[];
  reviews: any[];
  lists: any[];
  language: string;
}

export function ProfileClient({
  profile,
  followersCountInit,
  followingCountInit,
  isFollowingInit,
  loggedInUserId,
  favoriteMovies,
  reviews,
  lists,
  language
}: ProfileClientProps) {
  const [isFollowing, setIsFollowing] = useState(isFollowingInit);
  const [followersCount, setFollowersCount] = useState(followersCountInit);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFollowToggle = async () => {
    if (!loggedInUserId) {
      toast.info(language === 'es' ? 'Inicia sesión para seguir a este usuario' : 'Log in to follow this user');
      return;
    }
    setIsProcessing(true);
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();

      if (isFollowing) {
        // Dejar de seguir
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', loggedInUserId)
          .eq('following_id', profile.id);

        if (error) throw error;
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
        toast.success(language === 'es' ? `Dejaste de seguir a @${profile.username}` : `Unfollowed @${profile.username}`);
      } else {
        // Seguir
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: loggedInUserId,
            following_id: profile.id
          });

        if (error) throw error;
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast.success(language === 'es' ? `Ahora sigues a @${profile.username}` : `Now following @${profile.username}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = () => {
    const profileUrl = window.location.href;
    navigator.clipboard.writeText(profileUrl);
    toast.success(language === 'es' ? '¡Enlace de perfil copiado!' : 'Profile link copied!');
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body selection:bg-primary/30 relative overflow-x-hidden">
      {/* Fondo decorativo premium */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_top_right,_rgba(212,178,255,0.06),_transparent_70%)] pointer-events-none"></div>
      <div className="absolute top-[30%] left-[-200px] w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,_rgba(212,178,255,0.03),_transparent_60%)] pointer-events-none"></div>

      {/* Header fijo minimalista */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/50 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-6 md:px-12 py-4">
        <a href="/" className="flex items-center gap-2 group">
          <Cat className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
          <span className="font-display text-xl uppercase tracking-widest text-primary">
            MEOWIEW
          </span>
        </a>
        <a 
          href="/"
          className="px-6 py-2 border border-white/10 hover:border-primary/40 font-body text-[10px] uppercase tracking-[0.2em] text-on-surface hover:bg-primary hover:text-on-primary transition-all duration-500 rounded-xl"
        >
          {language === 'es' ? 'Ir al Dashboard' : 'Go to Dashboard'}
        </a>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-24 relative z-10">
        {/* Perfil Header */}
        <section className="glass-card border border-white/5 p-8 md:p-12 rounded-[2.5rem] mb-16 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(212,178,255,0.02),_transparent_70%)] pointer-events-none"></div>
          
          {/* Avatar */}
          <div className="shrink-0 w-28 h-28 relative">
            <img 
              src={profile.avatar_url && profile.avatar_url.includes('/cats/') 
                ? profile.avatar_url.replace('/cats/', '/avataaars/') 
                : (profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`)} 
              alt={profile.username}
              className="w-28 h-28 rounded-full border-2 border-white/10 object-cover shadow-2xl" 
            />
          </div>

          {/* Info */}
          <div className="text-center md:text-left flex-1 min-w-0">
            <h1 className="font-display text-4xl md:text-5xl text-white italic mb-2">@{profile.username}</h1>
            
            {/* Stats */}
            <div className="flex justify-center md:justify-start items-center gap-6 text-sm text-on-surface-variant font-body mb-6">
              <div className="flex gap-1.5">
                <span className="font-bold text-white">{followersCount}</span>
                <span>{language === 'es' ? 'seguidores' : 'followers'}</span>
              </div>
              <div className="w-1.5 h-1.5 bg-white/10 rounded-full"></div>
              <div className="flex gap-1.5">
                <span className="font-bold text-white">{followingCountInit}</span>
                <span>{language === 'es' ? 'seguidos' : 'following'}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              {loggedInUserId && loggedInUserId !== profile.id && (
                <button
                  onClick={handleFollowToggle}
                  disabled={isProcessing}
                  className={`px-8 py-3 rounded-xl font-body text-[10px] uppercase tracking-[0.2em] transition-all duration-500 border flex items-center gap-2 ${
                    isFollowing 
                      ? 'border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500' 
                      : 'border-primary/45 bg-primary/10 text-primary hover:bg-primary hover:text-black hover:border-primary'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" />
                      {language === 'es' ? 'Dejar de seguir' : 'Unfollow'}
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      {language === 'es' ? 'Seguir' : 'Follow'}
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleShare}
                className="px-8 py-3 border border-white/10 hover:border-white/30 rounded-xl font-body text-[10px] uppercase tracking-[0.2em] text-on-surface-variant hover:text-white transition-all duration-300 flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                {language === 'es' ? 'Compartir Perfil' : 'Share Profile'}
              </button>
            </div>
          </div>
        </section>

        {/* Top 5 Masterpieces */}
        <section className="mb-20">
          <div className="mb-8">
            <span className="font-body text-[10px] uppercase tracking-[0.3em] text-primary mb-2 block">{language === 'es' ? 'Curaduría' : 'Curatorial'}</span>
            <h2 className="font-display text-3xl italic text-white">{language === 'es' ? 'Las 5 Obras Maestras' : 'The Essential 5'}</h2>
            <div className="w-8 h-[1px] bg-primary/30 mt-3"></div>
          </div>

          {favoriteMovies.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/5 rounded-[2rem] bg-white/[0.01] opacity-50">
              <p className="font-body text-sm text-on-surface-variant">{language === 'es' ? 'Aún no ha curado su selección favorita.' : 'No editorial selection curated yet.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {favoriteMovies.map((fav, index) => (
                <div key={fav.id} className="relative group">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-3xl border border-white/5 shadow-2xl transition-all duration-700 group-hover:border-primary/20 group-hover:-translate-y-1">
                    <img 
                      src={tmdb.getImageUrl(fav.movie?.poster_path, 'w500')} 
                      alt={fav.movie?.title || fav.movie?.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-85 group-hover:opacity-75 transition-opacity"></div>
                    
                    <div className="absolute top-4 left-4 font-display text-2xl italic text-primary/40 leading-none">
                      0{index + 1}
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="font-display text-base text-white italic leading-tight mb-1">{fav.movie?.title || fav.movie?.name}</p>
                      <p className="font-body text-[8px] uppercase tracking-wider text-on-surface-variant opacity-60">
                        {(fav.movie?.release_date || fav.movie?.first_air_date)?.split('-')[0]}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Reseñas (Reviews) */}
        <section className="mb-20">
          <div className="mb-8">
            <span className="font-body text-[10px] uppercase tracking-[0.3em] text-primary mb-2 block">{language === 'es' ? 'Perspectiva' : 'Perspectives'}</span>
            <h2 className="font-display text-3xl italic text-white">{language === 'es' ? 'Críticas Recientes' : 'Recent Reviews'}</h2>
            <div className="w-8 h-[1px] bg-primary/30 mt-3"></div>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/5 rounded-[2rem] bg-white/[0.01] opacity-50">
              <p className="font-body text-sm text-on-surface-variant">{language === 'es' ? 'Aún no ha escrito ninguna reseña.' : 'No reviews written yet.'}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((rev) => (
                <div 
                  key={rev.id} 
                  className="glass-card border border-white/5 hover:border-white/10 p-6 rounded-3xl flex flex-col sm:flex-row gap-6 items-start transition-all duration-500 shadow-xl group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(212,178,255,0.01),_transparent_70%)] pointer-events-none"></div>
                  
                  {/* Poster */}
                  <div className="w-20 h-28 relative rounded-xl overflow-hidden flex-shrink-0 border border-white/5 shadow-md">
                    {rev.movie?.poster_path ? (
                      <img src={tmdb.getImageUrl(rev.movie.poster_path, 'w500')} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-surface-variant flex items-center justify-center"><Star className="w-4 h-4 text-white/10" /></div>
                    )}
                  </div>

                  {/* Detalle */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <h4 className="font-display text-xl text-white italic leading-tight group-hover:text-primary transition-colors pr-2 inline-block">
                          {rev.movie?.title || rev.movie?.name}
                        </h4>
                        <span className="font-body text-[10px] text-on-surface-variant uppercase tracking-widest opacity-60 ml-2">
                          {(rev.movie?.release_date || rev.movie?.first_air_date)?.split('-')[0]}
                        </span>
                      </div>
                      
                      {/* Rating */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            className={`w-3.5 h-3.5 ${
                              rev.rating >= s 
                                ? 'text-primary fill-primary' 
                                : rev.rating >= s - 0.5 
                                  ? 'text-primary/70 fill-primary/70' 
                                  : 'text-white/10'
                            }`} 
                          />
                        ))}
                        <span className="font-body text-[10px] text-primary/60 tracking-wider ml-1 font-bold">{Number(rev.rating).toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Texto de reseña */}
                    {rev.review_text && (
                      <p className="font-body text-sm text-on-surface/80 leading-relaxed italic border-l-2 border-primary/20 pl-4 py-1 break-words">
                        "{rev.review_text}"
                      </p>
                    )}

                    <div className="mt-4 flex items-center gap-2 text-[9px] uppercase tracking-wider text-on-surface-variant opacity-40">
                      <MessageSquare className="w-3 h-3" />
                      <span>{new Date(rev.created_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Colecciones Públicas */}
        <section>
          <div className="mb-8">
            <span className="font-body text-[10px] uppercase tracking-[0.3em] text-primary mb-2 block">{language === 'es' ? 'Compilados' : 'Anthologies'}</span>
            <h2 className="font-display text-3xl italic text-white">{language === 'es' ? 'Colecciones Editoriales' : 'Editorial Collections'}</h2>
            <div className="w-8 h-[1px] bg-primary/30 mt-3"></div>
          </div>

          {lists.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/5 rounded-[2rem] bg-white/[0.01] opacity-50">
              <p className="font-body text-sm text-on-surface-variant">{language === 'es' ? 'No ha creado colecciones públicas aún.' : 'No public collections yet.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {lists.map((list) => (
                <div 
                  key={list.id} 
                  className="glass-card border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col justify-between hover:border-primary/25 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(212,178,255,0.02),_transparent_70%)] pointer-events-none"></div>
                  <div>
                    <h3 className="font-display text-2xl text-white italic group-hover:text-primary transition-colors leading-tight mb-3">
                      {list.title}
                    </h3>
                    {list.description && (
                      <p className="font-body text-xs text-on-surface-variant opacity-70 mb-6 line-clamp-2">
                        {list.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-auto">
                    <span className="font-body text-[9px] uppercase tracking-wider text-on-surface-variant opacity-40">
                      {new Date(list.created_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
                    </span>
                    <a 
                      href={`/lists/${list.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 border border-white/10 hover:border-primary/45 hover:bg-primary/5 text-on-surface-variant hover:text-primary rounded-xl font-body text-[9px] uppercase tracking-widest transition-all duration-500 flex items-center gap-1.5"
                    >
                      <List className="w-3.5 h-3.5" />
                      {language === 'es' ? 'Ver Colección' : 'View Collection'}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
