import { apiOk } from '@/lib/api';
import { getBundle } from '@/content/bundle';

export const dynamic = 'force-static';

export function GET(): Response {
  return apiOk([...getBundle().hallmarks].sort((a, b) => a.name.localeCompare(b.name)));
}
