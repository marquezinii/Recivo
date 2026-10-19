import { Clock, Users } from 'lucide-react';
import { formatMinutes, servingsLabel } from '../lib';
import type { Recipe } from '../types';

export function Meta({ recipe }: { recipe: Pick<Recipe, 'prepMinutes' | 'servings'> }) {
  if (!recipe.prepMinutes && !recipe.servings) return null;
  return (
    <ul className="meta">
      {recipe.prepMinutes ? (
        <li>
          <Clock size={16} aria-hidden="true" /> {formatMinutes(recipe.prepMinutes)}
        </li>
      ) : null}
      {recipe.servings ? (
        <li>
          <Users size={16} aria-hidden="true" /> {servingsLabel(recipe.servings)}
        </li>
      ) : null}
    </ul>
  );
}
