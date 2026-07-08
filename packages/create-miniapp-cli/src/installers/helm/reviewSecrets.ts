import { promises as fs } from 'fs'
import path from 'path'

import { REVIEW_DIR } from './constants.js'
import { fileExists } from './utils.js'

export async function updateReviewSecrets (appName: string) {
    const file = path.join(REVIEW_DIR, '04-review-secrets.yaml')

    if (!(await fileExists(file))) {
        return null
    }

    const content = await fs.readFile(file, 'utf8')
    const lines = content.split('\n')
    const desiredIndent = '  '

    const prefixLineIndex = lines.findIndex((line) => line.trimStart().startsWith('PG_REVIEW_PREFIX:'))
    if (prefixLineIndex === -1) {
        return null
    }

    const prefixLine = lines[prefixLineIndex]
    const prefixLineTrimmedStart = prefixLine.trimStart()
    const currentIndentLength = prefixLine.length - prefixLineTrimmedStart.length
    const currentIndent = prefixLine.slice(0, currentIndentLength)

    const normalizedLines = [...lines]
    if (currentIndent !== desiredIndent) {
        normalizedLines[prefixLineIndex] = `${desiredIndent}${prefixLineTrimmedStart}`
    }
    const normalizedContent = normalizedLines.join('\n')

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
    const outLines = [...normalizedLines]
    outLines.splice(prefixLineIndex, 0, ...insert.split('\n'))
    const out = outLines.join('\n')
    await fs.writeFile(file, out, 'utf8')

    return file
}
