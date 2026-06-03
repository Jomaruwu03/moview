-- Tabla de Seguidores / Seguidos (Relación muchos a muchos de profiles)
create table public.follows (
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  primary key (follower_id, following_id),
  -- Evitar que un usuario se siga a sí mismo
  constraint no_self_follow check (follower_id <> following_id)
);

-- RLS (Row Level Security) para follows
alter table public.follows enable row level security;

create policy "Seguimientos son de lectura pública" 
  on public.follows for select 
  using (true);

create policy "Usuarios pueden seguir a otros" 
  on public.follows for insert 
  with check (auth.uid() = follower_id);

create policy "Usuarios pueden dejar de seguir" 
  on public.follows for delete 
  using (auth.uid() = follower_id);
