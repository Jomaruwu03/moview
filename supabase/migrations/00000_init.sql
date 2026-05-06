-- Habilitar la extensión UUID
create extension if not exists "uuid-ossp";

-- 1. Tabla de Usuarios (Extendiendo auth.users de Supabase)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Row Level Security) para perfiles
alter table public.profiles enable row level security;
create policy "Perfiles son públicos" on public.profiles for select using (true);
create policy "Usuarios pueden actualizar su propio perfil" on public.profiles for update using (auth.uid() = id);

-- 2. Tabla de Películas (Caché local de TMDB)
create table public.movies (
  tmdb_id bigint primary key,
  title text not null,
  poster_path text,
  backdrop_path text,
  release_date date,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS para películas (Lectura pública, escritura autenticada o via functions)
alter table public.movies enable row level security;
create policy "Películas son de lectura pública" on public.movies for select using (true);
create policy "Usuarios autenticados pueden cachear películas" on public.movies for insert with check (auth.role() = 'authenticated');

-- 3. Tabla de Reseñas (Reviews)
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  tmdb_id bigint references public.movies(tmdb_id) on delete restrict not null,
  rating smallint check (rating >= 1 and rating <= 5) not null,
  review_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Un usuario solo puede calificar una película una vez
  unique(user_id, tmdb_id)
);

-- RLS para reseñas
alter table public.reviews enable row level security;
create policy "Reseñas son de lectura pública" on public.reviews for select using (true);
create policy "Usuarios pueden insertar sus propias reseñas" on public.reviews for insert with check (auth.uid() = user_id);
create policy "Usuarios pueden editar sus propias reseñas" on public.reviews for update using (auth.uid() = user_id);
create policy "Usuarios pueden borrar sus propias reseñas" on public.reviews for delete using (auth.uid() = user_id);

-- Trigger para automatizar perfiles al registrarse (Opcional pero recomendado)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
