import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardClient } from '@/components/DashboardClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MeoWiew - Dashboard',
  description: 'Generador interactivo para crear, personalizar y compartir widgets de tus reseñas de películas favoritas.',
};

interface HomeProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const params = await searchParams;
  const initialTab = (params.tab as string) || 'community';

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const activeUser = profile || {
    id: user.id,
    username: user.user_metadata?.username || user.email?.split('@')[0] || 'usuario',
    avatar_url: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
  };

  return <DashboardClient user={activeUser} initialTab={initialTab} />;
}
