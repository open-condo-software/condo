const path = require('path')

const get = require('lodash/get')
const set = require('lodash/set')

const { requireTs } = require('./domains/common/utils/requireTs')
const localesPath = path.resolve(__dirname, 'domains/common/constants/locales.ts')
const { LOCALES, DEFAULT_LOCALE } = requireTs(localesPath)

const docsRootPath = process.env.DOCS_ROOT_PATH || 'docs'
const docsEntryEndpoint = process.env.DOCS_ENTRY_ENDPOINT || '/docs/index'
const docsRepo = process.env.DOCS_REPO
const docsRepoDocsRoot = process.env.DOCS_REPO_DOCS_ROOT || '/'
const docsEditBranch = process.env.DOCS_EDIT_BRANCH || 'master'

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    i18n: {
        locales: LOCALES,
        defaultLocale: DEFAULT_LOCALE,
    },
    transpilePackages: [
        'antd',
    ],
    publicRuntimeConfig: {
        docsRootPath,
        docsEntryEndpoint,
        docsRepo,
        docsRepoDocsRoot,
        docsEditBranch,
    },
    async redirects () {
        return [
            {
                source: '/',
                destination: docsEntryEndpoint,
                permanent: false,
            },
        ]
    },
    webpack: (config) => {
        const rules = get(config, ['module', 'rules'], [])

        const newRules = rules.map(rule => {
            if (!rule.oneOf) {
                return rule
            }

            rule.oneOf = rule.oneOf.map(option => {
                if (option && option.test && typeof option.test.test === 'function' &&
                    option.test.test('my.module.css') && Array.isArray(option.use)) {
                    option.use = option.use.map(loader => {
                        if (typeof loader.loader === 'string' && loader.loader.includes('/css-loader')) {
                            set(loader, ['options', 'modules', 'exportLocalsConvention'], 'camelCase')
                        }

                        return loader
                    })
                }

                return option
            })

            return rule
        })

        set(config, ['module', 'rules'], newRules)

        return config
    },
}

module.exports = nextConfig