-- 1. Agregar columna deleted_at a la tabla profiles para soft delete
alter table public.profiles add column if not exists deleted_at timestamp with time zone default null;

-- 2. Función helper para verificar si el usuario es administrador evitando recursión RLS
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
end;
$$ language plpgsql security definer;

-- 3. Actualizar políticas de RLS en profiles para soportar soft delete y administración
drop policy if exists "Perfiles son públicos" on public.profiles;
create policy "Perfiles son públicos" on public.profiles
  for select using (deleted_at is null or public.is_admin());

drop policy if exists "Usuarios pueden actualizar su propio perfil" on public.profiles;
create policy "Usuarios pueden actualizar su propio perfil" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

-- 4. Actualizar políticas de RLS en reviews para ocultar reseñas de usuarios eliminados
drop policy if exists "Reseñas son de lectura pública" on public.reviews;
create policy "Reseñas son de lectura pública" on public.reviews
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = reviews.user_id and profiles.deleted_at is null
    ) or public.is_admin()
  );

-- 5. Trigger para prevenir que un usuario se desactive a sí mismo (autodesactivación)
create or replace function public.prevent_self_soft_delete()
returns trigger as $$
begin
  if new.id = auth.uid() and new.deleted_at is not null then
    raise exception 'No puedes desactivar tu propia cuenta';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_prevent_self_soft_delete on public.profiles;
create trigger tr_prevent_self_soft_delete
  before update on public.profiles
  for each row
  execute procedure public.prevent_self_soft_delete();
