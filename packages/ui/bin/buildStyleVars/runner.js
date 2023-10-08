const path = require('path')

const { program } = require('commander')
const uniq = require('lodash/uniq')
const StyleDictionaryLib = require('style-dictionary')

const { allTransformers, webVarsTransformersChain } = require('./transformers')

const TOKENS_DIR = path.join(__dirname, '../..', 'src/tokens')
const SOURCE_PATH = path.join(TOKENS_DIR, 'sets/*.json')
// Less is used for development, CSS is used for strict token values check
// Can be expanded with SCSS if someday we will decide to give tokens out
// It's also possible to generate mobile tokens for iOS and Android here
const AVAILABLE_WEB_FORMATS = ['css', 'less']
const BRAND_PREFIX = 'condo'

const config = {
    source: [SOURCE_PATH],
    platforms: {},
}

program.option('-w, --web <types...>', 'specify web variable types')
program.parse()
const opts = program.opts()

if (opts.web) {
    if (!Array.isArray(opts.web) || opts.web.some(varType => !AVAILABLE_WEB_FORMATS.includes(varType))) {
        const errorMessage = `Invalid variable types for web platform. It must be at least one of the following: ${AVAILABLE_WEB_FORMATS.join(', ')}`
        throw new Error(errorMessage)
    } else {
        config.platforms.web = {
            transforms: webVarsTransformersChain,
            prefix: BRAND_PREFIX,
            buildPath: `${TOKENS_DIR}/`,
            files: uniq(opts.web).map(varType => ({
                destination: `variables.${varType}`,
                format: `${varType}/variables`,
            })),
        }
    }
}

const StyleDictionary = StyleDictionaryLib.extend(config)

for (const transformer of allTransformers) {
    StyleDictionary.registerTransform(transformer)
}

StyleDictionary.buildAllPlatforms()
