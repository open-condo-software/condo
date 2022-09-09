const path = require('path')
const { readdirSync } = require('fs')

const appsDir = path.join(__dirname, 'apps')
const packagesDir = path.join(__dirname, 'packages')

const getAppNames = (dir) => readdirSync(dir, { withFileTypes: true })
    .filter(file => file.isDirectory())
    .map(file => file.name)

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
            'perf',
            'refactor',
            'revert',
            'style',
            'test',
        ]],
        'scope-enum': [2, 'always', [
            ...getAppNames(appsDir),
            ...getAppNames(packagesDir),
        ]],
        'subject-case': [1, 'always', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
        'function-rules/subject-min-length': [
            2,
            'always',
            ({ subject }) => {
                if (!subject || !subject.match(/DOMA-\d+(\s+\S+){2,}/)) {
                    return [
                        false,
                        'Commit message is too short. Subject must contains at least 2 words',
                    ]
                }

                return [true]
            },
        ],
        'function-rules/subject-empty': [
            2,
            'always',
            ({ subject }) => {
                if (!subject || !subject.match(/^DOMA-\d+/)) {
                    return [
                        false,
                        'Wrong commit subject. Commit subject must starts with task number. Allowed formats: DOMA-123',
                    ]
                }

                return [true]
            },
        ],
    },
}