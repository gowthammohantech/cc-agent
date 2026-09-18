import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBundle } from '@/content/bundle';
import { ancestors, children, zoomPath } from '@/domain/entities/traverse';
import { ENTITY_LAYER_LABEL } from '@schemas/index';
import { ZoomLadder } from '@/components/body/ZoomLadder';
import { EntityZoomWorkspace } from '@/components/body/EntityZoomWorkspace';

export function generateStaticParams() {
  return getBundle().entities.map((e) => ({ entityId: e.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ entityId: string }>;
}): Promise<Metadata> {
  const { entityId } = await params;
  const entity = getBundle().indexes.entityById.get(entityId);
  return entity
    ? { title: entity.name, description: entity.description.slice(0, 160) }
    : { title: 'Structure not found' };
}

export default async function EntityZoomPage({
  params,
}: {
  params: Promise<{ entityId: string }>;
}) {
  const { entityId } = await params;
  const bundle = getBundle();
  const entity = bundle.indexes.entityById.get(entityId);
  if (!entity) notFound();

  const steps = zoomPath(bundle, entityId);
  const kids = children(bundle, entityId).map((c) => ({
    id: c.id,
    name: c.name,
    layerLabel: ENTITY_LAYER_LABEL[c.layer],
  }));

  return (
    <div className="space-y-6">
      <ZoomLadder steps={steps} childrenOfCurrent={kids} />

      <EntityZoomWorkspace
        entity={entity}
        bands={bundle.ageBands}
        ancestorNames={ancestors(bundle, entityId).map((a) => a.name)}
        hallmarks={entity.hallmark_ids
          .map((id) => bundle.indexes.hallmarkById.get(id))
          .filter((h) => h !== undefined)
          .map((h) => ({ id: h.id, name: h.name }))}
      />
    </div>
  );
}
