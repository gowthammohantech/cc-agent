import type { HallmarkState } from '@/domain/timeline/engine';
import type { EvidenceBadge as Badge } from '@/domain/evidence/engine';
import { HallmarkCard } from './HallmarkCard';

export interface HallmarkGridItem {
  state: HallmarkState;
  badge: Badge | null;
}

export function HallmarkGrid({ items, age }: { items: readonly HallmarkGridItem[]; age: number }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <li key={item.state.hallmark.id}>
          <HallmarkCard state={item.state} badge={item.badge} age={age} />
        </li>
      ))}
    </ul>
  );
}
