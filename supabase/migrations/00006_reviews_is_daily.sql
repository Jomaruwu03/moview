-- Añadir columna is_daily a la tabla de reseñas para identificar retos diarios
ALTER TABLE public.reviews ADD COLUMN is_daily boolean DEFAULT false NOT NULL;
