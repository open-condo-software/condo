
// NOTE: These values are used in getStaticProps, so they should be available at build time.
// You can use different values in yarn start and yarn build, which can cause some bugs in CI envs
// That's the reason they're moved away from publicRuntimeConfig, and only accessible from process.env
// https://github.com/vercel/next.js/discussions/11493#discussioncomment-14606
export const DOCS_ROOT_PATH = process.env.DOCS_ROOT_PATH || 'docs'
export const DOCS_REPO = process.env.DOCS_REPO || 'https://github.com/open-condo-software/condo'
export const DOCS_REPO_DOCS_ROOT = process.env.DOCS_REPO_DOCS_ROOT || 'apps/dev-portal/docs'
export const DOCS_EDIT_BRANCH = process.env.DOCS_EDIT_BRANCH || 'master'