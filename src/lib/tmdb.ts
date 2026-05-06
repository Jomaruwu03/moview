const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '';
const BASE_URL = 'https://api.themoviedb.org/3';

export const tmdb = {
  getTrending: async () => {
    const res = await fetch(`${BASE_URL}/trending/movie/day?language=es-ES`, {
      headers: {
        Authorization: `Bearer ${TMDB_API_KEY}`,
        accept: 'application/json',
      },
    });
    return res.json();
  },
  getMovie: async (id: string) => {
    const res = await fetch(`${BASE_URL}/movie/${id}?language=es-ES`, {
      headers: {
        Authorization: `Bearer ${TMDB_API_KEY}`,
        accept: 'application/json',
      },
    });
    return res.json();
  },
  searchMovies: async (query: string) => {
    const res = await fetch(`${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=es-ES`, {
      headers: {
        Authorization: `Bearer ${TMDB_API_KEY}`,
        accept: 'application/json',
      },
    });
    return res.json();
  },
  getImageUrl: (path: string, size: 'w500' | 'original' = 'w500') => {
    return path ? `https://image.tmdb.org/t/p/${size}${path}` : '';
  }
};
