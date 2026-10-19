import { FolderOpen, Heart, Plus, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import mark from './assets/mark.webp';
import wordmark from './assets/wordmark.webp';
import { Editor } from './components/Editor';
import { Reader } from './components/Reader';
import { RecipeCard } from './components/RecipeCard';
import { Sheet } from './components/Sheet';
import { Spectrum, type Shelf } from './components/Spectrum';
import { byTitle, matchesQuery, messageOf } from './lib';
import type { Category, Recipe, RecipeLibrary } from './types';

type View = { kind: 'read'; id: string } | { kind: 'edit'; id?: string; category?: Category };

export default function App() {
  const [library, setLibrary] = useState<RecipeLibrary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [shelf, setShelf] = useState<Shelf>('todas');
  const [query, setQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [view, setView] = useState<View | null>(null);
  const [viewKey, setViewKey] = useState(0);
  const [open, setOpen] = useState(false);
  const guard = useRef<() => boolean>(() => true);
  const searchRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      setLibrary(await window.recivo.list());
      setLoadError(null);
    } catch (e) {
      setLoadError(messageOf(e));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const recipes = library?.recipes;
  const matching = useMemo(
    () => (recipes ?? []).filter((r) => (!onlyFavorites || r.favorite) && matchesQuery(r, query)),
    [recipes, onlyFavorites, query],
  );
  const counts: Record<Shelf, number> = useMemo(
    () => ({
      todas: matching.length,
      doce: matching.filter((r) => r.category === 'doce').length,
      salgada: matching.filter((r) => r.category === 'salgada').length,
    }),
    [matching],
  );
  const visible = useMemo(
    () => matching.filter((r) => shelf === 'todas' || r.category === shelf).sort(byTitle),
    [matching, shelf],
  );

  const show = (next: View) => {
    guard.current = () => true;
    setView(next);
    setViewKey((k) => k + 1);
    setOpen(true);
  };
  const newRecipe = useCallback(
    (category?: Category) => show({ kind: 'edit', category: category ?? (shelf === 'todas' ? undefined : shelf) }),
    [shelf],
  );

  /** Leaving an edit of an existing recipe goes back to reading it; anything else closes the sheet. */
  const leave = () => (view?.kind === 'edit' && view.id ? show({ kind: 'read', id: view.id }) : setOpen(false));
  const requestClose = () => {
    if (guard.current()) leave();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (open) return;
      const typing = e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        newRecipe();
      } else if ((e.ctrlKey && e.key.toLowerCase() === 'f') || (e.key === '/' && !typing)) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, newRecipe]);

  async function toggleFavorite(r: Recipe) {
    setLibrary((lib) =>
      lib && { ...lib, recipes: lib.recipes.map((x) => (x.id === r.id ? { ...x, favorite: !x.favorite } : x)) },
    );
    try {
      await window.recivo.save({ ...r, favorite: !r.favorite });
    } catch {
      await refresh(); // roll the optimistic update back to what is on disk
    }
  }

  async function remove(id: string) {
    await window.recivo.remove(id);
    setOpen(false);
    await refresh();
  }

  const current = view?.kind === 'read' || (view?.kind === 'edit' && view.id) ? recipes?.find((r) => r.id === view.id) : undefined;
  const total = recipes?.length ?? 0;
  const filtering = query.trim() !== '' || onlyFavorites;

  return (
    <div className="scroll">
      <header className="topbar">
        <img className="wordmark" src={wordmark} alt="Recivo" />
        <Spectrum value={shelf} counts={counts} onChange={setShelf} />
        <div className="search" role="search">
          <Search size={18} aria-hidden="true" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            placeholder="Buscar receita ou ingrediente"
            aria-label="Buscar receita ou ingrediente"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
          />
          {query && (
            <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label="Limpar busca">
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
        <button
          type="button"
          className="btn toggle"
          aria-pressed={onlyFavorites}
          onClick={() => setOnlyFavorites((v) => !v)}
        >
          <Heart size={18} fill={onlyFavorites ? 'currentColor' : 'none'} aria-hidden="true" />
          <span>Favoritas</span>
        </button>
        <button type="button" className="btn primary" onClick={() => newRecipe()}>
          <Plus size={18} aria-hidden="true" /> Nova receita
        </button>
      </header>

      <main className="main">
        {loadError && (
          <div className="state" role="alert">
            <h1>Não consegui abrir suas receitas</h1>
            <p>{loadError}</p>
            <button type="button" className="btn primary" onClick={() => void refresh()}>
              Tentar de novo
            </button>
          </div>
        )}

        {library && library.skipped.length > 0 && (
          <p className="notice" role="status">
            {library.skipped.length === 1 ? '1 arquivo não pôde ser lido e foi ignorado' : `${library.skipped.length} arquivos não puderam ser lidos e foram ignorados`}
            : {library.skipped.join(', ')}
          </p>
        )}

        {library && total === 0 && (
          <div className="state welcome">
            <img src={mark} alt="" width={112} height={112} />
            <h1>Sua cozinha começa aqui</h1>
            <p>Guarde a primeira receita. Tudo fica salvo só no seu PC, em arquivos que você pode abrir e copiar quando quiser.</p>
            <div className="state-actions">
              <button type="button" className="btn salgada" onClick={() => newRecipe('salgada')}>
                <Plus size={18} aria-hidden="true" /> Receita salgada
              </button>
              <button type="button" className="btn doce" onClick={() => newRecipe('doce')}>
                <Plus size={18} aria-hidden="true" /> Receita doce
              </button>
            </div>
          </div>
        )}

        {library && total > 0 && visible.length === 0 && (
          <div className="state">
            <h1>{filtering ? 'Nada encontrado' : shelf === 'doce' ? 'Nenhuma receita doce ainda' : 'Nenhuma receita salgada ainda'}</h1>
            <p>
              {filtering
                ? 'Tente outro nome ou ingrediente, ou mude o tipo de receita.'
                : 'Que tal começar agora?'}
            </p>
            <div className="state-actions">
              {filtering ? (
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setQuery('');
                    setOnlyFavorites(false);
                    setShelf('todas');
                  }}
                >
                  Limpar filtros
                </button>
              ) : (
                <button type="button" className={`btn ${shelf === 'doce' ? 'doce' : 'salgada'}`} onClick={() => newRecipe()}>
                  <Plus size={18} aria-hidden="true" /> Nova receita
                </button>
              )}
            </div>
          </div>
        )}

        {visible.length > 0 && (
          <ul className="grid" aria-label="Receitas">
            {visible.map((r) => (
              <li key={r.id}>
                <RecipeCard
                  recipe={r}
                  onOpen={() => show({ kind: 'read', id: r.id })}
                  onToggleFavorite={() => void toggleFavorite(r)}
                />
              </li>
            ))}
          </ul>
        )}

        {library && (
          <footer className="foot">
            <span>
              {total} {total === 1 ? 'receita' : 'receitas'} · salvas em <code>{library.root}</code>
            </span>
            <button type="button" className="link" onClick={() => void window.recivo.openFolder()}>
              <FolderOpen size={15} aria-hidden="true" /> Abrir pasta
            </button>
          </footer>
        )}
      </main>

      <Sheet open={open} labelledBy="sheet-title" onRequestClose={requestClose}>
        {view?.kind === 'read' && current && (
          <Reader
            key={`${viewKey}-${current.id}`}
            recipe={current}
            onClose={() => setOpen(false)}
            onEdit={() => show({ kind: 'edit', id: current.id })}
            onToggleFavorite={() => void toggleFavorite(current)}
            onDelete={() => void remove(current.id)}
          />
        )}
        {view?.kind === 'edit' && (view.id ? current : true) && (
          <Editor
            key={viewKey}
            recipe={current}
            initialCategory={view.category}
            guard={guard}
            onSaved={async (saved) => {
              await refresh();
              show({ kind: 'read', id: saved.id });
            }}
            onCancel={requestClose}
            onDiscard={leave}
          />
        )}
      </Sheet>
    </div>
  );
}
