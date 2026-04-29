import type { Card as TCard } from '../types';
import Card from './Card';

interface Props {
  cards: TCard[];
  size?: 'sm' | 'lg' | 'xl';
  hidden?: boolean[];
  highlight?: boolean[];
}

export default function CardRow({ cards, size = 'lg', hidden, highlight }: Props) {
  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {cards.map((c, i) => (
        <div
          key={i}
          className={highlight?.[i] ? 'ring-4 ring-chipGold rounded-xl' : ''}
        >
          <Card card={c} back={hidden?.[i]} size={size} />
        </div>
      ))}
    </div>
  );
}
