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
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6 text-purple-400">
          <CalendarIcon className="w-6 h-6" />
          <h3 className="text-xl font-bold text-white">
            {new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' }).format(today)}
          </h3>
        </div>
        <div className="grid grid-cols-7 gap-2 md:gap-4 text-center mb-2">
          {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map((d, idx) => (
            <div key={idx} className="text-xs text-neutral-500 font-bold">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 md:gap-4">
          {days}
        </div>
        <div className="mt-6 flex items-center justify-between text-sm">
          <span className="text-neutral-400">{language === 'es' ? 'Racha actual:' : 'Current streak:'} <strong className="text-white">{watchedDates.length}</strong> {language === 'es' ? 'días' : 'days'}</span>
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
          <div className="flex flex-col items-center justify-center bg-neutral-900 border border-neutral-800 rounded-3xl p-12 text-center h-full min-h-[400px]">
            <div className="bg-purple-500/10 p-6 rounded-full mb-6">
              <Sparkles className="w-16 h-16 text-purple-400" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              {language === 'es' ? 'Tu Película Diaria te Espera' : 'Your Daily Movie Awaits'}
            </h3>
            <p className="text-neutral-400 mb-8 max-w-md mx-auto">
              {language === 'es' 
                ? 'Hemos seleccionado una de las 365 mejores películas calificadas de todos los tiempos especialmente para hoy.' 
                : 'We have selected one of the 365 highest-rated movies of all time especially for today.'}
            </p>
            <button
              onClick={() => handleReveal(false)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)] scale-100 hover:scale-105 active:scale-95 transition-all"
            >
              {language === 'es' ? 'Recomienda una película' : 'Recommend a movie'}
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-full min-h-[400px] bg-neutral-900 border border-neutral-800 rounded-3xl">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : movie ? (
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 bg-neutral-900 group animate-in fade-in zoom-in-95 duration-500">
            <div className="aspect-video relative overflow-hidden">
              <img 
                src={tmdb.getImageUrl(movie.backdrop_path || movie.poster_path, 'original')} 
                alt={movie.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/60 to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 mb-4 backdrop-blur-md">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {movie.vote_average.toFixed(1)} / 10
                </span>
                <h3 className="text-3xl md:text-5xl font-extrabold text-white mb-2 leading-tight">
                  {movie.title}
                </h3>
                <p className="text-neutral-300 max-w-2xl text-sm md:text-base line-clamp-3">
                  {movie.overview}
                </p>
              </div>
            </div>
            
            <div className="p-6 md:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between bg-neutral-900">
              <div className="flex-1">
                <h4 className="text-sm font-bold text-neutral-400 mb-3 flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" />
                  {language === 'es' ? 'Dónde ver:' : 'Where to watch:'}
                </h4>
                <div className="flex flex-wrap gap-3">
                  {streamProviders.length > 0 ? (
                    streamProviders.map((provider: any) => (
                      <div key={provider.provider_id} className="flex items-center gap-2 bg-neutral-950 pr-3 rounded-full border border-neutral-800 overflow-hidden" title={provider.provider_name}>
                        <img src={tmdb.getImageUrl(provider.logo_path)} alt={provider.provider_name} className="w-8 h-8 object-cover" />
                        <span className="text-xs font-medium text-neutral-300">{provider.provider_name}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-neutral-500 italic">
                      {language === 'es' ? 'No disponible en streaming en tu región.' : 'Not available for streaming in your region.'}
                    </span>
                  )}
                </div>
              </div>
              
              <button
                onClick={markAsWatched}
                disabled={hasWatchedToday}
                className={`
                  shrink-0 px-6 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all
                  ${hasWatchedToday 
                    ? 'bg-neutral-800 text-purple-400 border border-purple-500/30 cursor-default' 
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] scale-100 hover:scale-105 active:scale-95'
                  }
                `}
              >
                <Check className={`w-5 h-5 ${hasWatchedToday ? 'animate-bounce' : ''}`} />
                {hasWatchedToday 
                  ? (language === 'es' ? 'Vista hoy' : 'Watched today') 
                  : (language === 'es' ? '¡Ya la vi!' : 'I watched it!')}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Calendar Sidebar */}
      <div className="space-y-6">
        {renderCalendar()}
        
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CalendarIcon className="w-32 h-32 text-purple-500" />
          </div>
          <div className="relative z-10">
            <h4 className="text-lg font-bold text-white mb-2">
              {language === 'es' ? 'Reto 365 Días' : '365 Days Challenge'}
            </h4>
            <p className="text-sm text-neutral-400 mb-6">
              {language === 'es' ? 'Descubre y mira una película del Top 365 cada día. ¡Completa el calendario!' : 'Discover and watch one movie from the Top 365 every day. Complete the calendar!'}
            </p>
            
            <div className="w-full bg-neutral-950 rounded-full h-3 mb-2 overflow-hidden border border-neutral-800">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, (watchedDates.length / 365) * 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs font-bold text-neutral-500">
              <span>{watchedDates.length} / 365</span>
              <span>{((watchedDates.length / 365) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
