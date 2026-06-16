const crypto = require('crypto')

const got = require('got')

const conf = require('@open-condo/config')

const { modifyZipStream } = require('@dev-portal-api/domains/common/utils/streams')
const { injectScriptTags } = require('@dev-portal-api/domains/miniapp/utils/serverSchema/html')

const DISABLE_BUILD_RESTREAMING = conf['DISABLE_BUILD_RESTREAMING'] === 'true'
const B2C_APP_BUILD_INJECTED_SCRIPTS = JSON.parse(conf['B2C_APP_BUILD_INJECTED_SCRIPTS'] || '[]')

/**
 * Generates a hash for the build if build restreaming is enabled,
 * since single dev-portal-api build can produce multiple builds for condo because of injected scripts / B2CApp parameters
 * @returns {string|null}
 */
function generateB2CAppBuildHash () {
    if (DISABLE_BUILD_RESTREAMING) return null

    return crypto.createHash('sha256').update(JSON.stringify({
        scripts: B2C_APP_BUILD_INJECTED_SCRIPTS,
        // TODO: take device permissions into account once we support generation of native config
        permissions: [],
    })).digest('hex')
}

function getB2CAppBuildStream (publicUrl) {
    const originalStream = got.stream(publicUrl)

    if (DISABLE_BUILD_RESTREAMING) return originalStream

    const htmlFileMatcher = /^.+\.html$/
    const scriptTags = B2C_APP_BUILD_INJECTED_SCRIPTS
        .map((src) => `<script src="${src}"></script>`)
        .join('')

    return modifyZipStream(originalStream, {
        entries: [
            {
                match: (ctx) => htmlFileMatcher.test(ctx.path),
                process: async (ctx) => {
                    const content = (await ctx.entry.buffer()).toString('utf8')
                    return injectScriptTags(content, scriptTags)
                },
            },
        ],
    })
}

module.exports = {
    generateB2CAppBuildHash,
    getB2CAppBuildStream,
}