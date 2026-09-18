/**
 * AgeLens safety rule (FR-17).
 *
 * Claim-bearing components must never be rendered without their provenance
 * wired through. The likeliest real-world regression in this codebase is
 * someone adding a scientific statement to the UI and forgetting the evidence
 * that backs it; this rule makes that a lint error rather than a review catch.
 */
const GUARDED_COMPONENTS = new Set([
  'ScientificStatement',
  'HallmarkCard',
  'CompareRow',
  'TargetCard',
  'ObservationStatement',
]);

/**
 * Any of these names denotes something carrying provenance. TypeScript already
 * enforces required props, so this rule's real value is the case TypeScript
 * cannot see: a provenance-bearing prop that is optional or nullable, and gets
 * quietly dropped at a call site.
 */
const ACCEPTED_PROPS = new Set([
  'provenance',
  'evidence',
  'evidenceProfile',
  'gate',
  'badge',
  'state',
  'observation',
  'target',
]);

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require a provenance/evidence prop on claim-bearing AgeLens components (FR-17).',
    },
    schema: [],
    messages: {
      missingEvidence:
        '<{{name}}> renders a scientific claim but has no provenance. Pass one of: {{accepted}}. See FR-17 and CLAUDE.md.',
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const nameNode = node.name;
        if (nameNode.type !== 'JSXIdentifier') return;
        if (!GUARDED_COMPONENTS.has(nameNode.name)) return;

        const hasEvidence = node.attributes.some((attr) => {
          // A spread could supply it; don't produce false positives on {...props}.
          if (attr.type === 'JSXSpreadAttribute') return true;
          return attr.name?.type === 'JSXIdentifier' && ACCEPTED_PROPS.has(attr.name.name);
        });

        if (!hasEvidence) {
          context.report({
            node,
            messageId: 'missingEvidence',
            data: {
              name: nameNode.name,
              accepted: [...ACCEPTED_PROPS].join(', '),
            },
          });
        }
      },
    };
  },
};

export default rule;
