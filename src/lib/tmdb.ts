const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '';
const BASE_URL = 'https://api.themoviedb.org/3';

export const tmdb = {
  getTrending: async (lang = 'es') => {
    const language = lang === 'en' ? 'en-US' : 'es-ES';
    const res = await fetch(`${BASE_URL}/trending/movie/day?language=${language}`, {
      headers: {
        Authorization: `Bearer ${TMDB_API_KEY}`,
        accept: 'application/json',
      },
      next: { revalidate: 3600 }, // Cache por 1 hora
    });
    return res.json();
  },
  getMovie: async (id: string, lang = 'es') => {
    const language = lang === 'en' ? 'en-US' : 'es-ES';
    const res = await fetch(`${BASE_URL}/movie/${id}?language=${language}`, {
      headers: {
        Authorization: `Bearer ${TMDB_API_KEY}`,
        accept: 'application/json',
      },
      next: { revalidate: 86400 }, // Cache por 24 horas (las películas no cambian seguido)
    });
    return res.json();
  },
  searchMovies: async (query: string, lang = 'es') => {
    const language = lang === 'en' ? 'en-US' : 'es-ES';
    const res = await fetch(`${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=${language}`, {
      headers: {
        Authorization: `Bearer ${TMDB_API_KEY}`,
        accept: 'application/json',
      },
      next: { revalidate: 86400 }, // Cache por 24 horas
    });
    return res.json();
  },
  getImageUrl: (path: string, size: 'w500' | 'original' = 'w500') => {
    return path ? `https://image.tmdb.org/t/p/${size}${path}` : '';
  }
};
