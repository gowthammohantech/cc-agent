import manifest from '@content/manifest.json';

/**
 * The content version is echoed in every API response envelope and in the site
 * footer, so any screenshot or shared link is traceable back to an exact
 * scientific content state (see the versioning strategy in CLAUDE.md).
 */
export const CONTENT_VERSION: string = manifest.content_version;
export const CONTENT_GENERATED_AT: string = manifest.generated_at;
export const RECORDS_HASH: string = manifest.records_hash;
