import type { CSSProperties } from 'react';
import type { Category } from '../types';

export type Shelf = 'todas' | Category;

// Order mirrors the wordmark gradient: red (salgada) -> neutral -> amber (doce).
const OPTIONS: { value: Shelf; label: string }[] = [
  { value: 'salgada', label: 'Salgadas' },
  { value: 'todas', label: 'Todas' },
  { value: 'doce', label: 'Doces' },
];

interface Props {
  value: Shelf;
  counts: Record<Shelf, number>;
  onChange: (value: Shelf) => void;
}

export function Spectrum({ value, counts, onChange }: Props) {
  const index = OPTIONS.findIndex((o) => o.value === value);
  return (
    <div
      className="spectrum"
      role="radiogroup"
      aria-label="Tipo de receita"
      data-value={value}
      style={{ '--i': index } as CSSProperties}
    >
      <span className="spectrum-thumb" aria-hidden="true" />
      {OPTIONS.map((o) => (
        <label key={o.value} className="spectrum-opt">
          <input
            type="radio"
            name="shelf"
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
          />
          <span className="spectrum-label">{o.label}</span>
          <span className="spectrum-count">{counts[o.value]}</span>
        </label>
      ))}
    </div>
  );
}
