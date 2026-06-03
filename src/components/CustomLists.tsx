'use client';

import { useState, useEffect } from 'react';
import { tmdb } from '@/lib/tmdb';
import { createClient } from '@/utils/supabase/client';
import { Search, Plus, X, Share2, Eye, Trash2, Edit3, Save, ArrowLeft, Loader2, Cat } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';

export function CustomLists({ user }: { user: any }) {
  const { language, t } = useLanguage();
  const supabase = createClient();
  
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [listMovies, setListMovies] = useState<any[]>([]); // { movie: tmdb_movie, rank: number, user_note: string }
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeRankSlot, setActiveRankSlot] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');

  useEffect(() => {
    fetchLists();
  }, [user.id]);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLists(data || []);
    } catch (err: any) {
      console.error('Error fetching lists:', err);
      toast.error(language === 'es' ? 'Error al cargar listas' : 'Error loading lists');
    } finally {
      setLoading(false);
    }
  };

  // Search movies/tv
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) return setSearchResults([]);
      setIsSearching(true);
      try {
        const data = mediaType === 'movie'
          ? await tmdb.searchMovies(query, language)
          : await tmdb.searchTV(query, language);
        setSearchResults(data.results || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query, language, mediaType]);

  const handleCreateNew = () => {
    setTitle('');
    setDescription('');
    setIsPublic(true);
    setListMovies([]);
    setActiveView('create');
  };

  const handleEdit = async (list: any) => {
    setSelectedListId(list.id);
    setTitle(list.title);
    setDescription(list.description || '');
    setIsPublic(list.is_public);
    
    // Load movies of this list
    try {
      const { data, error } = await supabase
        .from('list_movies')
        .select('*')
        .eq('list_id', list.id)
        .order('rank', { ascending: true });

      if (error) throw error;

      const loadedMovies = [];
      for (const item of data || []) {
        const isTV = item.tmdb_id < 0;
        const realTmdbId = Math.abs(item.tmdb_id);
        const movieDetail = isTV 
          ? await tmdb.getTVShow(realTmdbId.toString(), language)
          : await tmdb.getMovie(realTmdbId.toString(), language);
        loadedMovies.push({
          movie: movieDetail,
          rank: item.rank,
          user_note: item.user_note || ''
        });
      }
      setListMovies(loadedMovies);
      setActiveView('edit');
    } catch (err: any) {
      console.error(err);
      toast.error(language === 'es' ? 'Error al cargar detalles' : 'Error loading details');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'es' ? '¿Estás seguro de eliminar esta lista?' : 'Are you sure you want to delete this list?')) return;
    
    try {
      const { error } = await supabase
        .from('custom_lists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(language === 'es' ? 'Lista eliminada' : 'List deleted');
      fetchLists();
    } catch (err: any) {
      console.error(err);
      toast.error(language === 'es' ? 'Error al eliminar la lista' : 'Error deleting list');
    }
  };

  const handleSelectMovie = async (movie: any) => {
    if (activeRankSlot === null) return;
    
    // Check duplication
    if (listMovies.some(item => item.movie.id === movie.id)) {
      toast.error(language === 'es' ? 'Película ya añadida' : 'Movie already added');
      return;
    }

    const updated = [...listMovies];
    const existingIndex = updated.findIndex(item => item.rank === activeRankSlot);

    const newItem = {
      movie,
      rank: activeRankSlot,
      user_note: ''
    };

    if (existingIndex > -1) {
      updated[existingIndex] = newItem;
    } else {
      updated.push(newItem);
    }

    // Sort by rank
    updated.sort((a, b) => a.rank - b.rank);
    setListMovies(updated);
    setActiveRankSlot(null);
    setQuery('');
    setSearchResults([]);
  };

  const handleRemoveMovie = (rank: number) => {
    setListMovies(listMovies.filter(item => item.rank !== rank));
  };

  const handleNoteChange = (rank: number, note: string) => {
    setListMovies(listMovies.map(item => {
      if (item.rank === rank) {
        return { ...item, user_note: note.slice(0, 280) };
      }
      return item;
    }));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error(language === 'es' ? 'El título es requerido' : 'Title is required');
      return;
    }
    if (listMovies.length === 0) {
      toast.error(language === 'es' ? 'Añade al menos una película' : 'Add at least one movie');
      return;
    }

    setIsSaving(true);
    try {
      let listId = selectedListId;

      if (activeView === 'create') {
        const { data, error } = await supabase
          .from('custom_lists')
          .insert({
            user_id: user.id,
            title,
            description,
            is_public: isPublic
          })
          .select()
          .single();

        if (error) throw error;
        listId = data.id;
      } else {
        // Edit flow: update metadata
        const { error } = await supabase
          .from('custom_lists')
          .update({
            title,
            description,
            is_public: isPublic
          })
          .eq('id', listId);

        if (error) throw error;

        // Clear existing movies of the list to rebuild
        const { error: deleteError } = await supabase
          .from('list_movies')
          .delete()
          .eq('list_id', listId);

        if (deleteError) throw deleteError;
      }

      // Ensure all selected movies are in the main 'movies' cache first
      for (const item of listMovies) {
        const isTV = item.movie.first_air_date !== undefined;
        const dbId = isTV ? -item.movie.id : item.movie.id;
        const title = item.movie.title || item.movie.name;
        const releaseDate = (item.movie.release_date || item.movie.first_air_date || '').trim() !== '' 
          ? (item.movie.release_date || item.movie.first_air_date) 
          : null;
        
        const { data: existingMovie } = await supabase
          .from('movies')
          .select('tmdb_id')
          .eq('tmdb_id', dbId)
          .single();
          
        if (!existingMovie) {
          await supabase.from('movies').insert({
            tmdb_id: dbId,
            title: title,
            poster_path: item.movie.poster_path,
            release_date: releaseDate
          });
        }
      }

      // Bulk insert list movies
      const insertData = listMovies.map(item => {
        const isTV = item.movie.first_air_date !== undefined;
        const dbId = isTV ? -item.movie.id : item.movie.id;
        return {
          list_id: listId,
          tmdb_id: dbId,
          rank: item.rank,
          user_note: item.user_note
        };
      });

      const { error: moviesError } = await supabase
        .from('list_movies')
        .insert(insertData);

      if (moviesError) throw moviesError;

      toast.success(
        activeView === 'create'
          ? (language === 'es' ? 'Colección creada con éxito' : 'Collection created successfully')
          : (language === 'es' ? 'Colección actualizada con éxito' : 'Collection updated successfully')
      );
      
      setActiveView('list');
      fetchLists();
    } catch (err: any) {
      console.error(err);
      toast.error(language === 'es' ? 'Error al guardar la lista' : 'Error saving list');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = (id: string) => {
    const shareUrl = `${window.location.origin}/lists/${id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success(
      language === 'es' ? '¡Enlace de la colección copiado al portapapeles!' : 'Collection link copied to clipboard!'
    );
  };

  return (
    <div className="mb-16">
      {activeView === 'list' ? (
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-2 block">
                {language === 'es' ? 'Tus Colecciones' : 'Your Collections'}
              </span>
              <h2 className="font-display text-4xl md:text-5xl italic text-white">
                {language === 'es' ? 'Colecciones Editoriales' : 'Editorial Collections'}
              </h2>
            </div>
            <button
              onClick={handleCreateNew}
              className="px-8 py-3 border-[0.5px] border-primary/40 font-body text-[10px] uppercase tracking-[0.2em] text-on-surface hover:bg-primary hover:text-on-primary hover:shadow-[0_0_30px_rgba(212,178,255,0.2)] transition-all duration-500 cubic-out flex items-center gap-3 w-fit"
            >
              <Plus className="w-4 h-4" />
              {language === 'es' ? 'Nueva Colección' : 'New Collection'}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
              <Cat className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="font-display text-xl italic text-white/40 mb-2">
                {language === 'es' ? 'Ninguna colección aún' : 'No collections yet'}
              </p>
              <p className="font-body text-xs text-on-surface-variant max-w-sm mx-auto opacity-60">
                {language === 'es' 
                  ? 'Crea tu propia colección personalizada, añade hasta 5 películas y compártela.' 
                  : 'Create your own custom collection, add up to 5 movies, and share it.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {lists.map((list) => (
                <div 
                  key={list.id} 
                  className="glass-card border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col justify-between hover:border-primary/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(212,178,255,0.02),_transparent_70%)] pointer-events-none"></div>
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <h3 className="font-display text-2xl text-white italic group-hover:text-primary transition-colors leading-tight">
                        {list.title}
                      </h3>
                      <span className={`text-[9px] uppercase tracking-widest font-body px-2.5 py-0.5 rounded-full border ${list.is_public ? 'border-primary/30 text-primary bg-primary/5' : 'border-white/10 text-on-surface-variant bg-white/5'}`}>
                        {list.is_public ? (language === 'es' ? 'Pública' : 'Public') : (language === 'es' ? 'Privada' : 'Private')}
                      </span>
                    </div>
                    {list.description && (
                      <p className="font-body text-xs text-on-surface-variant opacity-70 mb-6 line-clamp-2">
                        {list.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-auto">
                    <span className="font-body text-[9px] uppercase tracking-wider text-on-surface-variant opacity-40">
                      {new Date(list.created_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
                    </span>
                    <div className="flex gap-2">
                      <a 
                        href={`/lists/${list.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 border border-white/5 hover:border-primary/30 hover:bg-primary/5 text-on-surface-variant hover:text-primary rounded-xl transition-all"
                        title={language === 'es' ? 'Ver Vista Pública' : 'View Public Page'}
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleShare(list.id)}
                        className="p-2 border border-white/5 hover:border-primary/30 hover:bg-primary/5 text-on-surface-variant hover:text-primary rounded-xl transition-all"
                        title={language === 'es' ? 'Compartir Enlace' : 'Share Link'}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(list)}
                        className="p-2 border border-white/5 hover:border-primary/30 hover:bg-primary/5 text-on-surface-variant hover:text-primary rounded-xl transition-all"
                        title={language === 'es' ? 'Editar' : 'Edit'}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(list.id)}
                        className="p-2 border border-white/5 hover:border-red-500/30 hover:bg-red-500/5 text-on-surface-variant hover:text-red-400 rounded-xl transition-all"
                        title={language === 'es' ? 'Eliminar' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {/* Editor Header */}
          <div className="flex items-center gap-4 mb-10">
            <button 
              onClick={() => setActiveView('list')}
              className="p-2 hover:bg-white/5 rounded-full border border-white/10 text-on-surface-variant hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-1 block">
                {activeView === 'create' ? (language === 'es' ? 'Crear' : 'Create') : (language === 'es' ? 'Editar' : 'Edit')}
              </span>
              <h2 className="font-display text-3xl italic text-white">
                {activeView === 'create' ? (language === 'es' ? 'Nueva Colección Editorial' : 'New Editorial Collection') : (language === 'es' ? 'Editar Colección Editorial' : 'Edit Editorial Collection')}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Metadatos Form */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/5 space-y-6">
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-on-surface-variant mb-2">
                    {language === 'es' ? 'Título de la Colección' : 'Collection Title'}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={language === 'es' ? 'Ej: Cine Negro Esencial' : 'e.g. Essential Film Noir'}
                    maxLength={100}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 font-body text-sm text-white focus:border-primary/40 focus:bg-white/10 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-on-surface-variant mb-2">
                    {language === 'es' ? 'Descripción (Opcional)' : 'Description (Optional)'}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={language === 'es' ? 'De qué se trata esta perspectiva...' : 'What this perspective is about...'}
                    maxLength={500}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 font-body text-sm text-white focus:border-primary/40 focus:bg-white/10 outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-6">
                  <div>
                    <label className="block font-body text-xs uppercase tracking-widest text-on-surface-variant">
                      {language === 'es' ? 'Lista Pública' : 'Public List'}
                    </label>
                    <span className="font-body text-[10px] text-on-surface-variant opacity-60">
                      {language === 'es' ? 'Cualquiera podrá ver tu lista.' : 'Anyone can view your list.'}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 outline-none ${isPublic ? 'bg-primary' : 'bg-white/10'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform duration-300 ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-4 border-[0.5px] border-primary/40 bg-primary/5 font-body text-[10px] uppercase tracking-[0.2em] text-primary hover:bg-primary hover:text-on-primary transition-all duration-500 flex items-center justify-center gap-3 rounded-xl"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? (language === 'es' ? 'Guardando...' : 'Saving...') : (language === 'es' ? 'Guardar Colección' : 'Save Collection')}
                </button>
              </div>
            </div>

            {/* Películas Selector/Ranking */}
            <div className="lg:col-span-2 space-y-6">
              <span className="block font-body text-xs uppercase tracking-widest text-on-surface-variant mb-2">
                {language === 'es' ? 'Tu Selección (1 a 5)' : 'Your Selection (1 to 5)'}
              </span>

              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((rank) => {
                  const item = listMovies.find(m => m.rank === rank);
                  return (
                    <div 
                      key={rank} 
                      className={`glass-card p-4 md:p-6 rounded-3xl border transition-all duration-500 ${item ? 'border-white/10' : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.02]'}`}
                    >
                      {item ? (
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="w-20 md:w-24 aspect-[2/3] relative rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                            {item.movie.poster_path ? (
                              <img src={tmdb.getImageUrl(item.movie.poster_path, 'w500')} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-white/5 flex items-center justify-center font-display text-3xl">?</div>
                            )}
                            <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/80 flex items-center justify-center font-display italic text-primary text-xs border border-primary/20">
                              0{rank}
                            </div>
                          </div>

                          <div className="flex-1 flex flex-col justify-between">
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <h4 className="font-display text-xl text-white italic leading-tight mb-1">{item.movie.title || item.movie.name}</h4>
                                <p className="font-body text-[10px] uppercase tracking-wider text-on-surface-variant opacity-60">
                                  {(item.movie.release_date || item.movie.first_air_date)?.split('-')[0]}
                                </p>
                              </div>
                              <button 
                                onClick={() => handleRemoveMovie(rank)}
                                className="p-2 hover:bg-white/5 text-on-surface-variant hover:text-red-400 rounded-full transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="mt-4">
                              <label className="block font-body text-[9px] uppercase tracking-wider text-on-surface-variant opacity-50 mb-1.5">
                                {language === 'es' ? 'Nota / Comentario' : 'Note / Comment'}
                              </label>
                              <input
                                type="text"
                                value={item.user_note}
                                onChange={(e) => handleNoteChange(rank, e.target.value)}
                                placeholder={language === 'es' ? '¿Por qué esta película está en este puesto? (Opcional)' : 'Why is this movie in this slot? (Optional)'}
                                maxLength={280}
                                className="w-full bg-white/5 border border-white/5 hover:border-white/10 rounded-lg p-2.5 font-body text-xs text-white focus:border-primary/20 outline-none transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-display italic text-white/20 text-sm">
                              0{rank}
                            </div>
                            <span className="font-display text-sm italic text-white/30">
                              {language === 'es' ? 'Ninguna obra seleccionada' : 'No masterpiece selected'}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setMediaType('movie');
                              setActiveRankSlot(rank);
                            }}
                            className="px-4 py-2 border border-white/10 hover:border-primary/30 rounded-xl font-body text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all duration-300"
                          >
                            {language === 'es' ? 'Buscar Obra' : 'Find Media'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buscador Modal */}
      {activeRankSlot !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-500">
          <div className="glass-card border border-white/10 p-8 rounded-3xl w-full max-w-xl shadow-[0_40px_80px_rgba(0,0,0,0.8)]">
            <div className="flex justify-between items-center mb-8">
              <div>
                <span className="font-body text-[10px] uppercase tracking-[0.2em] text-primary mb-1 block">
                  {language === 'es' ? 'Búsqueda' : 'Search'}
                </span>
                <h3 className="font-display text-2xl italic text-white">
                  {language === 'es' ? `Añadir a la posición 0${activeRankSlot}` : `Add to position 0${activeRankSlot}`}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setActiveRankSlot(null);
                  setQuery('');
                  setSearchResults([]);
                }} 
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>
            
            <div className="flex gap-4 p-1 bg-white/5 border border-white/5 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setMediaType('movie');
                  setSearchResults([]);
                }}
                className={`flex-1 py-3 text-center rounded-xl font-body text-[10px] uppercase tracking-widest transition-all duration-300 ${mediaType === 'movie' ? 'bg-primary/20 text-primary border border-primary/20' : 'text-on-surface-variant hover:text-white'}`}
              >
                {language === 'es' ? 'Películas' : 'Movies'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMediaType('tv');
                  setSearchResults([]);
                }}
                className={`flex-1 py-3 text-center rounded-xl font-body text-[10px] uppercase tracking-widest transition-all duration-300 ${mediaType === 'tv' ? 'bg-primary/20 text-primary border border-primary/20' : 'text-on-surface-variant hover:text-white'}`}
              >
                {language === 'es' ? 'Series / Animes' : 'TV Shows / Anime'}
              </button>
            </div>

            <div className="relative mb-8">
              <input 
                type="text" 
                autoFocus
                value={query} 
                onChange={e => setQuery(e.target.value)}
                placeholder={mediaType === 'movie' ? t('search.placeholder') : (language === 'es' ? 'Buscar series o animes...' : 'Search series or anime...')}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 font-body text-sm text-white outline-none focus:border-primary/40 focus:bg-white/10 transition-all"
              />
              <Search className="absolute left-4 top-4 w-5 h-5 text-on-surface-variant" />
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {isSearching ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(m => (
                  <button 
                    key={m.id} 
                    onClick={() => handleSelectMovie(m)} 
                    className="flex items-center gap-4 text-left p-3 hover:bg-white/5 rounded-2xl w-full transition-all border border-transparent hover:border-white/5 group"
                  >
                    <div className="w-12 h-18 relative flex-shrink-0">
                      {m.poster_path ? (
                        <img src={tmdb.getImageUrl(m.poster_path, 'w500')} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <div className="w-full h-full bg-white/5 rounded-lg flex items-center justify-center"><Plus className="w-4 h-4 text-white/10" /></div>
                      )}
                    </div>
                    <div>
                      <p className="font-body text-sm font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{m.title || m.name}</p>
                      <p className="font-body text-xs text-on-surface-variant">{(m.release_date || m.first_air_date)?.split('-')[0]}</p>
                    </div>
                  </button>
                ))
              ) : query.length > 2 ? (
                <p className="text-center py-8 font-body text-xs uppercase tracking-widest text-on-surface-variant opacity-50">
                  {language === 'es' ? 'No se encontraron resultados' : 'No results found'}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
