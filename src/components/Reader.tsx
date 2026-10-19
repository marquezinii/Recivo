import { Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { CATEGORY_LABEL } from '../lib';
import type { Recipe } from '../types';
import { Cover } from './Cover';
import { FavButton } from './FavButton';
import { Meta } from './Meta';

interface Props {
  recipe: Recipe;
  onClose: () => void;
  onEdit: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}

export function Reader({ recipe, onClose, onEdit, onToggleFavorite, onDelete }: Props) {
  const [confirming, setConfirming] = useState(false);
  const empty = recipe.ingredients.length === 0 && recipe.steps.length === 0;

  return (
    <div className="pane" data-cat={recipe.category}>
      <header className="sheet-bar">
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
          <X size={20} aria-hidden="true" />
        </button>
        <span className="grow" />
        {confirming ? (
          <div className="confirm" role="group" aria-label="Confirmar exclusão">
            <span>Excluir esta receita?</span>
            <button type="button" className="btn" onClick={() => setConfirming(false)} autoFocus>
              Cancelar
            </button>
            <button type="button" className="btn danger" onClick={onDelete}>
              Excluir
            </button>
          </div>
        ) : (
          <>
            <FavButton active={recipe.favorite} onToggle={onToggleFavorite} />
            <button type="button" className="btn" onClick={onEdit}>
              <Pencil size={16} aria-hidden="true" /> Editar
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setConfirming(true)}
              aria-label="Excluir receita"
              title="Excluir receita"
            >
              <Trash2 size={18} aria-hidden="true" />
            </button>
          </>
        )}
      </header>

      <div className="sheet-scroll">
        <div className="reader-media">
          <Cover recipe={recipe} alt={`Foto de ${recipe.title}`} />
        </div>

        <div className="reader-head">
          <span className="chip">{CATEGORY_LABEL[recipe.category]}</span>
          <h2 id="sheet-title" className="reader-title">
            {recipe.title}
          </h2>
          <Meta recipe={recipe} />
        </div>

        {empty ? (
          <p className="reader-empty">
            Esta receita ainda não tem ingredientes nem modo de preparo.{' '}
            <button type="button" className="link" onClick={onEdit}>
              Completar agora
            </button>
          </p>
        ) : (
          <div className="reader-cols">
            {recipe.ingredients.length > 0 && (
              <section aria-labelledby="h-ingredients">
                <h3 id="h-ingredients">Ingredientes</h3>
                <ul className="ingredients">
                  {recipe.ingredients.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>
            )}
            {recipe.steps.length > 0 && (
              <section aria-labelledby="h-steps">
                <h3 id="h-steps">Modo de preparo</h3>
                <ol className="steps">
                  {recipe.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        )}

        {recipe.notes && (
          <aside className="note" aria-labelledby="h-notes">
            <h3 id="h-notes">Anotações</h3>
            <p>{recipe.notes}</p>
          </aside>
        )}
      </div>
    </div>
  );
}
