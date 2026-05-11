'use client';

import { useState, useEffect, useRef } from 'react';
import { tmdb } from '@/lib/tmdb';
import { createClient } from '@/utils/supabase/client';
import { Search, Plus, X, Share2, Download, Cat } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';

// Función auxiliar para obtener Base64
async function getBase64(url: string) {
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error(err);
    return url;
  }
}

export function TopMovies({ user }: { user: any }) {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const supabase = createClient();
  const { language, t } = useLanguage();

  // Estados para exportación segura sin Canvas Taint
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [base64Images, setBase64Images] = useState<Record<string, string>>({});
  const [avatarBase64, setAvatarBase64] = useState<string>('');

  useEffect(() => {
    async function loadFavorites() {
      const { data } = await supabase
        .from('favorite_movies')
        .select('rank, tmdb_id')
        .eq('user_id', user.id)
        .order('rank', { ascending: true });
        
      if (data) {
        const loadedFavs = [];
        for (const item of data) {
          const movie = await tmdb.getMovie(item.tmdb_id.toString());
          loadedFavs.push(movie);
        }
        setFavorites(loadedFavs);
      }
    }
    loadFavorites();
  }, [user.id]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) return setResults([]);
      const data = await tmdb.searchMovies(query, language);
      setResults(data.results || []);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, language]);

  // Precargar imágenes a Base64 cuando cambian los favoritos
  useEffect(() => {
    async function preloadImages() {
      const images: Record<string, string> = {};
      for (const movie of favorites) {
        if (movie?.poster_path) {
          const url = tmdb.getImageUrl(movie.poster_path, 'w500');
          images[movie.id] = await getBase64(url);
        }
      }
      setBase64Images(images);
      if (user.avatar_url) setAvatarBase64(await getBase64(user.avatar_url));
    }
    preloadImages();
  }, [favorites, user.avatar_url]);

  const handleSelectMovie = async (movie: any) => {
    if (favorites.length >= 5) return;
    
    // Evitar añadir películas duplicadas
    const isDuplicate = favorites.some((fav) => fav.id === movie.id);
    if (isDuplicate) {
      toast.error('Película duplicada', {
        description: 'Esta película ya se encuentra en tu Top 5. Elige otra diferente.',
      });
      return;
    }
    
    const newFavs = [...favorites, movie];
    setFavorites(newFavs);
    setIsAdding(false);
    setQuery('');
    
    // Save to DB (Movies Cache)
    const releaseDate = movie.release_date && movie.release_date.trim() !== '' ? movie.release_date : null;
    
    // 1. Check if movie already exists to avoid UPSERT RLS issues
    const { data: existingMovie } = await supabase
      .from('movies')
      .select('tmdb_id')
      .eq('tmdb_id', movie.id)
      .single();

    // 2. Insert only if it doesn't exist
    if (!existingMovie) {
      const { error: movieError } = await supabase.from('movies').insert({
        tmdb_id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: releaseDate
      });

      if (movieError) {
        console.error("Movie Insert Error:", movieError);
        toast.error('Error al guardar película', { description: movieError.message || 'Error desconocido' });
        // Revertir optimísticamente
        const revertedFavs = favorites.filter(f => f.id !== movie.id);
        setFavorites(revertedFavs);
        return;
      }
    }

    const { error: favError } = await supabase.from('favorite_movies').upsert({
      user_id: user.id,
      tmdb_id: movie.id,
      rank: newFavs.length
    }, { onConflict: 'user_id, rank' });

    if (favError) {
      console.error(favError);
      toast.error('Error al guardar tu Top', { description: favError.message });
      // Revertir optimísticamente
      setFavorites(favorites);
      return;
    }

    toast.success('Añadida al Top', { description: `${movie.title} guardada en tu perfil.` });
  };

  const removeFavorite = async (index: number) => {
    const movieRemoved = favorites[index];
    const newFavs = favorites.filter((_, i) => i !== index);
    setFavorites(newFavs);

    // Re-sync all ranks to maintain order 1 to length
    const { error: deleteError } = await supabase.from('favorite_movies').delete().eq('user_id', user.id);
    if (deleteError) {
      console.error(deleteError);
      toast.error('Error al actualizar Top', { description: deleteError.message });
      return;
    }

    let hasError = false;
    for (let i = 0; i < newFavs.length; i++) {
      const { error: insertError } = await supabase.from('favorite_movies').insert({
        user_id: user.id,
        tmdb_id: newFavs[i].id,
        rank: i + 1
      });
      if (insertError) hasError = true;
    }

    if (hasError) {
      toast.error('Ocurrió un problema al reordenar tu Top.');
    } else {
      toast.info('Película eliminada', { description: `${movieRemoved.title} removida de tu lista.` });
    }
  };

  const exportAsImage = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await htmlToImage.toJpeg(exportRef.current, { 
        cacheBust: true, 
        pixelRatio: 2,
        skipFonts: false,
        quality: 0.95,
        backgroundColor: '#171717'
      });
      const link = document.createElement('a');
      link.download = `meowiew-top-${user.username}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error exportando la imagen:', err);
      toast.error('Ocurrió un error al generar tu imagen', {
        description: 'Por favor, intenta nuevamente en unos segundos.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-2 block">{language === 'es' ? 'Tu Selección' : 'Your Selection'}</span>
          <h2 className="font-display text-4xl md:text-5xl italic text-white">
            {language === 'es' ? 'Tu Selección Editorial' : 'Your Editorial Selection'}
          </h2>
        </div>
        {favorites.length > 0 && (
          <button 
            onClick={exportAsImage}
            disabled={isExporting}
            className="px-8 py-3 border-[0.5px] border-primary/40 font-body text-[10px] uppercase tracking-[0.2em] text-on-surface hover:bg-primary hover:text-on-primary hover:shadow-[0_0_30px_rgba(236,178,255,0.2)] transition-all duration-500 cubic-out flex items-center gap-3 w-fit"
          >
            {isExporting ? <Download className="w-4 h-4 animate-bounce" /> : <Share2 className="w-4 h-4" />}
            {isExporting ? (language === 'es' ? 'Preparando...' : 'Preparing...') : (language === 'es' ? 'Exportar Editorial' : 'Export Editorial')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
        {favorites.map((movie, index) => (
          <div 
            key={movie.id} 
            className={`relative group animate-in fade-in slide-in-from-bottom-8 duration-700 cubic-out`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="relative aspect-[2/3] overflow-hidden rounded-[2rem] border border-white/5 shadow-2xl transition-all duration-700 cubic-out group-hover:border-primary/30 group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.6)] group-hover:-translate-y-2">
              <img 
                src={tmdb.getImageUrl(movie.poster_path, 'w500')} 
                alt={movie.title}
                className="w-full h-full object-cover transition-transform duration-[1500ms] cubic-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
              
              <div className="absolute top-6 left-6 flex flex-col">
                <span className="font-display text-4xl italic text-primary/40 group-hover:text-primary transition-colors leading-none">
                  0{index + 1}
                </span>
                <div className="w-8 h-[1px] bg-primary/20 mt-2"></div>
              </div>

              <div className="absolute bottom-6 left-6 right-6">
                <p className="font-display text-xl text-white italic leading-tight mb-1">{movie.title}</p>
                <p className="font-body text-[10px] uppercase tracking-[0.2em] text-on-surface-variant opacity-60">
                  {movie.release_date?.split('-')[0]}
                </p>
              </div>

              <button 
                onClick={() => removeFavorite(index)}
                className="absolute top-6 right-6 p-2 glass-card border border-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 hover:text-red-500 hover:rotate-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {favorites.length < 5 && (
          <div className="relative animate-in fade-in zoom-in-95 duration-700">
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full aspect-[2/3] border-[0.5px] border-dashed border-white/10 hover:border-primary/40 rounded-[2rem] flex flex-col items-center justify-center bg-white/[0.02] hover:bg-primary/[0.03] transition-all duration-700 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(236,178,255,0.03),_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="metallic-plate p-5 rounded-full mb-4 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(236,178,255,0.1)] transition-all duration-500 relative z-10">
                <Plus className="w-6 h-6 text-on-surface-variant group-hover:text-primary transition-colors" />
              </div>
              
              <div className="text-center relative z-10">
                <span className="font-body text-[10px] uppercase tracking-[0.3em] text-on-surface-variant group-hover:text-primary transition-colors block mb-1">
                  {language === 'es' ? 'Añadir' : 'Add'}
                </span>
                <span className="font-display italic text-lg text-white/20 group-hover:text-white/40 transition-colors">
                  {language === 'es' ? 'Siguiente Obra' : 'Next Masterpiece'}
                </span>
              </div>

              <div className="absolute -bottom-4 -right-4 font-display text-[120px] italic text-white/[0.02] group-hover:text-primary/[0.03] transition-colors leading-none select-none">
                0{favorites.length + 1}
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Tarjeta Oculta para Exportar - Rediseño Editorial */}
      <div className="fixed top-[-9999px] left-[-9999px] pointer-events-none">
        <div 
          ref={exportRef} 
          className="w-[1200px] h-[1600px] bg-black p-24 flex flex-col font-sans relative overflow-hidden"
          style={{ backgroundColor: '#000000' }}
        >
          {/* Fondo sutil con gradiente y textura */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(236,178,255,0.05),_transparent_70%)]"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>

          {/* Header Editorial */}
          <div className="relative z-10 flex justify-between items-start mb-32">
            <div>
              <p className="font-body text-primary tracking-[0.4em] uppercase text-xl mb-4">Editorial Selection</p>
              <h1 className="font-display text-[120px] text-white leading-none italic">
                The Essential <br />
                <span className="text-primary">Five.</span>
              </h1>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Cat className="w-6 h-6 text-white" />
                <div className="font-display text-4xl text-white italic">MeoWiew</div>
              </div>
              <p className="font-body text-white/40 tracking-[0.2em] uppercase text-sm">Issue No. 01 — 2024</p>
            </div>
          </div>

          {/* Grid Asimétrico */}
          <div className="relative z-10 flex-1 grid grid-cols-12 grid-rows-6 gap-12">
            {/* Película 1 - Grande Izquierda */}
            {favorites[0] && (
              <div className="col-span-8 row-span-3 relative overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl">
                <img src={base64Images[favorites[0].id]} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-12 left-12">
                  <span className="font-display text-[100px] text-primary/40 italic leading-none mb-4 block">01</span>
                  <h2 className="font-display text-6xl text-white italic">{favorites[0].title}</h2>
                </div>
              </div>
            )}

            {/* Película 2 - Derecha Superior */}
            {favorites[1] && (
              <div className="col-span-4 row-span-2 relative overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl mt-12">
                <img src={base64Images[favorites[1].id]} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-8 left-8">
                  <span className="font-display text-6xl text-primary/40 italic leading-none mb-2 block">02</span>
                  <h2 className="font-display text-3xl text-white italic">{favorites[1].title}</h2>
                </div>
              </div>
            )}

            {/* Película 3 - Derecha Inferior (Pequeña) */}
            {favorites[2] && (
              <div className="col-span-4 row-span-2 relative overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl">
                <img src={base64Images[favorites[2].id]} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-8 left-8">
                  <span className="font-display text-6xl text-primary/40 italic leading-none mb-2 block">03</span>
                  <h2 className="font-display text-3xl text-white italic">{favorites[2].title}</h2>
                </div>
              </div>
            )}

            {/* Película 4 - Izquierda Inferior */}
            {favorites[3] && (
              <div className="col-span-5 row-span-3 relative overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl -mt-12">
                <img src={base64Images[favorites[3].id]} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-12 left-12">
                  <span className="font-display text-[80px] text-primary/40 italic leading-none mb-4 block">04</span>
                  <h2 className="font-display text-4xl text-white italic">{favorites[3].title}</h2>
                </div>
              </div>
            )}

            {/* Película 5 - Derecha Media */}
            {favorites[4] && (
              <div className="col-span-7 row-span-2 relative overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl">
                <img src={base64Images[favorites[4].id]} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-12 left-12">
                  <span className="font-display text-[80px] text-primary/40 italic leading-none mb-4 block">05</span>
                  <h2 className="font-display text-4xl text-white italic">{favorites[4].title}</h2>
                </div>
              </div>
            )}
          </div>

          {/* Footer Editorial */}
          <div className="relative z-10 mt-24 pt-12 border-t border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 overflow-hidden">
                {avatarBase64 && <img src={avatarBase64} className="w-full h-full object-cover" />}
              </div>
              <div>
                <p className="font-body text-white/40 tracking-widest uppercase text-xs mb-1">Curated by</p>
                <p className="font-display text-3xl text-white italic">@{user.username}</p>
              </div>
            </div>
            <div className="font-body text-white/20 tracking-[0.5em] uppercase text-sm italic">
              Cinematic Noir Experience
            </div>
          </div>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-500">
          <div className="glass-card border border-white/10 p-8 rounded-3xl w-full max-w-xl shadow-[0_40px_80px_rgba(0,0,0,0.8)]">
            <div className="flex justify-between items-center mb-8">
              <div>
                <span className="font-body text-[10px] uppercase tracking-[0.2em] text-primary mb-1 block">{language === 'es' ? 'Búsqueda' : 'Search'}</span>
                <h3 className="font-display text-2xl italic text-white">{language === 'es' ? 'Añadir a tu Selección' : 'Add to your Selection'}</h3>
              </div>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-5 h-5 text-on-surface-variant" /></button>
            </div>
            <div className="relative mb-8">
              <input 
                type="text" autoFocus
                value={query} onChange={e => setQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 font-body text-sm text-white outline-none focus:border-primary/40 focus:bg-white/10 transition-all"
              />
              <Search className="absolute left-4 top-4 w-5 h-5 text-on-surface-variant" />
            </div>
            <div className="max-h-80 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {results.length > 0 ? results.map(m => (
                <button 
                  key={m.id} 
                  onClick={() => handleSelectMovie(m)} 
                  className="flex items-center gap-4 text-left p-3 hover:bg-white/5 rounded-2xl w-full transition-all border border-transparent hover:border-white/5 group"
                >
                  <div className="w-12 h-18 relative flex-shrink-0">
                    {m.poster_path ? (
                      <img src={tmdb.getImageUrl(m.poster_path, 'w500')} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="w-full h-full bg-white/5 rounded-lg flex items-center justify-center"><Plus className="w-4 h-4 text-white/10" /></div>
                    )}
                  </div>
                  <div>
                    <p className="font-body text-sm font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{m.title}</p>
                    <p className="font-body text-xs text-on-surface-variant">{m.release_date?.split('-')[0]}</p>
                  </div>
                </button>
              )) : query.length > 2 ? (
                <p className="text-center py-8 font-body text-xs uppercase tracking-widest text-on-surface-variant opacity-50">{language === 'es' ? 'No se encontraron resultados' : 'No results found'}</p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
