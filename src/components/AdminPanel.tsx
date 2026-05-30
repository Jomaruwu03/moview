'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, Trash2, Shield, User, Star, Film, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  created_at: string;
  is_admin: boolean;
  deleted_at: string | null;
}

interface Review {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string;
  } | null;
  movies: {
    title: string;
    poster_path: string;
  } | null;
}

export function AdminPanel({ language, currentUserId }: { language: 'es' | 'en'; currentUserId?: string }) {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'reviews'>('users');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeSubTab === 'users') {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setProfiles(data || []);
      } else {
        const { data, error } = await supabase
          .from('reviews')
          .select(`
            id,
            rating,
            review_text,
            created_at,
            profiles (
              username,
              avatar_url
            ),
            movies (
              title,
              poster_path
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReviews(data as any[] || []);
      }
    } catch (err: any) {
      toast.error(language === 'es' ? 'Error al cargar datos' : 'Error loading data', {
        description: err.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeSubTab]);

  const handleToggleSoftDeleteProfile = async (profileId: string, username: string, isDeleted: boolean) => {
    if (profileId === currentUserId) {
      toast.error(
        language === 'es'
          ? 'No puedes desactivar tu propia cuenta'
          : 'You cannot deactivate your own account'
      );
      return;
    }
    if (deletingId) return;
    setDeletingId(profileId);
    try {
      const targetDeletedAt = isDeleted ? null : new Date().toISOString();
      const { error } = await supabase
        .from('profiles')
        .update({ deleted_at: targetDeletedAt })
        .eq('id', profileId);

      if (error) throw error;

      toast.success(
        language === 'es' 
          ? (isDeleted ? `Usuario @${username} restaurado` : `Usuario @${username} desactivado`)
          : (isDeleted ? `User @${username} restored` : `User @${username} deactivated`)
      );
      setProfiles(profiles.map(p => p.id === profileId ? { ...p, deleted_at: targetDeletedAt } : p));
    } catch (err: any) {
      toast.error(
        language === 'es' ? 'No se pudo actualizar el estado del usuario' : 'Failed to update user status',
        { description: err.message }
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (deletingId) return;
    setDeletingId(reviewId);
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      toast.success(
        language === 'es' ? 'Reseña eliminada con éxito' : 'Review deleted successfully'
      );
      setReviews(reviews.filter(r => r.id !== reviewId));
    } catch (err: any) {
      toast.error(
        language === 'es' ? 'No se pudo eliminar la reseña' : 'Failed to delete review',
        { description: err.message }
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReviews = reviews.filter(r => 
    (r.movies?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.profiles?.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.review_text || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Sub Tabs Toggle */}
      <div className="flex justify-center">
        <div className="flex bg-white/5 border border-white/10 p-1 rounded-full">
          <button
            onClick={() => { setActiveSubTab('users'); setSearchQuery(''); }}
            className={`px-8 py-3 rounded-full font-body text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
              activeSubTab === 'users' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <User className="w-4.5 h-4.5" />
            {language === 'es' ? 'Usuarios' : 'Users'}
          </button>
          <button
            onClick={() => { setActiveSubTab('reviews'); setSearchQuery(''); }}
            className={`px-8 py-3 rounded-full font-body text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
              activeSubTab === 'reviews' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <Film className="w-4.5 h-4.5" />
            {language === 'es' ? 'Reseñas' : 'Reviews'}
          </button>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="relative max-w-md mx-auto group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            activeSubTab === 'users'
              ? (language === 'es' ? 'Buscar usuario por nombre...' : 'Search user by name...')
              : (language === 'es' ? 'Buscar reseña por película o usuario...' : 'Search review by movie or user...')
          }
          className="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-6 py-4 text-white font-body text-sm outline-none focus:border-primary/45 focus:bg-white/10 transition-all duration-300 placeholder:text-white/20"
        />
      </div>

      {/* Content Area */}
      <div className="glass-card border border-white/10 rounded-[2rem] overflow-hidden min-h-[300px] relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : activeSubTab === 'users' ? (
          filteredProfiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
              <User className="w-12 h-12 text-primary/40 mb-4" />
              <p className="font-body text-sm">{language === 'es' ? 'No se encontraron usuarios.' : 'No users found.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="p-6 font-display text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">{language === 'es' ? 'Usuario' : 'User'}</th>
                    <th className="p-6 font-display text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">{language === 'es' ? 'ID de Supabase' : 'Supabase ID'}</th>
                    <th className="p-6 font-display text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">{language === 'es' ? 'Fecha Registro' : 'Join Date'}</th>
                    <th className="p-6 font-display text-[10px] uppercase tracking-widest text-on-surface-variant font-bold text-center">{language === 'es' ? 'Acción' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProfiles.map((profile) => {
                    const isDeleted = profile.deleted_at !== null;
                    return (
                      <tr key={profile.id} className={`hover:bg-white/[0.01] transition-colors ${isDeleted ? 'opacity-60 bg-red-950/5' : ''}`}>
                        <td className="p-6 flex items-center gap-4">
                          <img src={profile.avatar_url} className={`w-10 h-10 rounded-full border border-white/10 object-cover ${isDeleted ? 'grayscale opacity-50' : ''}`} />
                          <div>
                            <div className={`font-body text-sm font-semibold flex items-center gap-2 ${isDeleted ? 'text-white/40 line-through' : 'text-white'}`}>
                              @{profile.username}
                              {profile.is_admin && (
                                <span className="bg-primary/20 text-primary border border-primary/30 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                                  <Shield className="w-2.5 h-2.5" />
                                  Admin
                                </span>
                              )}
                              {isDeleted && (
                                <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold">
                                  {language === 'es' ? 'Desactivado' : 'Deactivated'}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-6 font-body text-xs text-white/50">{profile.id}</td>
                        <td className="p-6 font-body text-xs text-white/60">
                          {new Date(profile.created_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="p-6 text-center">
                          {isDeleted ? (
                            <button
                              onClick={() => {
                                if (confirm(language === 'es' ? `¿Deseas restaurar al usuario @${profile.username}?` : `Do you want to restore user @${profile.username}?`)) {
                                  handleToggleSoftDeleteProfile(profile.id, profile.username, true);
                                }
                              }}
                              disabled={deletingId !== null}
                              className="text-white/40 hover:text-green-400 p-2.5 rounded-full hover:bg-green-500/10 transition-all duration-300 disabled:opacity-30"
                              title={language === 'es' ? 'Restaurar Usuario' : 'Restore User'}
                            >
                              <RotateCcw className="w-4.5 h-4.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (confirm(language === 'es' ? `¿Estás seguro de desactivar al usuario @${profile.username}? (Soft Delete)` : `Are you sure you want to deactivate user @${profile.username}? (Soft Delete)`)) {
                                  handleToggleSoftDeleteProfile(profile.id, profile.username, false);
                                }
                              }}
                              disabled={deletingId !== null || profile.id === currentUserId}
                              className="text-white/40 hover:text-red-400 p-2.5 rounded-full hover:bg-red-500/10 transition-all duration-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white/40"
                              title={
                                profile.id === currentUserId
                                  ? (language === 'es' ? 'No puedes desactivar tu propia cuenta' : 'You cannot deactivate your own account')
                                  : (language === 'es' ? 'Desactivar Usuario' : 'Deactivate User')
                              }
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          filteredReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
              <Film className="w-12 h-12 text-primary/40 mb-4" />
              <p className="font-body text-sm">{language === 'es' ? 'No se encontraron reseñas.' : 'No reviews found.'}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredReviews.map((review) => (
                <div key={review.id} className="p-6 flex flex-col md:flex-row gap-6 items-start justify-between hover:bg-white/[0.01] transition-colors">
                  <div className="flex gap-4 items-start flex-1">
                    {review.movies?.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${review.movies.poster_path}`}
                        alt={review.movies.title}
                        className="w-16 rounded border border-white/10"
                      />
                    ) : (
                      <div className="w-16 h-24 bg-white/5 border border-white/10 rounded flex items-center justify-center">
                        <Film className="w-6 h-6 text-white/20" />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <h4 className="font-display text-xl text-white italic">{review.movies?.title || 'Película Desconocida'}</h4>
                      
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <span>{language === 'es' ? 'Por' : 'By'}</span>
                        <div className="flex items-center gap-1 text-white">
                          <img 
                            src={review.profiles?.avatar_url && review.profiles.avatar_url.includes('/cats/') 
                              ? review.profiles.avatar_url.replace('/cats/', '/avataaars/') 
                              : (review.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.profiles?.username || 'placeholder'}`)} 
                            className="w-5 h-5 rounded-full" 
                          />
                          <span>@{review.profiles?.username || 'usuario_eliminado'}</span>
                        </div>
                        <span>•</span>
                        <span>
                          {new Date(review.created_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
                        </span>
                      </div>

                      <div className="flex gap-0.5 text-primary">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-primary text-primary' : 'text-white/10'}`}
                          />
                        ))}
                      </div>

                      {review.review_text && (
                        <p className="font-body text-sm text-on-surface-variant/80 italic border-l-2 border-primary/20 pl-4 py-1 leading-relaxed max-w-2xl">
                          "{review.review_text}"
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(language === 'es' ? '¿Estás seguro de eliminar esta reseña?' : 'Are you sure you want to delete this review?')) {
                        handleDeleteReview(review.id);
                      }
                    }}
                    disabled={deletingId !== null}
                    className="text-white/40 hover:text-red-400 p-2.5 rounded-full hover:bg-red-500/10 transition-all duration-300 disabled:opacity-30 self-end md:self-center"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
