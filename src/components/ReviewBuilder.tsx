'use client';

import { useState, useEffect } from 'react';
import { tmdb } from '@/lib/tmdb';
import { ShareWidget } from '@/components/ShareWidget';
import { Search, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';

export function ReviewBuilder({ user }: { user: any }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const { language, t } = useLanguage();
  
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [backgroundMode, setBackgroundMode] = useState<'poster' | 'dark'>('poster');
  const [theme, setTheme] = useState<'modern' | 'noir-frame'>('modern');

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const data = await tmdb.searchMovies(query, language);
        setResults(data.results || []);
      } catch (err) {
        console.error(err);
        toast.error('Error en la búsqueda', { description: 'No pudimos conectar con la base de datos de películas.' });
      } finally {
        setIsSearching(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [query, language]);

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start w-full mb-24 overflow-x-hidden">
      <div className="glass-card border border-white/10 rounded-3xl p-6 md:p-12 shadow-2xl">
        <div className="mb-10">
          <span className="font-body text-[10px] uppercase tracking-[0.3em] text-primary mb-2 block">{language === 'es' ? 'Creador' : 'Creator'}</span>
          <h2 className="font-display text-4xl italic text-white">{language === 'es' ? 'Nueva Reseña' : 'New Review'}</h2>
        </div>
        
        {!selectedMovie ? (
          <div className="space-y-6">
            <div className="relative group">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search.placeholder')} 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pl-14 text-white font-body text-sm outline-none focus:border-primary/40 focus:bg-white/10 transition-all duration-500"
              />
              <div className="absolute left-5 top-5 text-on-surface-variant group-focus-within:text-primary transition-colors">
                <Search className="w-5 h-5" />
              </div>
            </div>

            {isSearching && <p className="font-body text-[10px] uppercase tracking-widest text-primary animate-pulse ml-2">{language === 'es' ? 'Buscando en el archivo...' : 'Searching archives...'}</p>}

            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {results.map(movie => (
                <button 
                  key={movie.id}
                  onClick={() => setSelectedMovie(movie)}
                  className="flex items-center gap-5 p-3 hover:bg-white/5 rounded-2xl text-left transition-all duration-500 border border-transparent hover:border-white/5 group w-full"
                >
                  <div className="w-14 h-20 relative flex-shrink-0 overflow-hidden rounded-lg shadow-lg border border-white/5">
                    {movie.poster_path ? (
                      <img src={tmdb.getImageUrl(movie.poster_path, 'w500')} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-surface-variant flex items-center justify-center"><Star className="w-4 h-4 text-white/10" /></div>
                    )}
                  </div>
                  <div>
                    <p className="font-body text-sm font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{movie.title}</p>
                    <p className="font-body text-xs text-on-surface-variant">{movie.release_date?.split('-')[0]}</p>
                  </div>
                </button>
              ))}
              {!isSearching && query.trim() !== '' && results.length === 0 && (
                <div className="text-center py-12 opacity-40">
                  <p className="font-body text-xs uppercase tracking-[0.2em]">{language === 'es' ? 'Sin hallazgos' : 'No findings'}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 cubic-out">
            <div className="flex items-center justify-between glass-card border border-white/5 p-5 rounded-2xl">
              <div className="flex items-center gap-5">
                <div className="w-16 h-24 overflow-hidden rounded-xl shadow-xl border border-white/10">
                  <img 
                    src={tmdb.getImageUrl(selectedMovie.poster_path, 'w500')} 
                    alt="Poster" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-display text-xl text-white italic">{selectedMovie.title}</h3>
                  <p className="font-body text-xs text-on-surface-variant uppercase tracking-widest mt-1">{selectedMovie.release_date?.split('-')[0]}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMovie(null)}
                className="font-body text-[10px] uppercase tracking-widest text-primary/60 hover:text-primary transition-colors border-b border-primary/20"
              >
                {language === 'es' ? 'Cambiar' : 'Change'}
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
                        <Star className="w-8 h-8 sm:w-10 sm:h-10 max-w-none text-primary fill-primary shadow-[0_0_20px_rgba(236,178,255,0.4)]" />
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
                  maxLength={50}
                  placeholder={language === 'es' ? 'Escribe tu veredicto...' : 'Write your verdict...'}
                />
                <div className="absolute bottom-4 right-4 font-body text-[10px] text-on-surface-variant opacity-50 tracking-widest">
                  {reviewText.length}/50
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
                      <div className={`w-2 h-2 rounded-full ${theme === item.id ? 'bg-primary shadow-[0_0_8px_rgba(236,178,255,0.8)]' : 'bg-white/20'}`}></div>
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
                      <div className={`w-2 h-2 rounded-full ${backgroundMode === item.id ? 'bg-primary shadow-[0_0_8px_rgba(236,178,255,0.8)]' : 'bg-white/20'}`}></div>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
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
