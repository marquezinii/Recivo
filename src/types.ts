export type Category = 'doce' | 'salgada';

export interface Recipe {
  id: string;
  title: string;
  category: Category;
  ingredients: string[];
  steps: string[];
  prepMinutes: number | null;
  servings: number | null;
  notes: string;
  photo: string | null;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };

export interface RecipeLibrary {
  recipes: Recipe[];
  /** Files that could not be read, e.g. "salgada/quebrado.json". */
  skipped: string[];
  /** Absolute path of the folder where recipes live. */
  root: string;
}

export interface RecivoApi {
  list(): Promise<RecipeLibrary>;
  save(recipe: RecipeInput): Promise<Recipe>;
  remove(id: string): Promise<void>;
  /** Stores a JPEG and returns its file name. */
  savePhoto(bytes: Uint8Array): Promise<string>;
  openFolder(): Promise<void>;
}

declare global {
  interface Window {
    recivo: RecivoApi;
  }
}
