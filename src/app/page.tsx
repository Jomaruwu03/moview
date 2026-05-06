import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { ReviewBuilder } from '@/components/ReviewBuilder';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Creador de Widgets',
  description: 'Generador interactivo para crear, personalizar y compartir widgets de tus reseñas de películas favoritas.',
};

export default async function Home() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const activeUser = profile || {
    username: user.user_metadata?.username || user.email?.split('@')[0] || 'usuario',
    avatar_url: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
              MoView
            </h1>
            <p className="text-neutral-400 text-sm">
              Bienvenido, @{activeUser.username}
            </p>
          </div>
          <form action="/auth/signout" method="post">
            <button className="text-sm border border-neutral-800 bg-neutral-900 px-4 py-2 rounded-full hover:bg-neutral-800 transition">
              Cerrar Sesión
            </button>
          </form>
        </header>

        <ReviewBuilder user={activeUser} />
      </div>
    </main>
  );
}
