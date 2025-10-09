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
    const appUnderscore = appName.replace(/-/g, '_')
    const upperUnderscore = appUnderscore.toUpperCase()
    const insert = `  PG_REVIEW_${upperUnderscore}_USER: {{ .Values.review.pg_${appUnderscore}._default | b64enc }}\n  PG_REVIEW_${upperUnderscore}_PASS: {{ .Values.review.pg_${appUnderscore}._default | b64enc }}\n  PG_REVIEW_${upperUnderscore}_DB: {{ .Values.review.pg_${appUnderscore}._default | b64enc }}`
    const idx = content.lastIndexOf('PG_REVIEW_PREFIX')
    
    if (idx === -1) {
        return null
    }
    const before = content.slice(0, idx)
    const after = content.slice(idx)
    const out = before.trimEnd() + '\n' + insert + '\n' + after
    await fs.writeFile(file, out, 'utf8')

    return file
}
