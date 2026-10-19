import { Heart } from 'lucide-react';

interface Props {
  active: boolean;
  onToggle: () => void;
  className?: string;
}

export function FavButton({ active, onToggle, className = '' }: Props) {
  const label = active ? 'Remover dos favoritos' : 'Marcar como favorita';
  return (
    <button
      type="button"
      className={`icon-btn fav ${className}`}
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <Heart size={20} fill={active ? 'currentColor' : 'none'} aria-hidden="true" />
    </button>
  );
}
