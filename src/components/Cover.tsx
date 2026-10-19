import { photoUrl } from '../lib';
import type { Recipe } from '../types';

/** Photo when there is one, otherwise a brand-colored tile with the recipe's initial. */
export function Cover({ recipe, alt = '' }: { recipe: Pick<Recipe, 'title' | 'photo'>; alt?: string }) {
  if (recipe.photo) return <img className="cover" src={photoUrl(recipe.photo)} alt={alt} decoding="async" />;
  return (
    <div className="cover tile" aria-hidden="true">
      <span>{recipe.title.trim().charAt(0).toLocaleUpperCase('pt-BR')}</span>
    </div>
  );
}
