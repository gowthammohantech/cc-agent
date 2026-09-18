/**
 * Content integrity gate. Runs before every build.
 *
 * Schema validation happens inside the loader (which throws), so this script
 * covers what a schema cannot see: references that point at nothing, ids that
 * collide, and the coverage floors that stop the app shipping a visibly empty
 * core.
 */
import { getBundle } from '../src/content/bundle.js';
import { checkReferentialIntegrity, checkCoverage } from '../src/content/integrity.js';

function main(): void {
  let bundle;
  try {
    bundle = getBundle();
  } catch (err) {
    console.error('\nverify:content FAILED — schema validation error:\n');
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  const problems = [...checkReferentialIntegrity(bundle), ...checkCoverage(bundle)];

  const counts = [
    `${bundle.entities.length} entities`,
    `${bundle.hallmarks.length} hallmarks`,
    `${bundle.observations.length} observations`,
    `${bundle.trajectories.length} trajectories`,
    `${bundle.relationships.length} relationships`,
    `${bundle.rejuvenationTargets.length} rejuvenation targets`,
    `${bundle.researchApproaches.length} research approaches`,
    `${bundle.studies.length} studies`,
  ].join(', ');

  if (problems.length === 0) {
    console.log(`verify:content — OK. ${counts}.`);
    if (bundle.trajectories.length === 0) {
      console.log(
        'verify:content — note: the trajectory corpus is empty by design; see content/trajectories/trajectories.json.',
      );
    }
    return;
  }

  console.error(`\nverify:content FAILED — ${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`  [${p.kind}] ${p.message}`);
  console.error('');
  process.exit(1);
}

main();
