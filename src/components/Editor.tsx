import { Camera, Check, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent, type MutableRefObject } from 'react';
import { CATEGORY_LABEL, messageOf, photoUrl, resizeToJpeg, toInt, toLines } from '../lib';
import type { Category, Recipe } from '../types';

type PhotoState = { kind: 'saved'; name: string } | { kind: 'new'; bytes: Uint8Array; url: string } | null;

interface Props {
  recipe?: Recipe;
  initialCategory?: Category;
  /** Lets the parent ask "may I close?" (false = unsaved changes, editor shows its own prompt). */
  guard: MutableRefObject<() => boolean>;
  onSaved: (recipe: Recipe) => Promise<void>;
  onCancel: () => void;
  onDiscard: () => void;
}

const CATEGORIES: Category[] = ['salgada', 'doce'];

export function Editor({ recipe, initialCategory, guard, onSaved, onCancel, onDiscard }: Props) {
  const uid = useId();
  const fileInput = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(recipe?.title ?? '');
  const [category, setCategory] = useState<Category | null>(recipe?.category ?? initialCategory ?? null);
  const [minutes, setMinutes] = useState(recipe?.prepMinutes?.toString() ?? '');
  const [servings, setServings] = useState(recipe?.servings?.toString() ?? '');
  const [ingredients, setIngredients] = useState(recipe?.ingredients.join('\n') ?? '');
  const [steps, setSteps] = useState(recipe?.steps.join('\n') ?? '');
  const [notes, setNotes] = useState(recipe?.notes ?? '');
  const [photo, setPhoto] = useState<PhotoState>(recipe?.photo ? { kind: 'saved', name: recipe.photo } : null);

  const [errors, setErrors] = useState<{ title?: string; category?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [askDiscard, setAskDiscard] = useState(false);

  const snapshot = JSON.stringify([title, category, minutes, servings, ingredients, steps, notes, photo?.kind === 'new' ? 'new' : photo]);
  const initial = useRef(snapshot);
  const dirty = snapshot !== initial.current;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  useEffect(() => {
    guard.current = () => {
      if (!dirtyRef.current) return true;
      setAskDiscard(true);
      return false;
    };
    return () => {
      guard.current = () => true;
    };
  }, [guard]);

  useEffect(() => {
    const url = photo?.kind === 'new' ? photo.url : null;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [photo]);

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    setFormError(null);
    try {
      const bytes = await resizeToJpeg(file);
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'image/jpeg' }));
      setPhoto({ kind: 'new', bytes, url });
    } catch {
      setFormError('Não consegui abrir essa imagem. Tente um JPG, PNG ou WebP.');
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!title.trim()) next.title = 'Dê um nome à receita.';
    if (!category) next.category = 'Escolha se é doce ou salgada.';
    setErrors(next);
    if (next.title || next.category) {
      document.getElementById(next.title ? `${uid}-title` : `${uid}-category`)?.focus();
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const photoName = photo?.kind === 'new' ? await window.recivo.savePhoto(photo.bytes) : (photo?.name ?? null);
      const saved = await window.recivo.save({
        id: recipe?.id,
        title,
        category: category as Category,
        ingredients: toLines(ingredients),
        steps: toLines(steps),
        prepMinutes: toInt(minutes),
        servings: toInt(servings),
        notes,
        photo: photoName,
        favorite: recipe?.favorite ?? false,
      });
      await onSaved(saved);
    } catch (err) {
      setFormError(`Não foi possível salvar: ${messageOf(err)}`);
      setSaving(false);
    }
  }

  const photoSrc = photo ? (photo.kind === 'new' ? photo.url : photoUrl(photo.name)) : null;

  return (
    <form className="pane" onSubmit={submit} noValidate data-cat={category ?? undefined}>
      <header className="sheet-bar">
        <h2 id="sheet-title" className="bar-title">
          {recipe ? 'Editar receita' : 'Nova receita'}
        </h2>
        <span className="grow" />
        <button type="button" className="icon-btn" onClick={onCancel} aria-label="Cancelar">
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <div className="sheet-scroll form">
        <div className="field">
          <span className="label" id={`${uid}-photo-label`}>
            Foto
          </span>
          <div className="photo-field">
            <div className="photo-preview" data-empty={!photoSrc} aria-labelledby={`${uid}-photo-label`}>
              {photoSrc ? (
                <img src={photoSrc} alt="Pré-visualização da foto" />
              ) : (
                <>
                  <Camera size={28} aria-hidden="true" />
                  <span>Sem foto</span>
                </>
              )}
            </div>
            <div className="photo-actions">
              <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
                {photoSrc ? 'Trocar foto' : 'Adicionar foto'}
              </button>
              {photoSrc && (
                <button type="button" className="btn ghost" onClick={() => setPhoto(null)}>
                  Remover
                </button>
              )}
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  void pickPhoto(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor={`${uid}-title`}>
            Nome da receita
          </label>
          <input
            id={`${uid}-title`}
            className="input input-lg"
            value={title}
            maxLength={120}
            autoFocus={!recipe}
            placeholder="Ex.: Bolo de cenoura com cobertura"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? `${uid}-title-err` : undefined}
            onChange={(e) => setTitle(e.target.value)}
          />
          {errors.title && (
            <p className="field-error" id={`${uid}-title-err`}>
              {errors.title}
            </p>
          )}
        </div>

        <fieldset className="field" aria-describedby={errors.category ? `${uid}-category-err` : undefined}>
          <legend className="label">Tipo</legend>
          <div className="choices">
            {CATEGORIES.map((c, i) => (
              <label key={c} className="choice" data-cat={c}>
                <input
                  id={i === 0 ? `${uid}-category` : undefined}
                  type="radio"
                  name={`${uid}-cat`}
                  checked={category === c}
                  onChange={() => {
                    setCategory(c);
                    setErrors((prev) => ({ ...prev, category: undefined }));
                  }}
                />
                <span>{CATEGORY_LABEL[c]}</span>
                <Check size={18} aria-hidden="true" />
              </label>
            ))}
          </div>
          {errors.category && (
            <p className="field-error" id={`${uid}-category-err`}>
              {errors.category}
            </p>
          )}
        </fieldset>

        <div className="field-row">
          <div className="field">
            <label className="label" htmlFor={`${uid}-min`}>
              Tempo de preparo
            </label>
            <div className="input-suffix">
              <input
                id={`${uid}-min`}
                className="input"
                type="number"
                inputMode="numeric"
                min={1}
                max={9999}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
              <span>min</span>
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor={`${uid}-serv`}>
              Rendimento
            </label>
            <div className="input-suffix">
              <input
                id={`${uid}-serv`}
                className="input"
                type="number"
                inputMode="numeric"
                min={1}
                max={999}
                value={servings}
                onChange={(e) => setServings(e.target.value)}
              />
              <span>porções</span>
            </div>
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor={`${uid}-ing`}>
            Ingredientes
          </label>
          <textarea
            id={`${uid}-ing`}
            className="input area"
            value={ingredients}
            placeholder={'3 cenouras médias\n4 ovos\n2 xícaras de açúcar'}
            onChange={(e) => setIngredients(e.target.value)}
          />
          <p className="hint">Um ingrediente por linha.</p>
        </div>

        <div className="field">
          <label className="label" htmlFor={`${uid}-steps`}>
            Modo de preparo
          </label>
          <textarea
            id={`${uid}-steps`}
            className="input area"
            value={steps}
            placeholder={'Bata no liquidificador as cenouras, os ovos e o óleo.\nMisture com os secos e leve ao forno.'}
            onChange={(e) => setSteps(e.target.value)}
          />
          <p className="hint">Um passo por linha. A numeração é automática.</p>
        </div>

        <div className="field">
          <label className="label" htmlFor={`${uid}-notes`}>
            Anotações e dicas
          </label>
          <textarea
            id={`${uid}-notes`}
            className="input area area-sm"
            value={notes}
            placeholder="Ex.: reduzir o açúcar pela metade; fica melhor no dia seguinte."
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <footer className="sheet-foot">
        {askDiscard ? (
          <div className="foot-row" role="alert">
            <span className="grow">Descartar as alterações?</span>
            <button type="button" className="btn" onClick={() => setAskDiscard(false)} autoFocus>
              Continuar editando
            </button>
            <button type="button" className="btn danger" onClick={onDiscard}>
              Descartar
            </button>
          </div>
        ) : (
          <div className="foot-row">
            {formError && (
              <p className="field-error grow" role="alert">
                {formError}
              </p>
            )}
            {!formError && <span className="grow" />}
            <button type="button" className="btn" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar receita'}
            </button>
          </div>
        )}
      </footer>
    </form>
  );
}
