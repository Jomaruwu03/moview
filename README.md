# MoView

MoView is an interactive web application designed for film enthusiasts. Its primary objective is to allow users to search for their favorite movies, rate them, write brief reviews, and generate high-fidelity graphical widgets (such as a retro cinema ticket or a modern glassmorphism card) that are perfectly sized for sharing on social media.

## Features
- **Movie Search:** Fast and accurate movie retrieval powered by the TMDB API.
- **Custom Widgets:** Generate stylized review cards in different aesthetic themes (Modern, Retro Ticket).
- **Responsive Export:** Exports high-quality images (1080x1920) optimized for platforms like Instagram Stories.
- **Authentication:** Secure user login and registration powered by Supabase.

## Tech Stack
- Next.js (App Router)
- React
- Tailwind CSS
- Supabase (Database & Authentication)
- TMDB API
- html-to-image (DOM to image rendering)

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Jomaruwu03/moview.git
   cd moview
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env.local` file in the root directory and add your keys:
   ```env
   NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Disclaimer
This product uses the TMDB API but is not endorsed or certified by TMDB.

---

# MoView (Español)

MoView es una aplicación web interactiva diseñada para entusiastas del cine. Su objetivo principal es permitir a los usuarios buscar sus películas favoritas, calificarlas, escribir breves reseñas y generar widgets gráficos de alta fidelidad (como un boleto de cine retro o una tarjeta moderna) con un tamaño optimizado para compartirse en redes sociales.

## Características
- **Búsqueda de Películas:** Búsqueda rápida y precisa impulsada por la API de TMDB.
- **Widgets Personalizados:** Genera tarjetas de reseñas estilizadas en diferentes temas estéticos (Moderno, Boleto Retro).
- **Exportación Responsiva:** Exporta imágenes de alta calidad (1080x1920) optimizadas para plataformas como Instagram Stories.
- **Autenticación:** Inicio de sesión y registro seguros a través de Supabase.

## Tecnologías Utilizadas
- Next.js (App Router)
- React
- Tailwind CSS
- Supabase (Base de Datos y Autenticación)
- API de TMDB
- html-to-image (Renderizado de DOM a imagen)

## Configuración e Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/Jomaruwu03/moview.git
   cd moview
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   Crea un archivo `.env.local` en la raíz del proyecto y añade tus credenciales:
   ```env
   NEXT_PUBLIC_TMDB_API_KEY=tu_api_key_de_tmdb
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
   ```

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Aviso Legal
Este producto utiliza la API de TMDB pero no está respaldado ni certificado por TMDB.
