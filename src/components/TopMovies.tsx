'use client';

import { useState, useEffect, useRef } from 'react';
import { tmdb } from '@/lib/tmdb';
import { createClient } from '@/utils/supabase/client';
import { Search, Plus, X, Share2, Download } from 'lucide-react';
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
      const dataUrl = await htmlToImage.toPng(exportRef.current, { 
        cacheBust: true, 
        pixelRatio: 2,
        skipFonts: false
      });
      const link = document.createElement('a');
      link.download = `moview-top-${user.username}.png`;
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
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-neutral-300">
          {language === 'es' ? `Tu Top ${favorites.length > 0 ? favorites.length : 5} Películas` : `Your Top ${favorites.length > 0 ? favorites.length : 5} Movies`}
        </h2>
        {favorites.length > 0 && (
          <button 
            onClick={exportAsImage}
            disabled={isExporting}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 rounded-xl transition-all shadow-lg"
          >
            {isExporting ? <Download className="w-4 h-4 animate-bounce" /> : <Share2 className="w-4 h-4" />}
            {isExporting ? (language === 'es' ? 'Generando...' : 'Generating...') : (language === 'es' ? 'Compartir Top' : 'Share Top')}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        {favorites.map((movie, index) => (
          <div key={index} className="relative w-28 h-40 md:w-36 md:h-52 flex-shrink-0 group">
            <img 
              src={tmdb.getImageUrl(movie.poster_path, 'w500')} 
              alt={movie.title}
              className="w-full h-full object-cover rounded-xl border border-neutral-800 shadow-lg"
            />
            <div className="absolute top-2 left-2 bg-black/80 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-white/20">
              {index + 1}
            </div>
            <button 
              onClick={() => removeFavorite(index)}
              className="absolute -top-2 -right-2 bg-neutral-900 border border-neutral-700 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {favorites.length < 5 && (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-28 h-40 md:w-36 md:h-52 border-2 border-dashed border-neutral-800 hover:border-purple-500 rounded-xl flex flex-col items-center justify-center bg-neutral-900/30 hover:bg-neutral-800/50 transition-colors text-neutral-500 hover:text-white group"
          >
            <Plus className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-center px-2">{language === 'es' ? 'Añadir Película' : 'Add Movie'}</span>
          </button>
        )}
      </div>

      {/* Tarjeta Oculta para Exportar - Uso de Fixed off-screen para evitar que rompa el layout */}
      <div className="fixed top-[-9999px] left-[-9999px] pointer-events-none">
        <div 
          ref={exportRef} 
          className="w-[1200px] h-[800px] flex items-center justify-center bg-neutral-900 overflow-hidden relative font-sans"
        >
          {/* Fondo estilo ReviewBuilder */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/90 z-0"></div>
          {favorites.length > 0 && base64Images[favorites[0].id] && (
            <img 
              src={base64Images[favorites[0].id]} 
              className="absolute inset-0 w-full h-full object-cover opacity-30 blur-2xl transform scale-110" 
            />
          )}

          <div className="bg-black/60 border border-white/10 rounded-[3rem] p-12 w-[1000px] flex flex-col items-center text-white relative z-10 shadow-[0_40px_80px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between w-full mb-12">
              <div className="flex items-center gap-6 bg-white/10 px-8 py-4 rounded-full border border-white/5">
                <div className="w-16 h-16 rounded-full bg-neutral-800 overflow-hidden border-2 border-neutral-600">
                  {avatarBase64 && <img src={avatarBase64} alt={user.username} className="w-full h-full object-cover" />}
                </div>
                <div>
                  <p className="text-white/60 text-sm uppercase tracking-widest font-bold">{language === 'es' ? `Top ${favorites.length} Seleccionado por` : `Top ${favorites.length} Selected by`}</p>
                  <p className="font-medium text-2xl">@{user.username}</p>
                </div>
              </div>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                MoView
              </h1>
            </div>

            <div className="flex gap-6 justify-center items-end w-full mb-8">
              {favorites.map((movie, i) => (
                <div key={i} className="flex flex-col items-center gap-6">
                  <div className="relative w-[160px] h-[240px] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] border-2 border-white/10 bg-neutral-800 transform hover:scale-105 transition-transform">
                    {base64Images[movie.id] && (
                      <img src={base64Images[movie.id]} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-black text-xl text-white shadow-lg backdrop-blur-md">
                    {i + 1}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t-2 border-white/10 w-full text-center">
              <p className="text-white/40 font-bold tracking-[0.3em] text-xl">{language === 'es' ? 'DESCUBRE PELÍCULAS EN MOVIEW' : 'DISCOVER MOVIES ON MOVIEW'}</p>
            </div>
          </div>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">{language === 'es' ? `Añadir al Top ${favorites.length + 1}` : `Add to Top ${favorites.length + 1}`}</h3>
              <button onClick={() => setIsAdding(false)}><X className="w-5 h-5 text-neutral-400" /></button>
            </div>
            <div className="relative mb-4">
              <input 
                type="text" autoFocus
                value={query} onChange={e => setQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 outline-none focus:border-purple-500"
              />
              <Search className="absolute right-3 top-3 w-5 h-5 text-neutral-400" />
            </div>
            <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
              {results.map(m => (
                <button key={m.id} onClick={() => handleSelectMovie(m)} className="flex gap-3 text-left p-2 hover:bg-neutral-800 rounded-lg">
                  {m.poster_path ? (
                    <img src={tmdb.getImageUrl(m.poster_path, 'w500')} className="w-10 h-14 object-cover rounded" />
                  ) : <div className="w-10 h-14 bg-neutral-800 rounded" />}
                  <div>
                    <p className="font-bold text-sm line-clamp-1">{m.title}</p>
                    <p className="text-xs text-neutral-500">{m.release_date?.split('-')[0]}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
