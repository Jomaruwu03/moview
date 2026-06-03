import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { tmdb } from '@/lib/tmdb';
import { ProfileClient } from './ProfileClient';

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const supabase = await createClient();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', decodedUsername)
    .single();

  if (!profile) {
    return {
      title: 'Perfil no encontrado - MeoWiew',
    };
  }

  return {
    title: `@${profile.username} en MeoWiew - Archivo Cinematográfico`,
    description: `Explora el perfil, las colecciones editoriales y las críticas de cine y series de @${profile.username} en MeoWiew.`,
  };
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const supabase = await createClient();

  // 1. Obtener perfil
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', decodedUsername)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  // 2. Obtener contadores de seguidos/seguidores
  const { count: followersCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profile.id);

  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profile.id);

  // 3. Obtener si el usuario logueado sigue al perfil
  const { data: userData } = await supabase.auth.getUser();
  const loggedInUserId = userData?.user?.id || null;
  let isFollowing = false;

  if (loggedInUserId) {
    const { data: followRecord } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', loggedInUserId)
      .eq('following_id', profile.id)
      .maybeSingle();
      
    isFollowing = !!followRecord;
  }

  // 4. Cargar favoritos (favorite_movies) y sus detalles de TMDB
  const { data: favorites } = await supabase
    .from('favorite_movies')
    .select('rank, tmdb_id')
    .eq('user_id', profile.id)
    .order('rank', { ascending: true });

  const favoriteMoviesWithDetails = [];
  for (const fav of favorites || []) {
    const isTV = fav.tmdb_id < 0;
    const realTmdbId = Math.abs(fav.tmdb_id);
    try {
      const detail = isTV 
        ? await tmdb.getTVShow(realTmdbId.toString(), 'es')
        : await tmdb.getMovie(realTmdbId.toString(), 'es');
      favoriteMoviesWithDetails.push({
        ...fav,
        movie: detail
      });
    } catch (err) {
      console.error(`Error loading tmdb favorite ${fav.tmdb_id}:`, err);
    }
  }

  // 5. Cargar críticas (reviews) y sus detalles de TMDB
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, review_text, created_at, tmdb_id')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  const reviewsWithDetails = [];
  for (const rev of reviews || []) {
    const isTV = rev.tmdb_id < 0;
    const realTmdbId = Math.abs(rev.tmdb_id);
    try {
      const detail = isTV 
        ? await tmdb.getTVShow(realTmdbId.toString(), 'es')
        : await tmdb.getMovie(realTmdbId.toString(), 'es');
      reviewsWithDetails.push({
        ...rev,
        movie: detail
      });
    } catch (err) {
      console.error(`Error loading tmdb review ${rev.tmdb_id}:`, err);
    }
  }

  // 6. Cargar listas públicas (custom_lists)
  const { data: lists } = await supabase
    .from('custom_lists')
    .select('*')
    .eq('user_id', profile.id)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  return (
    <ProfileClient 
      profile={profile}
      followersCountInit={followersCount || 0}
      followingCountInit={followingCount || 0}
      isFollowingInit={isFollowing}
      loggedInUserId={loggedInUserId}
      favoriteMovies={favoriteMoviesWithDetails}
      reviews={reviewsWithDetails}
      lists={lists || []}
      language="es"
    />
  );
}
