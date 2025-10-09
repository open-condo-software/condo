import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { logger } from '@cli/utils/logger'

import { HELM_TEMPLATES } from './helmTemplates'

interface SetupHelmProps {
    appName: string
    wantReview: boolean
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CONDO_ROOT_PATH = path.resolve(__dirname, '../../../')

const HELM_DIR = path.resolve(CONDO_ROOT_PATH, './.helm')
const TEMPLATES_DIR = path.join(HELM_DIR, 'templates')
const REVIEW_DIR = path.join(TEMPLATES_DIR, 'review')
const SERVICES_URLS = path.join(TEMPLATES_DIR, '000-services-urls.yaml')

async function fileExists (p: string) {
    try {
        await fs.stat(p)
        return true
    } catch {
        return false
    }
}

function padNum (n: number) {
    return String(n).padStart(3, '0')
}

async function getNextPrefix () {
    const files = await fs.readdir(TEMPLATES_DIR)
    const nums = files
        .map(f => f.match(/^(\d{3})-/))
        .filter(Boolean)
        .map(m => parseInt(m![1], 10))
    const max = nums.length ? Math.max(...nums) : 0
    // if no templates found start at 100
    if (max === 0) return 100
    return (Math.floor(max / 10) * 10) + 10
}

async function updateServicesUrls (appName: string) {
    const content = await fs.readFile(SERVICES_URLS, 'utf8')
    const upperUnderscoredAppName = appName.replace(/-/g, '_').toUpperCase()
    const line = `${upperUnderscoredAppName}_DOMAIN: {{ ( printf "https://%s" $.Values.global.ci_${upperUnderscoredAppName}_url ) | b64enc }}`
    const idx = content.lastIndexOf('{{- end')
    let out = ''
    if (idx !== -1) {
        out = content.slice(0, idx).trimEnd() + '\n' + line + '\n\n' + content.slice(idx)
    } else {
        out = content.trimEnd() + '\n' + line + '\n'
    }
    await fs.writeFile(SERVICES_URLS, out, 'utf8')
    return SERVICES_URLS
}

function fillTemplate (template: string, appName: string, reviewEnabled: boolean) {
    const appUnderscore = appName.replace(/-/g, '_')
    const appUpperUnderscore = appUnderscore.toUpperCase()
    const appUpper = appName.toUpperCase()
    const wrapperStart = reviewEnabled ? '' : '{{- if ne .Values.werf.env "review" }}'
    const wrapperEnd = reviewEnabled ? '' : '{{- end }}'

    return template
        .replace(/\$\{APP\}/g, appName)
        .replace(/\$\{APP_UNDERSCORE\}/g, appUnderscore)
        .replace(/\$\{APP_UPPER_UNDERSCORE\}/g, appUpperUnderscore)
        .replace(/\$\{APP_UPPER\}/g, appUpper)
        .replace(/\$\{REVIEW_NE_WRAPPER_START\}/g, wrapperStart)
        .replace(/\$\{REVIEW_NE_WRAPPER_END\}/g, wrapperEnd)
}

async function writeHelmTemplates (appName: string, nextPrefix: number, reviewEnabled: boolean) {
    const created: string[] = []
    const names = ['app', 'secrets', 'worker', 'migrations', 'ingress'] as const
    for (let i = 0; i < names.length; i++) {
        const role = names[i]
        const fileName = `${padNum(nextPrefix + i)}-${appName}-${role}.yaml`
        const fullPath = path.join(TEMPLATES_DIR, fileName)
        const content = fillTemplate(HELM_TEMPLATES[role], appName, reviewEnabled)
        if (await fileExists(fullPath)) {
            throw new Error(`File already exists: ${fullPath} - aborting to avoid overwrite`)
        }
        await fs.writeFile(fullPath, content, 'utf8')
        created.push(fullPath)
    }
    return created
}

async function updateReviewSecrets (appName: string) {
    const file = path.join(REVIEW_DIR, '04-review-secrets.yaml')
    if (!(await fileExists(file))) return null
    const content = await fs.readFile(file, 'utf8')
    const appUnderscore = appName.replace(/-/g, '_')
    const upperUnderscore = appUnderscore.toUpperCase()
    const insert = `  PG_REVIEW_${upperUnderscore}_USER: {{ .Values.review.pg_${appUnderscore}._default | b64enc }}\n  PG_REVIEW_${upperUnderscore}_PASS: {{ .Values.review.pg_${appUnderscore}._default | b64enc }}\n  PG_REVIEW_${upperUnderscore}_DB: {{ .Values.review.pg_${appUnderscore}._default | b64enc }}`
    const idx = content.lastIndexOf('PG_REVIEW_PREFIX')
    if (idx === -1) return null
    const before = content.slice(0, idx)
    const after = content.slice(idx)
    const out = before.trimEnd() + '\n' + insert + '\n' + after
    await fs.writeFile(file, out, 'utf8')
    return file
}


export async function setupHelm ({ appName, wantReview }: SetupHelmProps) {

    const nextPrefix = await getNextPrefix()
    logger.info(`Next prefix block: ${nextPrefix}`)

    const created = await writeHelmTemplates(appName, nextPrefix, wantReview)
    const servicesFile = await updateServicesUrls(appName)

    if (wantReview) {
        const reviewFile = await updateReviewSecrets(appName)
        if (reviewFile) created.push(reviewFile)
    }

    created.push(servicesFile)

    logger.success('Helm setup completed! Created/modified files:\n' + created.join('\n'))
}