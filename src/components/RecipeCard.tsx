import { CATEGORY_LABEL } from '../lib';
import type { Recipe } from '../types';
import { Cover } from './Cover';
import { FavButton } from './FavButton';
import { Meta } from './Meta';

interface Props {
  recipe: Recipe;
  onOpen: () => void;
  onToggleFavorite: () => void;
}

export function RecipeCard({ recipe, onOpen, onToggleFavorite }: Props) {
  return (
    <article className="card" data-cat={recipe.category}>
      <button type="button" className="card-hit" onClick={onOpen}>
        <span className="sr-only">Abrir {recipe.title}</span>
      </button>
      <div className="card-media">
        <Cover recipe={recipe} />
        <FavButton active={recipe.favorite} onToggle={onToggleFavorite} className="card-fav" />
      </div>
      <div className="card-body">
        <span className="chip">{CATEGORY_LABEL[recipe.category]}</span>
        <h3 className="card-title">{recipe.title}</h3>
        <Meta recipe={recipe} />
      </div>
    </article>
  );
}
