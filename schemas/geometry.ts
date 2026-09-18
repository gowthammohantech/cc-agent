import { z } from 'zod';
import { IdSlug } from './primitives.js';

/**
 * The body figure is built from procedural primitives — there are no licensed
 * anatomical assets here. Keeping every anchor, scale and entity binding in
 * content rather than code means the layout is reviewable in a diff, and means
 * the three.js, SVG and DOM renderers are all driven from one source and cannot
 * drift apart.
 */
export const Vec3 = z.tuple([z.number(), z.number(), z.number()]);

export const PrimitiveSpec = z.discriminatedUnion('shape', [
  z.object({
    shape: z.literal('ellipsoid'),
    radius: z.number().positive(),
    scale: Vec3,
  }),
  z.object({
    shape: z.literal('capsule'),
    radius: z.number().positive(),
    length: z.number().positive(),
  }),
  z.object({
    shape: z.literal('lathe'),
    /** Profile curve in [radius, height] pairs, revolved around Y. */
    profile: z.array(z.tuple([z.number(), z.number()])).min(3),
    depth_scale: z.number().positive().default(1),
  }),
  z.object({
    shape: z.literal('tube'),
    path: z.array(Vec3).min(2),
    radius: z.number().positive(),
  }),
  z.object({
    shape: z.literal('box'),
    size: Vec3,
    bevel: z.number().min(0).default(0),
  }),
]);
export type PrimitiveSpec = z.infer<typeof PrimitiveSpec>;

export const BodyPartSchema = z.object({
  geometry_key: z.string().min(2),
  entity_id: IdSlug,
  label: z.string().min(2),
  system_id: IdSlug,
  position: Vec3,
  rotation: Vec3.default([0, 0, 0]),
  primitive: PrimitiveSpec,
  /** Mirror across X for paired structures (lungs, kidneys, limbs). */
  mirror_x: z.boolean().default(false),
  /** Draw order hint for the 2D SVG projection: higher sits in front. */
  svg_depth: z.number().int().default(0),
});
export type BodyPart = z.infer<typeof BodyPartSchema>;

export const BodyLayoutSchema = z.object({
  /** Normalized figure height; all positions are in these units. */
  figure_height: z.number().positive(),
  shell: z.array(BodyPartSchema).min(1),
  parts: z.array(BodyPartSchema),
  stylization_notice: z.string().min(40),
});
export type BodyLayout = z.infer<typeof BodyLayoutSchema>;
