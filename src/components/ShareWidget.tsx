'use client';

import { useRef, useState, useEffect } from 'react';
import { toJpeg } from 'html-to-image';
import { Star, Share2, Cat } from 'lucide-react';
import { tmdb } from '@/lib/tmdb';

function useImageBase64(url: string | undefined) {
  const [base64, setBase64] = useState<string>('');
  useEffect(() => {
    if (!url) {
      setBase64('');
      return;
    }
    fetch(url, { mode: 'cors' })
      .then(res => {
        if (!res.ok) throw new Error('Network error');
        return res.blob();
      })
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => setBase64(reader.result as string);
        reader.readAsDataURL(blob);
      })
      .catch(err => {
        console.error('Error pre-cargando imagen', err);
        setBase64(url); // Fallback a la URL normal si falla la conversión
      });
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
  backgroundMode?: 'poster' | 'dark';
  theme?: 'modern' | 'noir-frame';
}

import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';

export function ShareWidget({ movie, rating, reviewText, user, backgroundMode = 'poster', theme = 'modern' }: ShareWidgetProps) {
  const { language } = useLanguage();
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
      // Small delay to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await toJpeg(widgetRef.current, { 
        cacheBust: true, 
        quality: 0.95, 
        backgroundColor: '#0a0a0a',
        pixelRatio: 2, // Higher quality
        style: {
          borderRadius: '0'
        }
      });
      
      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'meowiew-critique.jpg', { type: 'image/jpeg' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Reseña de ${movie.title}`,
            text: `Mira mi reseña de ${movie.title} en MeoWiew`,
            files: [file]
          });
          setIsExporting(false);
          return;
        }
      }
      
      const link = document.createElement('a');
      link.download = `meowiew-${movie.title.toLowerCase().replace(/\s+/g, '-')}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (error: any) {
      console.error('Error al generar imagen:', error);
      // Fallback: try skipping fonts if there's a cross-origin error
      if (error?.message?.includes('cross-origin') || error?.message?.includes('CSSStyleSheet')) {
        try {
          const dataUrl = await toJpeg(widgetRef.current, { 
            cacheBust: true, 
            skipFonts: true, 
            quality: 0.9, 
            backgroundColor: '#0a0a0a' 
          });
          const link = document.createElement('a');
          link.download = `meowiew-${movie.title.toLowerCase().replace(/\s+/g, '-')}-fallback.jpg`;
          link.href = dataUrl;
          link.click();
          toast.success('Exportado con éxito (modo compatibilidad)');
          return;
        } catch (innerError) {
          console.error('Fallback failed:', innerError);
        }
      }
      toast.error('Error de exportación', { description: 'Hubo un problema al generar la imagen.' });
    } finally {
      setIsExporting(false);
    }
  };

  const isDark = backgroundMode === 'dark';

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
      <div className="relative w-full h-[700px] sm:h-[850px] lg:h-[1000px] flex justify-center overflow-hidden rounded-3xl border border-white/5 bg-black/20">
        <div className="absolute top-8 origin-top transform scale-[0.32] sm:scale-[0.4] lg:scale-[0.48] transition-transform duration-700">
          <div 
            ref={widgetRef} 
            className={`w-[1080px] h-[1920px] flex items-center justify-center p-8 overflow-hidden relative rounded-3xl ${isDark ? 'bg-neutral-950' : 'bg-neutral-900 shadow-2xl'}`}
            style={{ aspectRatio: '9/16' }}
          >
            {!isDark && backdropBase64 && (
              <img 
                src={backdropBase64} 
                alt="backdrop" 
                className="absolute inset-0 w-full h-full object-cover opacity-60"
              />
            )}
            {!isDark && (
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/90"></div>
            )}

        {theme === 'modern' ? (
          <div className={`bg-black/60 border border-white/10 rounded-[4rem] p-20 w-full max-w-[850px] flex flex-col items-center text-white relative z-10 ${isDark ? 'shadow-none' : 'shadow-[0_40px_80px_rgba(0,0,0,0.8)]'}`}>
            <div className="flex items-center gap-8 mb-16 bg-white/10 px-10 py-5 rounded-full border border-white/5">
              <div className="w-20 h-20 rounded-full bg-surface-variant overflow-hidden border-2 border-primary/20">
                {avatarBase64 && (
                  <img src={avatarBase64} alt={user.username} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex flex-col">
                <p className="font-display text-3xl italic text-white leading-none mb-2">@{user.username}</p>
                <p className="font-body text-primary/60 text-sm uppercase tracking-[0.2em] font-bold">{new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="w-[480px] h-[720px] rounded-[2.5rem] overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.9)] mb-16 border border-white/10 bg-surface">
              {posterBase64 && (
                <img src={posterBase64} alt={movie.title} className="w-full h-full object-cover" />
              )}
            </div>

            <h2 className={`font-display italic text-center mb-6 drop-shadow-md max-w-[750px] leading-tight text-white ${
              movie.title.length > 40 ? 'text-5xl' :
              movie.title.length > 20 ? 'text-6xl' :
              'text-8xl'
            }`}>
              {movie.title}
            </h2>
            <p className="font-body text-primary/40 text-xl mb-16 uppercase tracking-[0.4em] font-bold italic">{movie.release_date?.split('-')[0]}</p>

            <div className="flex gap-6 mb-16">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFull = rating >= star;
                const isHalf = rating >= star - 0.5 && rating < star;
                return (
                  <div key={star} className="relative w-20 h-20">
                    <Star className="w-20 h-20 text-white/5 fill-white/5" />
                    {(isFull || isHalf) && (
                      <div className={`absolute top-0 left-0 h-full overflow-hidden ${isHalf ? 'w-[50%]' : 'w-full'}`}>
                        <Star className="w-20 h-20 max-w-none text-primary fill-primary shadow-[0_0_30px_rgba(236,178,255,0.5)]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {reviewText && (
              <div className="relative mb-20">
                <p className="font-display italic text-white/90 text-5xl text-center leading-relaxed max-w-[750px] break-words">
                  "{reviewText}"
                </p>
              </div>
            )}

            <div className="mt-12 pt-12 border-t border-white/10 w-full flex justify-between items-center px-4">
              <div className="flex items-center gap-2 opacity-20">
                <Cat className="w-6 h-6 text-white" />
                <p className="font-body text-white font-bold tracking-[0.5em] text-2xl uppercase">MEOWIEW</p>
              </div>
              <p className="font-body text-white/10 uppercase tracking-[0.2em] text-sm">Issue No. 01 — Cinema Editorial</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-20 relative z-10">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10"></div>
            
            <div className="relative z-10 w-full max-w-[900px] flex flex-col items-center">
              <div className="mb-20 flex flex-col items-center">
                <Cat className="w-16 h-16 text-primary/40 mb-6" />
                <h1 className="font-display text-[120px] text-white leading-none tracking-tighter uppercase mb-4">CRITIQUE</h1>
                <div className="w-40 h-1 bg-primary/20"></div>
              </div>

              <div className="flex gap-16 items-start w-full">
                <div className="w-[450px] aspect-[2/3] relative flex-shrink-0">
                  <div className="absolute -inset-4 border border-white/10 rounded-[3rem]"></div>
                  <div className="absolute -inset-8 border border-white/5 rounded-[4rem]"></div>
                  <div className="w-full h-full rounded-[2.5rem] overflow-hidden border border-white/20 shadow-[0_50px_100px_rgba(0,0,0,0.9)] relative z-10">
                    {posterBase64 && <img src={posterBase64} className="w-full h-full object-cover" />}
                  </div>
                </div>

                <div className="flex-1 pt-12">
                  <div className="mb-12">
                    <p className="font-body text-primary text-xl uppercase tracking-[0.4em] font-bold mb-4">Case File No. {movie.id % 10000}</p>
                    <h2 className="font-display text-7xl text-white italic leading-tight mb-4">{movie.title}</h2>
                    <p className="font-display text-3xl text-on-surface-variant italic opacity-60">{movie.release_date?.split('-')[0]}</p>
                  </div>

                  <div className="flex gap-4 mb-16">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFull = rating >= star;
                      const isHalf = rating >= star - 0.5 && rating < star;
                      return (
                        <div key={star} className="relative w-12 h-12">
                          <Star className="w-12 h-12 text-white/5 fill-white/5" />
                          {(isFull || isHalf) && (
                            <div className={`absolute top-0 left-0 h-full overflow-hidden ${isHalf ? 'w-[50%]' : 'w-full'}`}>
                              <Star className="w-12 h-12 max-w-none text-primary fill-primary shadow-[0_0_20px_rgba(236,178,255,0.4)]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {reviewText && (
                    <div className="relative">
                      <div className="absolute -left-8 top-0 text-primary/20 font-display text-9xl leading-none">"</div>
                      <p className="font-display italic text-white/90 text-4xl leading-relaxed relative z-10">
                        {reviewText}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-32 w-full flex justify-between items-end border-t border-white/10 pt-12">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-primary/20">
                    {avatarBase64 && <img src={avatarBase64} className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <p className="font-body text-white/40 text-xs uppercase tracking-widest mb-1">Reviewed by</p>
                    <p className="font-display text-2xl text-white italic">@{user.username}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-body text-white font-bold tracking-[0.5em] text-3xl uppercase mb-2">MEOWIEW</p>
                  <p className="font-body text-white/20 text-xs uppercase tracking-[0.2em]">Cinematic Noir Archive — 2026</p>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>

      <button 
        onClick={exportImage} 
        disabled={isExporting || !isReadyToExport}
        className="px-12 py-4 border-[0.5px] border-primary/40 font-body text-xs uppercase tracking-[0.2em] text-on-surface hover:bg-primary hover:text-on-primary hover:shadow-[0_0_30px_rgba(236,178,255,0.2)] transition-all duration-500 cubic-out flex items-center gap-3 disabled:opacity-30"
      >
        {isExporting ? <span className="animate-pulse">{language === 'es' ? 'Generando...' : 'Generating...'}</span> : (!isReadyToExport ? (language === 'es' ? 'Cargando assets...' : 'Loading assets...') : <><Share2 className="w-4 h-4" /> {language === 'es' ? 'Compartir Critique' : 'Share Critique'}</>)}
      </button>
    </div>
  );
} 
