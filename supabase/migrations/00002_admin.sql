-- Agregar columna is_admin a la tabla profiles
alter table public.profiles add column if not exists is_admin boolean default false;

-- Permitir a los administradores borrar cualquier reseña
create policy "Administradores pueden borrar cualquier reseña" on public.reviews
  for delete using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- Permitir a los administradores borrar perfiles
create policy "Administradores pueden borrar perfiles" on public.profiles
  for delete using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );
