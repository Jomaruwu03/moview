'use client';

import { useRef, useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { Star, Share2 } from 'lucide-react';
import { tmdb } from '@/lib/tmdb';

// Hook para convertir URLs a Base64 y evitar la corrupción del canvas
function useImageBase64(url: string | undefined) {
  const [base64, setBase64] = useState<string>('');
  useEffect(() => {
    if (!url) return;
    fetch(url, { mode: 'cors' })
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => setBase64(reader.result as string);
        reader.readAsDataURL(blob);
      })
      .catch(err => console.error('Error pre-cargando imagen', err));
  }, [url]);
  return base64;
}

interface ShareWidgetProps {
  movie: any;
  rating: number;
  reviewText?: string;
  user: {
    username: string;
    avatar_url?: string;
  };
  backgroundMode?: 'poster' | 'transparent';
  theme?: 'modern' | 'retro-ticket';
}

export function ShareWidget({ movie, rating, reviewText, user, backgroundMode = 'poster', theme = 'modern' }: ShareWidgetProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Precargar imágenes en Base64
  const backdropUrl = tmdb.getImageUrl(movie.backdrop_path, 'original');
  const posterUrl = tmdb.getImageUrl(movie.poster_path);
  
  const backdropBase64 = useImageBase64(backdropUrl);
  const posterBase64 = useImageBase64(posterUrl);
  const avatarBase64 = useImageBase64(user.avatar_url);

  const isReadyToExport = (!backdropUrl || backdropBase64) && (!posterUrl || posterBase64) && (!user.avatar_url || avatarBase64);

  const exportImage = async () => {
    if (!widgetRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(widgetRef.current, { cacheBust: true, skipFonts: false });
      
      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'movie-rating.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Reseña de ${movie.title}`,
            text: `Mira mi reseña de ${movie.title} en MovieW`,
            files: [file]
          });
          setIsExporting(false);
          return;
        }
      }
      
      const link = document.createElement('a');
      link.download = `${movie.title.replace(/\s+/g, '-')}-rating.png`;
      link.href = dataUrl;
      link.click();
    } catch (error: any) {
      console.error('Error al generar imagen:', error?.message || error);
    } finally {
      setIsExporting(false);
    }
  };

  const isTransparent = backgroundMode === 'transparent';

  const ticketMaskStyle = {
    WebkitMaskImage: 'radial-gradient(circle at 0 0, transparent 60px, black 61px), radial-gradient(circle at 100% 0, transparent 60px, black 61px), radial-gradient(circle at 100% 100%, transparent 60px, black 61px), radial-gradient(circle at 0 100%, transparent 60px, black 61px)',
    WebkitMaskSize: '51% 51%',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'top left, top right, bottom left, bottom right'
  };

  const innerBorderMaskStyle = {
    WebkitMaskImage: 'radial-gradient(circle at 0 0, transparent 44px, black 45px), radial-gradient(circle at 100% 0, transparent 44px, black 45px), radial-gradient(circle at 100% 100%, transparent 44px, black 45px), radial-gradient(circle at 0 100%, transparent 44px, black 45px)',
    WebkitMaskSize: '51% 51%',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'top left, top right, bottom left, bottom right'
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="relative w-full h-[600px] sm:h-[800px] lg:h-[900px] flex justify-center overflow-hidden">
        <div className="absolute top-0 origin-top transform scale-[0.3] sm:scale-[0.4] lg:scale-[0.45]">
          <div 
            ref={widgetRef} 
            className={`w-[1080px] h-[1920px] flex items-center justify-center p-8 overflow-hidden relative rounded-3xl ${isTransparent ? 'bg-transparent' : 'bg-neutral-900 shadow-2xl'}`}
            style={{ aspectRatio: '9/16' }}
          >
            {!isTransparent && backdropBase64 && (
              <img 
                src={backdropBase64} 
                alt="backdrop" 
                className="absolute inset-0 w-full h-full object-cover opacity-60"
              />
            )}
            {!isTransparent && (
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/90"></div>
            )}

        {theme === 'modern' ? (
          <div className={`bg-black/60 border border-white/10 rounded-[3rem] p-16 w-full max-w-[800px] flex flex-col items-center text-white relative z-10 ${isTransparent ? 'shadow-none' : 'shadow-[0_40px_80px_rgba(0,0,0,0.8)]'}`}>
            <div className="flex items-center gap-6 mb-12 bg-white/10 px-8 py-4 rounded-full border border-white/5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 overflow-hidden">
                {avatarBase64 && (
                  <img src={avatarBase64} alt={user.username} className="w-full h-full object-cover" />
                )}
              </div>
              <p className="font-medium text-2xl">@{user.username} vio</p>
            </div>

            <div className="w-[440px] h-[660px] rounded-[2rem] overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)] mb-12 border-2 border-white/10 bg-neutral-800">
              {posterBase64 && (
                <img src={posterBase64} alt={movie.title} className="w-full h-full object-cover" />
              )}
            </div>

            <h2 className={`font-black text-center mb-6 drop-shadow-md max-w-[700px] leading-tight ${
              movie.title.length > 40 ? 'text-4xl' :
              movie.title.length > 20 ? 'text-5xl' :
              'text-6xl'
            }`}>
              {movie.title}
            </h2>
            <p className="text-white/60 text-3xl mb-12 font-medium">{movie.release_date?.split('-')[0]}</p>

            <div className="flex gap-4 mb-12">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFull = rating >= star;
                const isHalf = rating >= star - 0.5 && rating < star;
                return (
                  <div key={star} className="relative w-16 h-16">
                    <Star className="w-16 h-16 text-white/20 fill-white/20 drop-shadow-lg" />
                    {(isFull || isHalf) && (
                      <div className={`absolute top-0 left-0 h-full overflow-hidden ${isHalf ? 'w-[50%]' : 'w-full'}`}>
                        <Star className="w-16 h-16 max-w-none text-yellow-400 fill-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {reviewText && (
              <p className="text-center italic text-white/90 text-4xl mb-12 leading-relaxed max-w-[700px] break-words">
                "{reviewText}"
              </p>
            )}

            <div className="mt-12 pt-8 border-t-2 border-white/10 w-full text-center">
              <p className="text-white/40 font-bold tracking-[0.3em] text-2xl">MOVIEW</p>
            </div>
          </div>
        ) : (
          <div className="relative z-10 w-[860px] h-[1560px] bg-[#ecdab9] flex flex-col items-center p-16 shadow-[0_30px_60px_rgba(0,0,0,0.5)]" style={ticketMaskStyle}>
            {/* Inner double border */}
            <div className="absolute inset-4 border-8 border-[#1c1917] pointer-events-none" style={innerBorderMaskStyle}></div>
            
            {/* Side Numbers */}
            <div className="absolute left-[-60px] top-1/2 -translate-y-1/2 -rotate-90 text-[#b73038] font-mono text-5xl tracking-[0.4em] font-bold opacity-80 pointer-events-none whitespace-nowrap">
              {movie.release_date?.replace(/-/g, '') || '20260506'}
            </div>
            <div className="absolute right-[-60px] top-1/2 -translate-y-1/2 rotate-90 text-[#b73038] font-mono text-5xl tracking-[0.4em] font-bold opacity-80 pointer-events-none whitespace-nowrap">
              {movie.release_date?.replace(/-/g, '') || '20260506'}
            </div>

            {/* Header */}
            <h1 className="text-[100px] font-black uppercase tracking-tighter mt-12 mb-6 text-[#1c1917]" style={{ transform: 'scaleY(1.4)' }}>
              MOVIEW
            </h1>
            
            <div className="flex gap-4 mb-6 z-20">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFull = rating >= star;
                const isHalf = rating >= star - 0.5 && rating < star;
                return (
                  <div key={star} className="relative w-16 h-16">
                    <Star className="w-16 h-16 text-[#1c1917]/20 fill-[#1c1917]/20" />
                    {(isFull || isHalf) && (
                      <div className={`absolute top-0 left-0 h-full overflow-hidden ${isHalf ? 'w-[50%]' : 'w-full'}`}>
                        <Star className="w-16 h-16 max-w-none text-[#1c1917] fill-[#1c1917]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <h2 className="text-5xl font-serif font-bold text-[#b73038] uppercase tracking-widest mb-16 z-20">
              ADMIT ONE
            </h2>

            {/* Poster */}
            <div className="w-[400px] h-[600px] border-[10px] border-[#1c1917] mb-12 bg-white relative z-20 shadow-xl overflow-hidden">
              {posterBase64 && <img src={posterBase64} className="w-full h-full object-cover" />}
            </div>

            {/* Movie Title */}
            <h2 className={`font-black text-center mb-8 uppercase leading-tight text-[#1c1917] max-w-[600px] z-20 pb-2 break-words ${
              movie.title.length > 40 ? 'text-3xl' :
              movie.title.length > 20 ? 'text-4xl' :
              'text-5xl'
            }`}>
              {movie.title}
            </h2>

            {/* Guest Info */}
            <div className="w-[600px] flex items-center justify-between mb-8 font-mono text-3xl border-b-8 border-[#1c1917] pb-6 z-20">
              <div>
                <p className="font-bold text-[#b73038] mb-2">GUEST</p>
                <p className="font-bold text-[#1c1917]">@{user.username}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#b73038] mb-2">DATE</p>
                <p className="font-bold text-[#1c1917]">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Review Text */}
            {reviewText && (
              <div className="w-[600px] text-center mb-40 z-20">
                <p className="font-serif text-[#1c1917] text-3xl italic leading-relaxed break-words">"{reviewText}"</p>
              </div>
            )}

            {/* Barcode */}
            <div className="absolute bottom-16 w-[600px] flex justify-center gap-2 opacity-80 z-20">
               {[...Array(45)].map((_, i) => <div key={i} className="bg-[#1c1917] h-24" style={{width: `${Math.floor(Math.random() * 8) + 3}px`}}></div>)}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>

      <button 
        onClick={exportImage} 
        disabled={isExporting || !isReadyToExport}
        className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 shadow-lg text-lg"
      >
        {isExporting ? <span className="animate-pulse">Generando...</span> : (!isReadyToExport ? 'Cargando assets...' : <><Share2 className="w-5 h-5" /> Compartir en IG/X</>)}
      </button>
    </div>
  );
} 
