const { readdirSync } = require('fs')
const path = require('path')

const appsDir = path.join(__dirname, 'apps')
const packagesDir = path.join(__dirname, 'packages')

const getAppNames = (dir) => readdirSync(dir, { withFileTypes: true })
    .filter(file => file.isDirectory())
    .map(file => file.name)

const TASK_NAMESPACES = ['DOMA', 'INFRA']

const SUBJECT_TASK_PREFIX = `^(${TASK_NAMESPACES.join('|')})-\\d+`
const SUBJECT_TASK_REGEX = new RegExp(SUBJECT_TASK_PREFIX)

const HOTFIX_SUBJECT_WORDS_REGEX = /\S+\s+\S+/
const SUBJECT_WORDS_REGEX = new RegExp(`${SUBJECT_TASK_PREFIX}(\\s+\\S+){2,}`)

module.exports = {
    extends: ['@commitlint/config-conventional'],
    plugins: ['commitlint-plugin-function-rules'],
    rules: {
        'header-max-length': [1, 'always', 52],
        'body-max-line-length': [1, 'always', 72],
        'type-enum': [2, 'always', [
            'build',
            'chore',
            'ci',
            'docs',
            'feat',
            'fix',
            'hotfix',
            'perf',
            'refactor',
            'revert',
            'style',
            'test',
        ]],
        'scope-enum': [2, 'always', [
            'global',
            'deps',
            ...getAppNames(appsDir),
            ...getAppNames(packagesDir),
        ]],
        'subject-case': [1, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
        'function-rules/scope-empty': [2, 'always'],
        'function-rules/subject-min-length': [
            2,
            'always',
            ({ subject, type }) => {
                const regex = type === 'hotfix' ? HOTFIX_SUBJECT_WORDS_REGEX : SUBJECT_WORDS_REGEX
                if (!subject || !regex.test(subject)) {
                    return [
                        false,
                        'Commit message is too short. Subject should contains at least 2 words',
                    ]
                }

                return [true]
            },
        ],
        'function-rules/subject-empty': [
            2,
            'always',
            ({ subject, type }) => {
                if (type !== 'hotfix' && (!subject || !SUBJECT_TASK_REGEX.test(subject))) {
                    const allowedFormats = TASK_NAMESPACES.map(space => `${space}-1234`).join(', ')
                    const errorMessage = `Wrong commit subject. All commit subjects should start with task number. Allowed task formats: [${allowedFormats}]`

                    return [
                        false,
                        errorMessage,
                    ]
                }

                return [true]
            },
        ],
    },
}