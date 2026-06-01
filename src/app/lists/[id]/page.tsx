import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { tmdb } from '@/lib/tmdb';
import { Cat, Calendar, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: list } = await supabase
    .from('custom_lists')
    .select('*, profiles(username)')
    .eq('id', id)
    .single();

  if (!list) {
    return {
      title: 'Lista no encontrada - MeoWiew',
    };
  }

  const username = list.profiles?.username || 'usuario';
  return {
    title: `${list.title} - por @${username} en MeoWiew`,
    description: list.description || `Mira la selección de películas de @${username} en MeoWiew.`,
  };
}

export default async function ListPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Obtener la lista
  const { data: list, error: listError } = await supabase
    .from('custom_lists')
    .select('*, profiles(*)')
    .eq('id', id)
    .single();

  if (listError || !list) {
    notFound();
  }

  // 2. Obtener las películas de la lista
  const { data: listMovies, error: moviesError } = await supabase
    .from('list_movies')
    .select('*')
    .eq('list_id', id)
    .order('rank', { ascending: true });

  if (moviesError) {
    notFound();
  }

  // 3. Cargar información de TMDB para cada película
  const moviesWithDetails = [];
  for (const item of listMovies || []) {
    try {
      const movieDetail = await tmdb.getMovie(item.tmdb_id.toString(), 'es');
      moviesWithDetails.push({
        ...item,
        movie: movieDetail
      });
    } catch (err) {
      console.error(`Error loading tmdb movie ${item.tmdb_id}:`, err);
    }
  }

  const author = list.profiles || {};

  return (
    <div className="min-h-screen bg-background text-on-background font-body selection:bg-primary/30 relative overflow-x-hidden">
      {/* Fondo decorativo */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_top_right,_rgba(212,178,255,0.05),_transparent_70%)] pointer-events-none"></div>

      {/* Header fijo minimalista */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/50 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-4 md:px-12 py-4">
        <Link href="/" className="flex items-center gap-2 group">
          <Cat className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
          <span className="font-display text-xl uppercase tracking-widest text-primary">
            MEOWIEW
          </span>
        </Link>
        <Link 
          href="/login"
          className="px-6 py-2 border border-white/10 hover:border-primary/40 font-body text-[10px] uppercase tracking-[0.2em] text-on-surface hover:bg-primary hover:text-on-primary transition-all duration-500 rounded-xl"
        >
          Crear mi Colección
        </Link>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-32 pb-24">
        {/* Enlace de regreso */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors mb-10 font-body"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la App
        </Link>

        {/* Cabecera de la Lista */}
        <div className="mb-16 border-b border-white/5 pb-12">
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-3 block">
            Colección Editorial
          </span>
          <h1 className="font-display text-4xl md:text-6xl italic text-white mb-6 leading-tight">
            {list.title}
          </h1>
          
          {list.description && (
            <p className="font-body text-sm md:text-base text-on-surface-variant max-w-2xl leading-relaxed mb-8 opacity-80">
              {list.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-6 text-xs text-on-surface-variant font-body opacity-60">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary/60" />
              <span>por <strong className="text-white">@{author.username || 'usuario'}</strong></span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary/60" />
              <span>{new Date(list.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Películas del Top */}
        <div className="space-y-12">
          {moviesWithDetails.map((item, index) => {
            const movie = item.movie;
            if (!movie) return null;

            return (
              <div 
                key={item.id}
                className="glass-card border border-white/5 rounded-[2.5rem] p-6 md:p-10 flex flex-col md:flex-row gap-8 items-center md:items-stretch hover:border-primary/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(212,178,255,0.01),_transparent_70%)] pointer-events-none"></div>
                
                {/* Ranking de gran tamaño */}
                <div className="absolute top-6 right-8 md:top-auto md:bottom-8 md:right-10 font-display text-[80px] md:text-[120px] italic text-primary/10 select-none pointer-events-none leading-none group-hover:text-primary/20 transition-colors">
                  0{item.rank}
                </div>

                {/* Carátula */}
                <div className="w-40 md:w-48 aspect-[2/3] relative rounded-2xl overflow-hidden flex-shrink-0 border border-white/10 shadow-xl group-hover:scale-102 transition-transform duration-500">
                  {movie.poster_path ? (
                    <img 
                      src={tmdb.getImageUrl(movie.poster_path, 'w500')} 
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center font-display text-4xl">?</div>
                  )}
                </div>

                {/* Detalles y Reseña */}
                <div className="flex-1 flex flex-col justify-between py-2 text-center md:text-left z-10 w-full">
                  <div>
                    <h2 className="font-display text-2xl md:text-3xl text-white italic leading-tight mb-2 group-hover:text-primary transition-colors">
                      {movie.title}
                    </h2>
                    <p className="font-body text-xs uppercase tracking-widest text-primary/60 mb-6">
                      {movie.release_date?.split('-')[0]}
                    </p>
                    
                    {item.user_note ? (
                      <div className="relative pl-0 md:pl-6 border-l-0 md:border-l-2 border-primary/20 mt-4">
                        <p className="font-body text-sm md:text-base text-on-surface italic leading-relaxed text-white/90">
                          &ldquo;{item.user_note}&rdquo;
                        </p>
                      </div>
                    ) : (
                      <p className="font-body text-xs text-on-surface-variant opacity-40 italic">
                        Sin comentario adicional
                      </p>
                    )}
                  </div>

                  {/* Rating o detalles de TMDB */}
                  {movie.vote_average && (
                    <div className="mt-8 flex items-center justify-center md:justify-start gap-2">
                      <span className="font-body text-[10px] uppercase tracking-widest text-on-surface-variant opacity-50">Calificación TMDB:</span>
                      <span className="font-display text-sm italic text-primary">{movie.vote_average.toFixed(1)} / 10</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t border-white/5 py-12 text-center text-xs text-on-surface-variant opacity-40 font-body">
        <p>&copy; 2026 MeoWiew. Hecho con pasión por el séptimo arte.</p>
      </footer>
    </div>
  );
}
