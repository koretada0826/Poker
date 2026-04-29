import type { Card as TCard } from '../types';

interface Props {
  card?: TCard;
  back?: boolean;
  size?: 'sm' | 'lg' | 'xl';
}

export default function Card({ card, back, size = 'sm' }: Props) {
  const sizeCls = size === 'xl' ? 'xl' : size === 'lg' ? 'lg' : '';
  if (back || !card) {
    return <div className={`card-back ${sizeCls}`} aria-label="カード裏面" />;
  }
  const colorCls = card.color === 'red' ? 'text-red-600' : 'text-gray-900';
  const rankText = card.display.replace(/[♠♥♦♣]/, '');
  const suit = card.display.replace(/[^♠♥♦♣]/g, '');
  return (
    <div className={`card-face ${sizeCls} ${colorCls}`} aria-label={card.display}>
      <div className="corner self-start">
        <div>{rankText}</div>
        <div>{suit}</div>
      </div>
      <div className="center">{suit}</div>
      <div className="corner self-end rotate-180">
        <div>{rankText}</div>
        <div>{suit}</div>
      </div>
    </div>
  );
}
