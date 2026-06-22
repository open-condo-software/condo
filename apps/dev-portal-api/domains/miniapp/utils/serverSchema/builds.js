const crypto = require('crypto')

const got = require('got')
const { z } = require('zod')


const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')

const { modifyZipStream } = require('@dev-portal-api/domains/common/utils/streams')
const { injectScriptTags } = require('@dev-portal-api/domains/miniapp/utils/serverSchema/html')

const PACKAGE_JSON_SCHEMA = z.object({
    name: z.string(),
    version: z.string(),
})

const DISABLE_BUILD_RESTREAMING = conf['DISABLE_BUILD_RESTREAMING'] === 'true'
const B2C_APP_BUILD_INJECTED_SCRIPTS = JSON.parse(conf['B2C_APP_BUILD_INJECTED_SCRIPTS'] || '[]')

async function _fetchScriptContent ({ packageSrc, scriptSrc }) {
    const response = await fetch(packageSrc)
    if (response.status !== 200) throw new Error(`Failed to fetch script package description: ${response.status}`)
    const body = await response.json()
    const { name, version } = PACKAGE_JSON_SCHEMA.parse(body)
    const scriptUrl = scriptSrc.replace('{{version}}', version)
    const scriptResponse = await fetch(scriptUrl)
    if (scriptResponse.status !== 200) throw new Error(`Failed to fetch script content: ${scriptResponse.status}`)
    const scriptText = await scriptResponse.text()

    return {
        name,
        version,
        script: scriptText,
    }
}

/**
 * Prepares metadata for the build if build restreaming is enabled,
 * since single dev-portal-api build can produce multiple builds for condo because of injected scripts / B2CApp parameters
 * @returns {Promise<{hash: string | null, scripts: {name: string, version: string, script: string, injectPath: string}[], permissions: string[]}>}
 */
async function prepareB2CAppBuildMetadata () {
    if (DISABLE_BUILD_RESTREAMING) return {
        hash: null,
        scripts: [],
        permissions: [],
    }

    const scripts = await Promise.all(B2C_APP_BUILD_INJECTED_SCRIPTS.map(async ({ packageSrc, scriptSrc, injectPath }) => {
        const { name, version, script } = await _fetchScriptContent({ packageSrc, scriptSrc })
        return { name, version, script, injectPath }
    }))

    const signObject = {
        dv: 1,
        scripts: scripts.map(({ name, version, injectPath }) => `${name}:${version}:${injectPath}`),
        permissions: [],
    }

    const hash = crypto.createHash('sha256').update(JSON.stringify(signObject)).digest('hex')

    return {
        hash,
        scripts,
        permissions: [],
    }
}

/**
 * Returns a stream of the build to upload to condo stand
 * Might be modified to inject scripts via build restreaming
 */
function getB2CAppBuildStream (publicUrl, metadata) {
    const originalStream = got.stream(publicUrl)

    if (DISABLE_BUILD_RESTREAMING) return originalStream

    const htmlFileMatcher = /^.+\.html$/
    const scriptTags = metadata.scripts
        .map(({ injectPath }) => `<script src="${injectPath}"></script>`)
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
        afterEntries: ({ append }) => {
            for (const { script, injectPath } of metadata.scripts) {
                const scriptPath = `www/${injectPath}`
                append({ path: scriptPath, content: script })
            }
        },
    })
}

module.exports = {
    prepareB2CAppBuildMetadata,
    getB2CAppBuildStream,
}