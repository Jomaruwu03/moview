-- 4. Tabla de Películas Favoritas (Top 4 estilo Letterboxd)
create table public.favorite_movies (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  tmdb_id bigint references public.movies(tmdb_id) on delete cascade not null,
  rank smallint check (rank >= 1 and rank <= 5) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Un usuario solo puede tener una película en una posición a la vez
  unique(user_id, rank),
  -- Un usuario no puede tener la misma película repetida en su top
  unique(user_id, tmdb_id)
);

-- RLS para favoritas
alter table public.favorite_movies enable row level security;
create policy "Favoritas son de lectura pública" on public.favorite_movies for select using (true);
create policy "Usuarios pueden insertar sus favoritas" on public.favorite_movies for insert with check (auth.uid() = user_id);
create policy "Usuarios pueden editar sus favoritas" on public.favorite_movies for update using (auth.uid() = user_id);
create policy "Usuarios pueden borrar sus favoritas" on public.favorite_movies for delete using (auth.uid() = user_id);
