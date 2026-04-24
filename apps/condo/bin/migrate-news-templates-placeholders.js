/**
 * Migrates old news template placeholders from square brackets to angle brackets.
 *
 * Example:
 *   [address] -> <address>
 *
 * Usage:
 *   yarn workspace @app/condo node bin/migrate-news-templates-placeholders
 */

const path = require('path')

const { GraphQLApp } = require('@open-keystone/app-graphql')


const PROCESS_CHUNK_SIZE = 200
const SCRIPT_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'migrate-news-templates-placeholders' } }

function log (message, payload = '') {
    console.log(message, payload)
}

function isLinkBracket (text, matchIndex, matchLength) {
    return text[matchIndex + matchLength] === '('
}

function replaceSquarePlaceholders (text) {
    if (!text || text.indexOf('[') === -1) return { updatedText: text, replacementsCount: 0 }

    let replacementsCount = 0
    const updatedText = text.replace(/\[([^[\]]+?)\]/g, (match, placeholder, offset, source) => {
        // Keep markdown links untouched: [label](https://...)
        if (isLinkBracket(source, offset, match.length)) return match
        replacementsCount += 1
        return `<${placeholder}>`
    })

    return { updatedText, replacementsCount }
}

async function getTemplatesBatch (context, cursorId) {
    const query = context.adapter.knex('NewsItemTemplate')
        .select('id', 'title', 'body')
        .whereNull('deletedAt')
        .orderBy('id', 'asc')
        .limit(PROCESS_CHUNK_SIZE)

    if (cursorId) query.andWhere('id', '>', cursorId)

    return query
}

async function updateTemplate (context, id, title, body) {
    await context.adapter.knex('NewsItemTemplate')
        .where({ id })
        .update({
            title,
            body,
            ...SCRIPT_SENDER,
            updatedAt: context.adapter.knex.fn.now(),
        })
}

async function main () {
    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)

    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()

    const stats = {
        scanned: 0,
        updated: 0,
        titleReplacements: 0,
        bodyReplacements: 0,
    }

    let cursorId = null
    let hasMore = true

    while (hasMore) {
        const templates = await getTemplatesBatch(keystone, cursorId)
        hasMore = templates.length === PROCESS_CHUNK_SIZE

        for (const template of templates) {
            stats.scanned += 1
            cursorId = template.id

            const { updatedText: title, replacementsCount: titleReplacements } = replaceSquarePlaceholders(template.title)
            const { updatedText: body, replacementsCount: bodyReplacements } = replaceSquarePlaceholders(template.body)

            if (titleReplacements === 0 && bodyReplacements === 0) continue

            await updateTemplate(keystone, template.id, title, body)
            stats.updated += 1
            stats.titleReplacements += titleReplacements
            stats.bodyReplacements += bodyReplacements
        }

        log('Processed batch', { cursorId, scanned: stats.scanned, updated: stats.updated })
    }

    log('Migration completed', stats)
    process.exit(0)
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
