const commitAnalyzer = require('@mono-pub/commit-analyzer')
const git = require('@mono-pub/git')
const github = require('@mono-pub/github')
const npm = require('@mono-pub/npm')
const execa = require('execa')
const publish = require('mono-pub')
const { getExecutionOrder } = require('mono-pub/utils')

/** @type {import('mono-pub').MonoPubPlugin} */
const builder = {
    name: '@open-condo/turbo-builder',
    async prepareAll ({ foundPackages }, ctx) {
        const batches = getExecutionOrder(foundPackages, { batching: true })
        for (const batch of batches) {
            await execa('yarn', ['build', ...batch.map((pkg) => `--filter=${pkg.name}`)], { cwd: ctx.cwd })
        }
    },
}

function getReleaseSection (types, section) {
    return types.map((type) => ({ type, section }))
}

const BREAKING_KEYWORDS = ['BREAKING CHANGE', 'BREAKING CHANGES', 'BREAKING-CHANGE', 'BREAKING-CHANGES']

// NOTE: Edit this list to add / remove packages from auto-release cycle
const RELEASE_LIST = [
    'packages/apollo',
    'packages/bridge',
    'packages/icons',
    'packages/migrator',
    'packages/miniapp-utils',
    'packages/tsconfig',
    'packages/ui',
]

publish(RELEASE_LIST, [
    git(),
    github({
        extractCommitsFromSquashed: true,
        releaseNotesOptions: {
            rules: [
                { breaking: true, section: '⚠️ BREAKING CHANGES' },
                { type: 'feat', section: '✨ New Features' },
                ...getReleaseSection(['fix', 'hotfix'], '🐛 Bug Fixes'),
                { type: 'perf', section: '🚀 Performance Improvements' },
                ...getReleaseSection(['docs', 'style', 'refactor', 'test', 'build', 'ci', 'chore', 'revert'], '🦖 Other Changes'),
                { dependency: true, section: '🌐 Dependencies' },
            ],
            breakingNoteKeywords: BREAKING_KEYWORDS,
        },
    }),
    commitAnalyzer({
        patchTypes: ['fix', 'hotfix', 'revert', 'perf'],
        breakingNoteKeywords: BREAKING_KEYWORDS,
    }),
    builder,
    npm({ provenance: true }),
])