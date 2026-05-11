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
  const [theme, setTheme] = useState<'modern' | 'retro-ticket'>('modern');

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
    <div className="grid lg:grid-cols-2 gap-12 items-start w-full">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-6">{language === 'es' ? 'Nueva Reseña' : 'New Review'}</h2>
        
        {!selectedMovie ? (
          <div className="space-y-4">
            <div className="relative flex gap-2">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search.placeholder')} 
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white outline-none focus:border-purple-500"
              />
              <div className="absolute right-3 top-3 text-neutral-400">
                <Search className="w-5 h-5" />
              </div>
            </div>

            {isSearching && <p className="text-sm text-neutral-500">{language === 'es' ? 'Buscando...' : 'Searching...'}</p>}
            {!isSearching && query.trim() && results.length === 0 && (
              <p className="text-sm text-neutral-500">{t('search.no_results')}</p>
            )}

            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
              {results.map(movie => (
                <button 
                  key={movie.id}
                  onClick={() => setSelectedMovie(movie)}
                  className="flex gap-4 p-2 hover:bg-neutral-800 rounded-lg text-left transition"
                >
                  {movie.poster_path ? (
                    <img src={tmdb.getImageUrl(movie.poster_path, 'w500')} className="w-12 h-16 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-16 bg-neutral-800 rounded"></div>
                  )}
                  <div>
                    <p className="font-bold">{movie.title}</p>
                    <p className="text-sm text-neutral-400">{movie.release_date?.split('-')[0]}</p>
                  </div>
                </button>
              ))}
              {!isSearching && query.trim() !== '' && results.length === 0 && (
                <p className="text-sm text-neutral-500 p-2">No se encontraron películas.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-4 items-center justify-between bg-neutral-950 p-4 rounded-lg">
              <div className="flex gap-4 items-center">
                <img 
                  src={tmdb.getImageUrl(selectedMovie.poster_path, 'w500')} 
                  alt="Poster" 
                  className="w-16 rounded-md shadow-lg"
                />
                <div>
                  <h3 className="text-lg font-bold">{selectedMovie.title}</h3>
                  <p className="text-neutral-500 text-sm">{selectedMovie.release_date?.split('-')[0]}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMovie(null)}
                className="text-sm text-neutral-400 hover:text-white underline"
              >
                Cambiar
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">{language === 'es' ? 'Calificación' : 'Rating'}</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div key={star} className="relative w-8 h-8 cursor-pointer">
                    <Star className="w-8 h-8 text-neutral-600" />
                    {(rating >= star - 0.5) && (
                      <div className={`absolute top-0 left-0 h-full overflow-hidden pointer-events-none ${rating >= star ? 'w-full' : 'w-[50%]'}`}>
                        <Star className="w-8 h-8 max-w-none text-yellow-500 fill-yellow-500 drop-shadow-lg" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex">
                      <button className="flex-1" onClick={() => setRating(star - 0.5)} />
                      <button className="flex-1" onClick={() => setRating(star)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">{language === 'es' ? 'Tu opinión (opcional)' : 'Your opinion (optional)'}</label>
              <textarea 
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none"
                rows={3}
                maxLength={50}
                placeholder={language === 'es' ? '¿Qué te pareció la película? (Sé breve)' : 'What did you think of the movie? (Keep it short)'}
              />
              <p className="text-right text-xs text-neutral-500 mt-1">{reviewText.length}/50 {language === 'es' ? 'caracteres' : 'characters'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">{language === 'es' ? 'Tema del Widget' : 'Widget Theme'}</label>
              <div className="flex gap-6 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="themeMode"
                    className="accent-purple-500"
                    checked={theme === 'modern'} 
                    onChange={() => setTheme('modern')} 
                  />
                  <span className="text-white text-sm">{language === 'es' ? 'Moderno' : 'Modern'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="themeMode"
                    className="accent-purple-500"
                    checked={theme === 'retro-ticket'} 
                    onChange={() => setTheme('retro-ticket')} 
                  />
                  <span className="text-white text-sm">{language === 'es' ? 'Boleto Retro' : 'Retro Ticket'}</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">{language === 'es' ? 'Fondo del Widget' : 'Widget Background'}</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="bgMode"
                    className="accent-purple-500"
                    checked={backgroundMode === 'poster'} 
                    onChange={() => setBackgroundMode('poster')} 
                  />
                  <span className="text-white text-sm">{language === 'es' ? 'Portada' : 'Poster'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="bgMode"
                    className="accent-purple-500"
                    checked={backgroundMode === 'dark'} 
                    onChange={() => setBackgroundMode('dark')} 
                  />
                  <span className="text-white text-sm">{language === 'es' ? 'Oscuro' : 'Dark'}</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center w-full">
        <h2 className="text-2xl font-bold mb-6 text-center w-full">{language === 'es' ? 'Vista Previa' : 'Preview'}</h2>
        <div className="w-full flex justify-center">
          {selectedMovie ? (
            <ShareWidget 
              movie={selectedMovie} 
              rating={rating} 
              reviewText={reviewText} 
              user={user} 
              backgroundMode={backgroundMode}
              theme={theme}
            />
          ) : (
            <div className="relative w-full h-[600px] sm:h-[800px] lg:h-[900px] flex justify-center overflow-hidden">
              <div className="absolute top-0 origin-top transform scale-[0.3] sm:scale-[0.4] lg:scale-[0.45]">
                <div className="w-[1080px] h-[1920px] bg-neutral-900 border border-neutral-800 rounded-3xl flex items-center justify-center text-neutral-500 text-3xl font-bold shadow-2xl">
                  {language === 'es' ? 'Selecciona una película para ver el widget' : 'Select a movie to preview the widget'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
