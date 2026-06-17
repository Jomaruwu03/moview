'use client';

import { useState, useEffect } from 'react';
import { tmdb } from '@/lib/tmdb';
import { ShareWidget } from '@/components/ShareWidget';
import { Search, Star, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { createClient } from '@/utils/supabase/client';

export function ReviewBuilder({ user }: { user: any }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const { language, t } = useLanguage();
  const supabase = createClient();
  
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [backgroundMode, setBackgroundMode] = useState<'poster' | 'dark'>('poster');
  const [theme, setTheme] = useState<'modern' | 'noir-frame'>('modern');
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');

  // New states for saved reviews
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [downloadTrigger, setDownloadTrigger] = useState<number>(0);

  const loadUserReviews = async () => {
    setIsLoadingReviews(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          review_text,
          created_at,
          tmdb_id,
          movies (
            tmdb_id,
            title,
            poster_path,
            backdrop_path,
            release_date
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserReviews(data || []);
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadUserReviews();
  }, [user.id]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const data = mediaType === 'movie' 
          ? await tmdb.searchMovies(query, language)
          : await tmdb.searchTV(query, language);
        setResults(data.results || []);
      } catch (err) {
        console.error(err);
        toast.error('Error en la búsqueda', { description: 'No pudimos conectar con la base de datos de películas.' });
      } finally {
        setIsSearching(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [query, language, mediaType]);

  const handleSaveReview = async () => {
    if (!selectedMovie) return;
    setIsSaving(true);
    const toastId = toast.loading(language === 'es' ? 'Guardando reseña...' : 'Saving review...');
    
    try {
      const isTV = mediaType === 'tv';
      const dbId = isTV ? -selectedMovie.id : selectedMovie.id;
      const title = selectedMovie.title || selectedMovie.name;
      const releaseDate = (selectedMovie.release_date || selectedMovie.first_air_date || '').trim() !== '' 
        ? (selectedMovie.release_date || selectedMovie.first_air_date) 
        : null;
      
      // 1. Ensure movie is in local cache database
      const { data: existingMovie } = await supabase
        .from('movies')
        .select('tmdb_id')
        .eq('tmdb_id', dbId)
        .single();
        
      if (!existingMovie) {
        const { error: movieError } = await supabase.from('movies').insert({
          tmdb_id: dbId,
          title: title,
          poster_path: selectedMovie.poster_path,
          backdrop_path: selectedMovie.backdrop_path,
          release_date: releaseDate
        });
        
        if (movieError) throw movieError;
      }
      
      // 2. Insert or update review (upsert)
      const reviewPayload: any = {
        user_id: user.id,
        tmdb_id: dbId,
        rating: rating,
        review_text: reviewText
      };
      if (editingReviewId) {
        reviewPayload.id = editingReviewId;
      }

      const { error: reviewError } = await supabase.from('reviews').upsert(reviewPayload, {
        onConflict: editingReviewId ? 'id' : 'user_id, tmdb_id'
      });
      
      if (reviewError) throw reviewError;
      
      toast.success(language === 'es' ? '¡Reseña guardada con éxito!' : 'Review saved successfully!', { id: toastId });
      
      // Trigger automatic download
      setDownloadTrigger(Date.now());
      loadUserReviews();
    } catch (err: any) {
      console.error('Error saving review:', err);
      toast.error(language === 'es' ? 'Error al guardar reseña' : 'Error saving review', {
        description: err.message,
        id: toastId
      });
      // If error occurs, reset trigger
      setDownloadTrigger(0);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportComplete = () => {
    // Reset form after download completes
    setSelectedMovie(null);
    setReviewText('');
    setRating(5);
    setEditingReviewId(null);
    setDownloadTrigger(0);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start w-full mb-24 overflow-x-hidden">
      <div className="glass-card border border-white/10 rounded-3xl p-6 md:p-12 shadow-2xl w-full min-w-0 overflow-hidden">
        <div className="mb-10">
          <span className="font-body text-[10px] uppercase tracking-[0.3em] text-primary mb-2 block">{language === 'es' ? 'Creador' : 'Creator'}</span>
          <h2 className="font-display text-4xl italic text-white">{language === 'es' ? 'Nueva Reseña' : 'New Review'}</h2>
        </div>
        
        {!selectedMovie ? (
          <div className="space-y-6 w-full min-w-0">
            {/* Selector de Tipo de Contenido */}
            <div className="flex gap-4 p-1 bg-white/5 border border-white/5 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setMediaType('movie');
                  setResults([]);
                }}
                className={`flex-1 py-3 text-center rounded-xl font-body text-[10px] uppercase tracking-widest transition-all duration-300 ${mediaType === 'movie' ? 'bg-primary/20 text-primary border border-primary/20' : 'text-on-surface-variant hover:text-white'}`}
              >
                {language === 'es' ? 'Películas' : 'Movies'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMediaType('tv');
                  setResults([]);
                }}
                className={`flex-1 py-3 text-center rounded-xl font-body text-[10px] uppercase tracking-widest transition-all duration-300 ${mediaType === 'tv' ? 'bg-primary/20 text-primary border border-primary/20' : 'text-on-surface-variant hover:text-white'}`}
              >
                {language === 'es' ? 'Series / Animes' : 'TV Shows / Anime'}
              </button>
            </div>

            <div className="relative group w-full">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={mediaType === 'movie' ? t('search.placeholder') : (language === 'es' ? 'Buscar series o animes...' : 'Search series or anime...')} 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pl-14 text-white font-body text-sm outline-none focus:border-primary/40 focus:bg-white/10 transition-all duration-500"
              />
              <div className="absolute left-5 top-5 text-on-surface-variant group-focus-within:text-primary transition-colors">
                <Search className="w-5 h-5" />
              </div>
            </div>

            {isSearching && <p className="font-body text-[10px] uppercase tracking-widest text-primary animate-pulse ml-2">{language === 'es' ? 'Buscando en el archivo...' : 'Searching archives...'}</p>}

            <div className="space-y-3 max-h-[450px] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar w-full">
              {results.map(movie => (
                <button 
                  key={movie.id}
                  onClick={() => setSelectedMovie(movie)}
                  className="flex items-center gap-5 p-3 hover:bg-white/5 rounded-2xl text-left transition-all duration-500 border border-transparent hover:border-white/5 group w-full min-w-0"
                >
                  <div className="w-14 h-20 relative flex-shrink-0 overflow-hidden rounded-lg shadow-lg border border-white/5">
                    {movie.poster_path ? (
                      <img src={tmdb.getImageUrl(movie.poster_path, 'w500')} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-surface-variant flex items-center justify-center"><Star className="w-4 h-4 text-white/10" /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-sm font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{movie.title || movie.name}</p>
                    <p className="font-body text-xs text-on-surface-variant">{(movie.release_date || movie.first_air_date)?.split('-')[0]}</p>
                  </div>
                </button>
              ))}
              {!isSearching && query.trim() !== '' && results.length === 0 && (
                <div className="text-center py-12 opacity-40">
                  <p className="font-body text-xs uppercase tracking-[0.2em]">{language === 'es' ? 'Sin hallazgos' : 'No findings'}</p>
                </div>
              )}
            </div>

            {/* List of user's reviews when not searching */}
            {query.trim() === '' && (
              <div className="pt-10 border-t border-white/5 space-y-6 w-full min-w-0">
                <h3 className="font-display text-2xl italic text-white">
                  {language === 'es' ? 'Tus Reseñas Guardadas' : 'Your Saved Reviews'}
                </h3>
                
                {isLoadingReviews ? (
                  <p className="font-body text-xs text-on-surface-variant animate-pulse">
                    {language === 'es' ? 'Cargando reseñas...' : 'Loading reviews...'}
                  </p>
                ) : userReviews.length === 0 ? (
                  <div className="text-center py-12 opacity-40">
                    <p className="font-body text-xs uppercase tracking-[0.2em]">
                      {language === 'es' ? 'Aún no tienes reseñas' : 'No reviews yet'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 w-full">
                    <div className="flex flex-col gap-4 max-h-[420px] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar w-full">
                      {(showAllReviews ? userReviews : userReviews.slice(0, 3)).map((rev) => {
                        const movie = rev.movies as any;
                        return (
                          <div 
                            key={rev.id}
                            className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-500 group w-full min-w-0 overflow-hidden"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="w-12 h-18 relative flex-shrink-0 overflow-hidden rounded-xl border border-white/5 shadow-md">
                                {movie?.poster_path ? (
                                  <img 
                                    src={tmdb.getImageUrl(movie.poster_path, 'w500')} 
                                    alt={movie.title} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                  />
                                ) : (
                                  <div className="w-full h-full bg-surface-variant flex items-center justify-center">
                                    <Star className="w-4 h-4 text-white/10" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-display text-base text-white italic truncate pr-2">{movie?.title}</p>
                                <div className="flex items-center gap-1 my-1.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star 
                                      key={s} 
                                      className={`w-3 h-3 ${
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
                                {rev.review_text && (
                                  <p className="font-body text-xs text-on-surface-variant/80 truncate w-full">
                                    "{rev.review_text}"
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2 md:opacity-0 md:group-hover:opacity-100 opacity-80 transition-all duration-300">
                              <button
                                onClick={() => {
                                  const isTV = movie.tmdb_id < 0;
                                  const realTmdbId = Math.abs(movie.tmdb_id);
                                  setSelectedMovie({
                                    id: realTmdbId,
                                    title: movie.title,
                                    name: movie.title,
                                    poster_path: movie.poster_path,
                                    backdrop_path: movie.backdrop_path,
                                    release_date: movie.release_date,
                                    first_air_date: movie.release_date
                                  });
                                  setRating(rev.rating);
                                  setReviewText(rev.review_text || '');
                                  setMediaType(isTV ? 'tv' : 'movie');
                                  setEditingReviewId(rev.id);
                                }}
                                className="p-2 bg-white/5 hover:bg-primary/20 text-on-surface-variant hover:text-primary rounded-xl transition-all duration-300"
                                title={language === 'es' ? 'Editar Reseña' : 'Edit Review'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm(language === 'es' ? '¿Seguro que deseas eliminar esta reseña?' : 'Are you sure you want to delete this review?')) return;
                                  const { error } = await supabase
                                    .from('reviews')
                                    .delete()
                                    .eq('id', rev.id);
                                  
                                  if (error) {
                                    toast.error(error.message);
                                  } else {
                                    toast.success(language === 'es' ? 'Reseña eliminada' : 'Review deleted');
                                    loadUserReviews();
                                  }
                                }}
                                className="p-2 bg-white/5 hover:bg-red-500/20 text-on-surface-variant hover:text-red-500 rounded-xl transition-all duration-300"
                                title={language === 'es' ? 'Eliminar Reseña' : 'Delete Review'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {userReviews.length > 3 && (
                      <button
                        onClick={() => setShowAllReviews(!showAllReviews)}
                        className="w-full py-3 mt-2 border border-white/5 hover:border-primary/20 text-on-surface-variant hover:text-primary rounded-xl font-body text-[10px] uppercase tracking-widest transition-all duration-300 bg-white/[0.01] hover:bg-white/[0.03] flex items-center justify-center gap-2"
                      >
                        {showAllReviews 
                          ? (language === 'es' ? 'Mostrar menos' : 'Show less') 
                          : (language === 'es' ? `Ver todas las reseñas (${userReviews.length})` : `View all reviews (${userReviews.length})`)
                        }
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 cubic-out">
            <div className="flex items-center justify-between glass-card border border-white/5 p-5 rounded-2xl gap-4">
              <div className="flex items-center gap-5 min-w-0">
                <div className="w-16 h-24 flex-shrink-0 overflow-hidden rounded-xl shadow-xl border border-white/10">
                  <img 
                    src={tmdb.getImageUrl(selectedMovie.poster_path, 'w500')} 
                    alt="Poster" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-lg sm:text-xl text-white italic truncate pr-2">{selectedMovie.title || selectedMovie.name}</h3>
                  <p className="font-body text-xs text-on-surface-variant uppercase tracking-widest mt-1">{(selectedMovie.release_date || selectedMovie.first_air_date)?.split('-')[0]}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedMovie(null);
                  setReviewText('');
                  setRating(5);
                  setEditingReviewId(null);
                }}
                className="font-body text-[10px] uppercase tracking-widest text-primary/60 hover:text-primary transition-colors border-b border-primary/20 flex-shrink-0"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
            </div>

            <div className="space-y-4">
              <label className="font-body text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">{language === 'es' ? 'Calificación' : 'Rating'}</label>
              <div className="flex gap-2 sm:gap-4 items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div key={star} className="relative w-8 h-8 sm:w-10 sm:h-10 cursor-pointer group/star">
                    <Star className="w-8 h-8 sm:w-10 sm:h-10 text-white/5 transition-colors group-hover/star:text-white/10" />
                    {(rating >= star - 0.5) && (
                      <div className={`absolute top-0 left-0 h-full overflow-hidden pointer-events-none ${rating >= star ? 'w-full' : 'w-[50%]'}`}>
                        <Star className="w-8 h-8 sm:w-10 sm:h-10 max-w-none text-primary fill-primary shadow-[0_0_20px_rgba(212,178,255,0.4)]" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex">
                      <button className="flex-1" onClick={() => setRating(star - 0.5)} />
                      <button className="flex-1" onClick={() => setRating(star)} />
                    </div>
                  </div>
                ))}
                <span className="font-display text-2xl sm:text-3xl text-primary italic ml-2 sm:ml-4">{rating.toFixed(1)}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="font-body text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">{language === 'es' ? 'Tu Crítica' : 'Your Critique'}</label>
              <div className="relative">
                <textarea 
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-body text-sm focus:border-primary/40 focus:bg-white/10 outline-none transition-all duration-500 resize-none h-32"
                  maxLength={150}
                  placeholder={language === 'es' ? 'Escribe tu veredicto...' : 'Write your verdict...'}
                />
                <div className="absolute bottom-4 right-4 font-body text-[10px] text-on-surface-variant opacity-50 tracking-widest">
                  {reviewText.length}/150
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-8">
              <div className="space-y-4">
                <label className="font-body text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">{language === 'es' ? 'Estética' : 'Aesthetic'}</label>
                <div className="flex flex-col gap-3">
                  {[
                    { id: 'modern', label: language === 'es' ? 'Editorial' : 'Editorial' },
                    { id: 'noir-frame', label: language === 'es' ? 'Noir Frame' : 'Noir Frame' }
                  ].map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => setTheme(item.id as any)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 font-body text-[11px] uppercase tracking-widest ${theme === item.id ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-white/5 border-white/5 text-on-surface-variant hover:bg-white/10'}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${theme === item.id ? 'bg-primary shadow-[0_0_8px_rgba(212,178,255,0.8)]' : 'bg-white/20'}`}></div>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="font-body text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">{language === 'es' ? 'Fondo' : 'Background'}</label>
                <div className="flex flex-col gap-3">
                  {[
                    { id: 'poster', label: language === 'es' ? 'Portada' : 'Poster' },
                    { id: 'dark', label: language === 'es' ? 'Noir' : 'Noir' }
                  ].map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => setBackgroundMode(item.id as any)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 font-body text-[11px] uppercase tracking-widest ${backgroundMode === item.id ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-white/5 border-white/5 text-on-surface-variant hover:bg-white/10'}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${backgroundMode === item.id ? 'bg-primary shadow-[0_0_8px_rgba(212,178,255,0.8)]' : 'bg-white/20'}`}></div>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveReview}
              disabled={isSaving}
              className="w-full py-4 border-[0.5px] border-primary/45 font-body text-xs uppercase tracking-[0.2em] text-on-surface bg-primary/10 hover:bg-primary hover:text-on-primary hover:shadow-[0_0_30px_rgba(212,178,255,0.2)] transition-all duration-500 cubic-out flex items-center justify-center gap-3 disabled:opacity-30"
            >
              {isSaving ? (
                <span className="animate-pulse">{language === 'es' ? 'Guardando...' : 'Saving...'}</span>
              ) : (
                language === 'es' ? 'Guardar Reseña' : 'Save Review'
              )}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center w-full sticky top-32">
        <div className="mb-10 w-full">
          <span className="font-body text-[10px] uppercase tracking-[0.3em] text-primary mb-2 block">{language === 'es' ? 'Resultado' : 'Outcome'}</span>
          <h2 className="font-display text-4xl italic text-white">{language === 'es' ? 'Vista Previa' : 'Preview'}</h2>
        </div>
        <div className="w-full flex justify-center perspective-1000">
          {selectedMovie ? (
            <div className="transform hover:rotate-y-2 transition-transform duration-[1500ms] cubic-out">
              <ShareWidget 
                movie={selectedMovie} 
                rating={rating} 
                reviewText={reviewText} 
                user={user} 
                backgroundMode={backgroundMode}
                theme={theme}
                triggerDownload={downloadTrigger}
                onExportComplete={handleExportComplete}
              />
            </div>
          ) : (
            <div className="w-full max-w-[450px] aspect-[9/16] glass-card border border-white/10 rounded-3xl flex flex-col items-center justify-center p-12 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="metallic-plate p-6 rounded-full mb-8 relative z-10 opacity-30">
                <Star className="w-12 h-12 text-on-surface-variant" />
              </div>
              <p className="font-body text-[10px] uppercase tracking-[0.2em] text-on-surface-variant leading-relaxed relative z-10 max-w-[200px]">
                {language === 'es' ? 'Selecciona una película para revelar el diseño editorial' : 'Select a movie to reveal the editorial design'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
