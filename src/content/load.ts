import {
  AgeBandFileSchema,
  BodyLayoutSchema,
  DisclaimersSchema,
  EntityFileSchema,
  EvidenceProfileFileSchema,
  HallmarkSchema,
  ObservationFileSchema,
  PopulationFileSchema,
  RejuvenationDefinitionsSchema,
  RejuvenationTargetSchema,
  RelationshipFileSchema,
  ResearchApproachFileSchema,
  SimulationModelSchema,
  StudyFileSchema,
  TrajectoryFileSchema,
  type AgeBand,
  type BiologicalEntity,
  type BodyLayout,
  type Disclaimers,
  type EvidenceProfile,
  type Hallmark,
  type Observation,
  type Population,
  type RejuvenationDefinitions,
  type RejuvenationTarget,
  type Relationship,
  type ResearchApproach,
  type SimulationModel,
  type Study,
  type Trajectory,
} from '@schemas/index';
import { z } from 'zod';

import ageBandsRaw from '@content/age-bands.json';
import populationsRaw from '@content/populations.json';
import entitiesRaw from '@content/entities/entities.json';
import hallmarksRaw from '@content/hallmarks/hallmarks.json';
import observationsRaw from '@content/observations/observations.json';
import trajectoriesRaw from '@content/trajectories/trajectories.json';
import relationshipsRaw from '@content/relationships/relationships.json';
import studiesRaw from '@content/evidence/studies.json';
import profilesRaw from '@content/evidence/evidence-profiles.json';
import approachesRaw from '@content/rejuvenation/research-approaches.json';
import targetsRaw from '@content/rejuvenation/targets.json';
import modelRaw from '@content/simulation/model-v1.json';
import layoutRaw from '@content/geometry/body-layout.json';
import disclaimersRaw from '@content/copy/disclaimers.json';
import definitionsRaw from '@content/copy/rejuvenation-definitions.json';

/**
 * Content is parsed once, at module init, and throws on failure.
 *
 * Failing loudly here is deliberate: a malformed scientific record must stop
 * the build rather than degrade quietly into a page that renders a claim
 * without its evidence.
 */
function parse<T>(schema: z.ZodType<T>, raw: unknown, what: string): T {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 12)
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(
      `Content validation failed for ${what} (${result.error.issues.length} issue(s)):\n${issues}`,
    );
  }
  return result.data;
}

const HallmarkFileSchema = z.object({ hallmarks: z.array(HallmarkSchema) });
const TargetFileSchema = z.object({ rejuvenation_targets: z.array(RejuvenationTargetSchema) });

export interface RawContent {
  ageBands: AgeBand[];
  populations: Population[];
  entities: BiologicalEntity[];
  hallmarks: Hallmark[];
  observations: Observation[];
  trajectories: Trajectory[];
  relationships: Relationship[];
  studies: Study[];
  evidenceProfiles: EvidenceProfile[];
  researchApproaches: ResearchApproach[];
  rejuvenationTargets: RejuvenationTarget[];
  simulationModel: SimulationModel;
  bodyLayout: BodyLayout;
  disclaimers: Disclaimers;
  rejuvenationDefinitions: RejuvenationDefinitions;
}

export function loadRawContent(): RawContent {
  return {
    ageBands: parse(AgeBandFileSchema, ageBandsRaw, 'age-bands.json').age_bands,
    populations: parse(PopulationFileSchema, populationsRaw, 'populations.json').populations,
    entities: parse(EntityFileSchema, entitiesRaw, 'entities/entities.json').entities,
    hallmarks: parse(HallmarkFileSchema, hallmarksRaw, 'hallmarks/hallmarks.json').hallmarks,
    observations: parse(ObservationFileSchema, observationsRaw, 'observations/observations.json')
      .observations,
    trajectories: parse(TrajectoryFileSchema, trajectoriesRaw, 'trajectories/trajectories.json')
      .trajectories,
    relationships: parse(
      RelationshipFileSchema,
      relationshipsRaw,
      'relationships/relationships.json',
    ).relationships,
    studies: parse(StudyFileSchema, studiesRaw, 'evidence/studies.json').studies,
    evidenceProfiles: parse(
      EvidenceProfileFileSchema,
      profilesRaw,
      'evidence/evidence-profiles.json',
    ).evidence_profiles,
    researchApproaches: parse(
      ResearchApproachFileSchema,
      approachesRaw,
      'rejuvenation/research-approaches.json',
    ).research_approaches,
    rejuvenationTargets: parse(TargetFileSchema, targetsRaw, 'rejuvenation/targets.json')
      .rejuvenation_targets,
    simulationModel: parse(SimulationModelSchema, modelRaw, 'simulation/model-v1.json'),
    bodyLayout: parse(BodyLayoutSchema, layoutRaw, 'geometry/body-layout.json'),
    disclaimers: parse(DisclaimersSchema, disclaimersRaw, 'copy/disclaimers.json'),
    rejuvenationDefinitions: parse(
      RejuvenationDefinitionsSchema,
      definitionsRaw,
      'copy/rejuvenation-definitions.json',
    ),
  };
}
