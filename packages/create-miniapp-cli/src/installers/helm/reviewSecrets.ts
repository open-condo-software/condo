import { promises as fs } from 'fs'
import path from 'path'

import { REVIEW_DIR } from '@cli/installers/helm/constants'
import { fileExists } from '@cli/installers/helm/utils'

export async function updateReviewSecrets (appName: string) {
    const file = path.join(REVIEW_DIR, '04-review-secrets.yaml')

    if (!(await fileExists(file))) {
        return null
    }

    const content = await fs.readFile(file, 'utf8')
    const desiredIndent = '  '
    const prefixLineRe = /^(\s*)PG_REVIEW_PREFIX:.*$/m
    const prefixMatch = prefixLineRe.exec(content)
    if (!prefixMatch || prefixMatch.index === undefined) {
        return null
    }

    let normalizedContent = content
    if (prefixMatch[1] !== desiredIndent) {
        normalizedContent = content.slice(0, prefixMatch.index) +
            desiredIndent +
            content.slice(prefixMatch.index + prefixMatch[1].length)
    }

    const appUnderscore = appName.replace(/-/g, '_')
    const upperUnderscore = appUnderscore.toUpperCase()
    const sentinel = `PG_REVIEW_${upperUnderscore}_USER`
    if (normalizedContent.includes(sentinel)) {
        if (normalizedContent !== content) {
            await fs.writeFile(file, normalizedContent, 'utf8')
        }
        return file
    }

    const insert = `${desiredIndent}PG_REVIEW_${upperUnderscore}_USER: {{ .Values.review.pg_${appUnderscore}._default | b64enc }}\n${desiredIndent}PG_REVIEW_${upperUnderscore}_PASS: {{ .Values.review.pg_${appUnderscore}._default | b64enc }}\n${desiredIndent}PG_REVIEW_${upperUnderscore}_DB: {{ .Values.review.pg_${appUnderscore}._default | b64enc }}`
    const normalizedPrefixMatch = prefixLineRe.exec(normalizedContent)

    if (!normalizedPrefixMatch || normalizedPrefixMatch.index === undefined) {
        return null
    }
    const before = normalizedContent.slice(0, normalizedPrefixMatch.index)
    const after = normalizedContent.slice(normalizedPrefixMatch.index)
    const out = before.trimEnd() + '\n' + insert + '\n' + after
    await fs.writeFile(file, out, 'utf8')

    return file
}
