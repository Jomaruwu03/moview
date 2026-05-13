'use client';

import { useState, useEffect } from 'react';
import { tmdb } from '@/lib/tmdb';
import { createClient } from '@/utils/supabase/client';
import { Check, Calendar as CalendarIcon, PlayCircle, ExternalLink, Star, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';

export function DailyRecommendation({ user }: { user: any }) {
  const [movie, setMovie] = useState<any>(null);
  const [providers, setProviders] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [watchedDates, setWatchedDates] = useState<string[]>([]);
  const { language, t } = useLanguage();
  const supabase = createClient();

  const getDayOfYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const getPersonalIndex = () => {
    const dayOfYear = getDayOfYear();
    let hash = 0;
    const id = user.id || 'default';
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const userHash = Math.abs(hash);
    // Usa 137 (primo relativo a 365) para avanzar por todos los días sin repetir
    return (userHash + dayOfYear * 137) % 365;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.user_metadata) {
        if (currentUser.user_metadata.watched_dates) {
          setWatchedDates(currentUser.user_metadata.watched_dates);
        }
        if (currentUser.user_metadata.last_revealed_date === todayStr) {
          handleReveal(true);
        }
      }
    };
    loadData();
  }, [supabase.auth]);

  const handleReveal = async (isAutoLoad = false) => {
    if (!isAutoLoad) {
      setIsLoading(true);
      await supabase.auth.updateUser({
        data: { last_revealed_date: todayStr }
      });
    }
    setIsRevealed(true);
    
    try {
      const personalIndex = getPersonalIndex();
      const page = Math.floor(personalIndex / 20) + 1;
      const indexInPage = personalIndex % 20;

      const data = await tmdb.getTopRated(page, language);
      if (data.results && data.results.length > 0) {
        const dailyMovie = data.results[indexInPage] || data.results[0];
        setMovie(dailyMovie);

        // Fetch providers
        const providersData = await tmdb.getMovieProviders(dailyMovie.id.toString());
        const countryProviders = providersData.results?.[language === 'es' ? 'ES' : 'US'] || providersData.results?.['US'];
        setProviders(countryProviders);
      }
    } catch (error) {
      console.error("Error fetching daily movie:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsWatched = async () => {
    if (watchedDates.includes(todayStr)) return;
    
    const newDates = [...watchedDates, todayStr];
    setWatchedDates(newDates);
    
    const { error } = await supabase.auth.updateUser({
      data: { watched_dates: newDates }
    });

    if (error) {
      toast.error(language === 'es' ? 'Error al guardar' : 'Error saving', { description: error.message });
      // Revert if error
      setWatchedDates(watchedDates);
    } else {
      toast.success(
        language === 'es' ? '¡Felicitaciones por completar tu reto diario!' : 'Congratulations on completing your daily challenge!', 
        {
          description: language === 'es' 
            ? 'El arte cinematográfico no solo entretiene, sino que amplía nuestras perspectivas, genera empatía y nos conecta con historias universales. ¡Sigue así!' 
            : 'Cinema not only entertains but broadens our perspectives, builds empathy, and connects us with universal stories. Keep it up!',
          duration: 8000,
        }
      );
    }
  };

  // Generate calendar for current month
  const renderCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8 md:w-10 md:h-10"></div>);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isWatched = watchedDates.includes(dateStr);
      const isToday = dateStr === todayStr;
      
      days.push(
        <div 
          key={i} 
          className={`
            w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full text-xs md:text-sm font-medium transition-all
            ${isWatched ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]' : 'bg-neutral-900 text-neutral-400'}
            ${isToday && !isWatched ? 'border-2 border-purple-500 text-purple-400' : ''}
          `}
          title={isWatched ? (language === 'es' ? 'Película vista' : 'Movie watched') : ''}
        >
          {i}
        </div>
      );
    }
    
    return (
      <div className="glass-card border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6 text-primary">
          <CalendarIcon className="w-5 h-5" />
          <h3 className="font-display text-xl italic text-white">
            {new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' }).format(today)}
          </h3>
        </div>
        <div className="grid grid-cols-7 gap-2 md:gap-4 text-center mb-4">
          {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map((d, idx) => (
            <div key={idx} className="font-body text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 md:gap-4">
          {days}
        </div>
        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between font-body text-xs uppercase tracking-widest">
          <span className="text-on-surface-variant">{language === 'es' ? 'Racha:' : 'Streak:'} <strong className="text-primary">{watchedDates.length}</strong></span>
          <span className="text-on-surface-variant">{((watchedDates.length / 365) * 100).toFixed(1)}%</span>
        </div>
      </div>
    );
  };

  const hasWatchedToday = watchedDates.includes(todayStr);
  const streamProviders = providers?.flatrate || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Movie of the Day Card or Reveal Button */}
      <div className="lg:col-span-2 space-y-6">
        {!isRevealed ? (
          <div className="flex flex-col items-center justify-center glass-card border border-white/10 rounded-3xl p-12 text-center h-full min-h-[500px] relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="metallic-plate p-6 rounded-full mb-8 relative z-10">
              <Sparkles className="w-16 h-16 text-primary" />
            </div>
            <span className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-4 relative z-10">{language === 'es' ? 'Misterio Diario' : 'Daily Mystery'}</span>
            <h3 className="font-display text-4xl md:text-5xl italic text-white mb-6 relative z-10">
              {language === 'es' ? 'Tu Obra Maestra del Día' : 'Your Masterpiece of the Day'}
            </h3>
            <p className="font-body text-on-surface-variant mb-10 max-w-md mx-auto relative z-10 opacity-80 leading-relaxed">
              {language === 'es' 
                ? 'Hemos seleccionado una de las 365 mejores películas calificadas de todos los tiempos especialmente para hoy.' 
                : 'We have selected one of the 365 highest-rated movies of all time especially for today.'}
            </p>
            <button
              onClick={() => handleReveal(false)}
              className="px-12 py-4 border-[0.5px] border-primary/40 font-body text-xs uppercase tracking-[0.2em] text-on-surface hover:bg-primary hover:text-on-primary hover:shadow-[0_0_30px_rgba(236,178,255,0.2)] transition-all duration-500 cubic-out relative z-10"
            >
              {language === 'es' ? 'Revelar Selección' : 'Reveal Selection'}
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-full min-h-[500px] glass-card border border-white/10 rounded-3xl">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : movie ? (
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-surface group animate-in fade-in zoom-in-95 duration-700 cubic-out">
            <div className="aspect-[4/5] sm:aspect-video relative overflow-hidden">
              <img 
                src={tmdb.getImageUrl(movie.backdrop_path || movie.poster_path, 'original')} 
                alt={movie.title}
                className="w-full h-full object-cover transition-transform duration-[2000ms] cubic-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
                <div className="flex items-center gap-3 mb-6">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/20 text-primary text-xs font-bold border border-primary/30 backdrop-blur-md">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {movie.vote_average.toFixed(1)}
                  </span>
                  <span className="font-body text-xs uppercase tracking-[0.2em] text-on-surface-variant">{movie.release_date?.split('-')[0]}</span>
                </div>
                <h3 className="font-display text-4xl md:text-6xl italic text-white mb-4 leading-tight">
                  {movie.title}
                </h3>
                <p className="font-body text-on-surface-variant max-w-2xl text-sm md:text-lg line-clamp-3 opacity-80 leading-relaxed">
                  {movie.overview}
                </p>
              </div>
            </div>
            
            <div className="p-8 md:p-12 flex flex-col sm:flex-row gap-8 items-start sm:items-center justify-between bg-surface/50 backdrop-blur-xl border-t border-white/5">
              <div className="flex-1">
                <h4 className="font-body text-xs uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" />
                  {language === 'es' ? 'Dónde ver:' : 'Where to watch:'}
                </h4>
                <div className="flex flex-wrap gap-4">
                  {streamProviders.length > 0 ? (
                    streamProviders.map((provider: any) => (
                      <div key={provider.provider_id} className="flex items-center gap-3 bg-white/5 pr-4 rounded-full border border-white/10 overflow-hidden group/provider hover:bg-white/10 transition-colors" title={provider.provider_name}>
                        <img src={tmdb.getImageUrl(provider.logo_path)} alt={provider.provider_name} className="w-10 h-10 object-cover" />
                        <span className="font-body text-xs font-medium text-on-surface-variant group-hover/provider:text-primary transition-colors">{provider.provider_name}</span>
                      </div>
                    ))
                  ) : (
                    <span className="font-body text-sm text-on-surface-variant italic opacity-50">
                      {language === 'es' ? 'No disponible en streaming en tu región.' : 'Not available for streaming in your region.'}
                    </span>
                  )}
                </div>
              </div>
              
              <button
                onClick={markAsWatched}
                disabled={hasWatchedToday}
                className={`
                  shrink-0 px-10 py-4 border-[0.5px] font-body text-xs uppercase tracking-[0.2em] transition-all duration-500 cubic-out flex items-center gap-3
                  ${hasWatchedToday 
                    ? 'border-primary/20 text-primary/40 cursor-default' 
                    : 'border-primary/40 text-on-surface hover:bg-primary hover:text-on-primary hover:shadow-[0_0_30px_rgba(236,178,255,0.2)]'
                  }
                `}
              >
                <Check className={`w-4 h-4 ${hasWatchedToday ? '' : ''}`} />
                {hasWatchedToday 
                  ? (language === 'es' ? 'Completado' : 'Completed') 
                  : (language === 'es' ? 'Marcar como Vista' : 'Mark as Watched')}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Calendar Sidebar */}
      <div className="space-y-6">
        {renderCalendar()}
        
        <div className="glass-card border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <CalendarIcon className="w-24 h-24 text-primary" />
          </div>
          <div className="relative z-10">
            <h4 className="font-display text-lg italic text-white mb-2">
              {language === 'es' ? 'Reto 365 Días' : '365 Days Challenge'}
            </h4>
            <p className="font-body text-[11px] uppercase tracking-widest text-on-surface-variant mb-6 leading-relaxed opacity-70">
              {language === 'es' ? 'Descubre y mira una película del Top 365 cada día. ¡Completa el calendario!' : 'Discover and watch one movie from the Top 365 every day. Complete the calendar!'}
            </p>
            
            <div className="w-full bg-white/5 rounded-full h-1 mb-2 overflow-hidden border border-white/5">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(236,178,255,0.3)]"
                style={{ width: `${Math.min(100, (watchedDates.length / 365) * 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between font-body text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
              <span>{watchedDates.length} / 365</span>
              <span>{((watchedDates.length / 365) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
