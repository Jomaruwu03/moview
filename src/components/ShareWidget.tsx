'use client';

import { useRef, useState, useEffect } from 'react';
import { toJpeg } from 'html-to-image';
import { Star, Share2, Cat } from 'lucide-react';
import { tmdb } from '@/lib/tmdb';

function useImageBase64(url: string | undefined) {
  const [base64, setBase64] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!url) {
      setBase64('');
      return;
    }
    
    // Si ya es base64, no hacer nada
    if (url.startsWith('data:')) {
      setBase64(url);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    
    // Corregir estilos obsoletos/inválidos de Dicebear (como cats) a un estilo válido (como avataaars)
    let targetUrl = url;
    if (url.includes('dicebear.com') && url.includes('/cats/')) {
      targetUrl = url.replace('/cats/', '/avataaars/');
    }
    
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(targetUrl)}`;
    
    fetch(proxyUrl, { signal: controller.signal })
      .then(res => {
        if (!res.ok) {
          // No lanzamos error para evitar alarmas en consola, usamos fallback silencioso
          setBase64(targetUrl);
          setIsLoading(false);
          return null;
        }
        return res.blob();
      })
      .then(blob => {
        if (!blob) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          setBase64(reader.result as string);
          setIsLoading(false);
        };
        reader.readAsDataURL(blob);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          // Fallback silencioso al URL original corregido
          setBase64(targetUrl);
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [url]);

  return { base64, isLoading };
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

export function ShareWidget({ movie, rating, reviewText = '', user, backgroundMode = 'poster', theme = 'modern' }: ShareWidgetProps) {
  const { language } = useLanguage();
  const widgetRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const [isExporting, setIsExporting] = useState(false);

  const getFontSizeClass = (text: string) => {
    if (!text) return 'text-5xl';
    if (text.length > 100) return 'text-2xl sm:text-3xl md:text-4xl';
    if (text.length > 50) return 'text-3xl sm:text-4xl md:text-5xl';
    return 'text-5xl';
  };

  const getNoirFontSizeClass = (text: string) => {
    if (!text) return 'text-4xl';
    if (text.length > 100) return 'text-xl sm:text-2xl md:text-3xl';
    if (text.length > 50) return 'text-2xl sm:text-3xl md:text-4xl';
    return 'text-4xl';
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      const width = containerRef.current?.getBoundingClientRect().width || 0;
      if (width > 0) {
        setScale(width / 1080);
      }
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    
    window.addEventListener('resize', updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  const backdropUrl = tmdb.getImageUrl(movie.backdrop_path, 'original');
  const posterUrl = tmdb.getImageUrl(movie.poster_path);
  
  const backdrop = useImageBase64(backdropUrl);
  const poster = useImageBase64(posterUrl);
  const avatar = useImageBase64(user.avatar_url);

  const isReadyToExport = !backdrop.isLoading && !poster.isLoading && !avatar.isLoading;
  const movieTitle = movie.title || movie.name || '';
  const movieYear = (movie.release_date || movie.first_air_date || '').split('-')[0];

  const exportImage = async () => {
    if (!widgetRef.current) return;
    setIsExporting(true);
    
    const toastId = toast.loading(language === 'es' ? 'Preparando tu Critique...' : 'Preparing your Critique...');

    const options = { 
      cacheBust: true, 
      quality: 0.95, 
      backgroundColor: '#0a0a0a',
      pixelRatio: 2,
      style: {
        borderRadius: '0',
        transform: 'scale(1)',
      }
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const dataUrl = await toJpeg(widgetRef.current, options);
      
      if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        try {
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          const file = new File([blob], `critique-${movie.id}.jpg`, { type: 'image/jpeg' });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Critique: ${movieTitle}`,
              text: language === 'es' ? `Mi reseña de ${movieTitle} en MeoWiew` : `My review of ${movieTitle} on MeoWiew`,
            });
            toast.success(
              language === 'es' ? '¡Critique lista para compartir!' : 'Critique ready to share!',
              { 
                id: toastId,
                description: language === 'es' 
                  ? 'Selecciona Instagram Stories o tu red social favorita en el menú.' 
                  : 'Select Instagram Stories or your favorite social network from the menu.'
              }
            );
            setIsExporting(false);
            return;
          }
        } catch (shareErr) {
          console.log('Native share failed or cancelled, falling back to download:', shareErr);
        }
      }

      const link = document.createElement('a');
      link.download = `critique-${movie.id}.jpeg`;
      link.href = dataUrl;
      link.click();
      toast.success(
        language === 'es' 
          ? '¡Critique descargada con éxito!' 
          : 'Critique downloaded successfully!',
        { 
          id: toastId,
          description: language === 'es'
            ? '¡Abre Instagram y sube la imagen de tu galería a tus Historias!'
            : 'Open Instagram and upload the image from your gallery to your Stories!'
        }
      );
    } catch (err: any) {
      console.error('Error generating image:', err);
      toast.error(language === 'es' ? 'Error al generar la imagen' : 'Failed to generate image', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const isDark = backgroundMode === 'dark';

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-full overflow-hidden">
      <div 
        ref={containerRef}
        className="relative w-full max-w-[450px] aspect-[9/16] flex justify-center overflow-hidden rounded-3xl border border-white/5 bg-neutral-950 shadow-inner"
      >
        <div 
          className="absolute top-0 left-0 origin-top-left"
          style={{ 
            transform: `scale(${scale})`,
            width: '1080px',
            height: '1920px'
          }}
        >
          <div 
            ref={widgetRef} 
            className={`w-[1080px] h-[1920px] flex items-center justify-center p-8 overflow-hidden relative rounded-3xl ${isDark ? 'bg-neutral-950' : 'bg-neutral-900 shadow-2xl'}`}
            style={{ aspectRatio: '9/16' }}
          >
            {!isDark && backdrop.base64 && (
              <img 
                src={backdrop.base64} 
                alt="backdrop" 
                crossOrigin="anonymous"
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
                {avatar.base64 && (
                  <img src={avatar.base64} alt={user.username} crossOrigin="anonymous" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex flex-col">
                <p className="font-display text-3xl italic text-white leading-none mb-2">@{user.username}</p>
                <p className="font-body text-primary/60 text-sm uppercase tracking-[0.2em] font-bold">{new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="w-[480px] h-[720px] rounded-[2.5rem] overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.9)] mb-16 border border-white/10 bg-surface">
              {poster.base64 && (
                <img src={poster.base64} alt={movieTitle} crossOrigin="anonymous" className="w-full h-full object-cover" />
              )}
            </div>

            <h2 className={`font-display italic text-center mb-6 drop-shadow-md max-w-[750px] leading-tight text-white ${
              movieTitle.length > 40 ? 'text-5xl' :
              movieTitle.length > 20 ? 'text-6xl' :
              'text-8xl'
            }`}>
              {movieTitle}
            </h2>
            <p className="font-body text-primary/40 text-xl mb-16 uppercase tracking-[0.4em] font-bold italic">{movieYear}</p>

            <div className="flex gap-6 mb-16">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFull = rating >= star;
                const isHalf = rating >= star - 0.5 && rating < star;
                return (
                  <div key={star} className="relative w-20 h-20">
                    <Star className="w-20 h-20 text-white/5 fill-white/5" />
                    {(isFull || isHalf) && (
                      <div className={`absolute top-0 left-0 h-full overflow-hidden ${isHalf ? 'w-[50%]' : 'w-full'}`}>
                        <Star className="w-20 h-20 max-w-none text-primary fill-primary shadow-[0_0_30px_rgba(212,178,255,0.5)]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {reviewText && (
              <div className="relative mb-20 max-w-full w-full px-4">
                <p className={`font-serif font-bold italic text-white text-center leading-relaxed max-w-[750px] break-words mx-auto ${getFontSizeClass(reviewText)}`}>
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
                    {poster.base64 && <img src={poster.base64} crossOrigin="anonymous" className="w-full h-full object-cover" />}
                  </div>
                </div>

                <div className="flex-1 pt-12 min-w-0">
                  <div className="mb-12">
                    <p className="font-body text-primary text-xl uppercase tracking-[0.4em] font-bold mb-4">Case File No. {movie.id % 10000}</p>
                    <h2 className="font-display text-7xl text-white italic leading-tight mb-4 break-words">{movieTitle}</h2>
                    <p className="font-display text-3xl text-on-surface-variant italic opacity-60">{movieYear}</p>
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
                              <Star className="w-12 h-12 max-w-none text-primary fill-primary shadow-[0_0_20px_rgba(212,178,255,0.4)]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {reviewText && (
                    <div className="relative max-w-full">
                      <p className={`font-serif font-bold italic text-white leading-relaxed relative z-10 break-words ${getNoirFontSizeClass(reviewText)}`}>
                        "{reviewText}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-32 w-full flex justify-between items-end border-t border-white/10 pt-12">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-primary/20">
                    {avatar.base64 && <img src={avatar.base64} crossOrigin="anonymous" className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <p className="font-body text-white/40 text-xs uppercase tracking-widest mb-1">Reviewed by</p>
                    <p className="font-display text-2xl text-white italic mb-1">@{user.username}</p>
                    <p className="font-body text-primary/60 text-[10px] uppercase tracking-[0.15em] font-bold">
                      {new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
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
        className="px-12 py-4 border-[0.5px] border-primary/40 font-body text-xs uppercase tracking-[0.2em] text-on-surface hover:bg-primary hover:text-on-primary hover:shadow-[0_0_30px_rgba(212,178,255,0.2)] transition-all duration-500 cubic-out flex items-center gap-3 disabled:opacity-30"
      >
        {isExporting ? <span className="animate-pulse">{language === 'es' ? 'Generando...' : 'Generating...'}</span> : (!isReadyToExport ? (language === 'es' ? 'Cargando assets...' : 'Loading assets...') : <><Share2 className="w-4 h-4" /> {language === 'es' ? 'Compartir Critique' : 'Share Critique'}</>)}
      </button>
    </div>
  );
} 
