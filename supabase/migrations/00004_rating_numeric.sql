-- Alter reviews.rating to numeric(2,1) to support decimal ratings like 4.5
alter table public.reviews alter column rating type numeric(2,1);

-- Drop the old integer constraint if it exists
alter table public.reviews drop constraint if exists reviews_rating_check;

-- Add new constraint to allow ratings between 1.0 and 5.0 (including halves)
alter table public.reviews add constraint reviews_rating_check check (rating >= 1.0 and rating <= 5.0);
