import { readFile, writeFile, readdir, mkdir, stat } from 'fs/promises'
import * as path from 'path'
import { stdin as input, stdout as output } from 'process'
import { createInterface } from 'readline/promises'
import { fileURLToPath } from 'url'

import { getAppTemplate, getIngressTemplate, getMigrationsTemplate, getSecretsTemplate, getWorkerTemplate } from '@cli/utils/getHelmTemplates'
import { logger } from '@cli/utils/logger'
import execa from 'execa'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CONDO_ROOT_PATH = path.resolve(__dirname, '../../../')

const HELM_DIR = path.resolve(CONDO_ROOT_PATH, './.helm')
const TEMPLATES_DIR = path.join(HELM_DIR, 'templates')
const REVIEW_DIR = path.join(TEMPLATES_DIR, 'review')
const SERVICES_URLS = path.join(TEMPLATES_DIR, '000-services-urls.yaml')

function padNum (n: number) {
    return String(n).padStart(3, '0')
}

function capitalize (s: string) {
    if (!s) return s
    return s[0].toUpperCase() + s.slice(1)
}

async function fileExists (p: string) {
    try {
        await stat(p)
        return true
    } catch {
        return false
    }
}

interface SetupHelmProps {
    appName: string
    wantReview: boolean
}

export async function setupHelm ({ appName, wantReview }: SetupHelmProps) {
    if (!(await fileExists(TEMPLATES_DIR))) {
        logger.error(`Templates dir not found: ${TEMPLATES_DIR}`)
        return
    }

    if (!(await fileExists(SERVICES_URLS))) {
        logger.error(`000-services-urls.yaml not found at ${SERVICES_URLS}`)
        return
    }

    // 0) determine next template number
    const files = await readdir(TEMPLATES_DIR)
    const prefixNums = files.map(f => {
        const m = f.match(/^(\d{3})-/)
        return m ? parseInt(m[1], 10) : null
    }).filter((n): n is number => n !== null)

    const maxPrefix = prefixNums.length ? Math.max(...prefixNums) : 0
    const nextBase = (Math.floor(maxPrefix / 10) * 10) + 10 // e.g. 130 -> 140
    const startBase = nextBase === 10 && maxPrefix === 0 ? 10 : nextBase

    const numbers = Array.from({ length: 5 }, (_, i) => padNum(startBase + i))

    logger.info('Detected highest prefix:', maxPrefix || '(none)')
    logger.info('Using prefix block:', numbers.join(', '))

    const targetNames = {
        app: `${numbers[0]}-${appName}-app.yaml`,
        secrets: `${numbers[1]}-${appName}-secrets.yaml`,
        worker: `${numbers[2]}-${appName}-worker.yaml`,
        migrations: `${numbers[3]}-${appName}-migrations.yaml`,
        ingress: `${numbers[4]}-${appName}-ingress.yaml`,
    }

    const createdFiles: string[] = []

    // Ensure review dir exists
    if (!(await fileExists(REVIEW_DIR))) {
        await mkdir(REVIEW_DIR, { recursive: true })
    }

    // 1) Update services_urls
    const servicesSrc = await readFile(SERVICES_URLS, 'utf8')
    const domainLine = `${appName.toUpperCase()}_DOMAIN: {{ ( printf "https://%s" $.Values.global.ci_${appName}_url ) | b64enc }}`
    let servicesOut = servicesSrc
    const insertBefore = servicesOut.lastIndexOf('{{- end')
    if (insertBefore !== -1) {
    // find the line start before the block
        const before = servicesOut.slice(0, insertBefore)
        const after = servicesOut.slice(insertBefore)
        // Insert a blank line + domainLine + newline then the after block
        servicesOut = before.trimEnd() + '\n' + domainLine + '\n\n' + after
    } else {
    // append
        servicesOut = servicesOut.trimEnd() + '\n' + domainLine + '\n'
    }

    await writeFile(SERVICES_URLS, servicesOut, 'utf8')
    createdFiles.push(SERVICES_URLS)
    logger.info('Updated', SERVICES_URLS, '-> added domain line for', appName)


    async function writeTemplateFile (filename: string, role: 'app' | 'secrets' | 'worker' | 'migrations' | 'ingress') {
        const outPath = path.join(TEMPLATES_DIR, filename)
        let outContent = ''

        const secretFilename = targetNames.secrets

        if (role === 'app') {
            outContent = getAppTemplate(appName, secretFilename)
        } else if (role === 'secrets') {
            outContent = getSecretsTemplate(appName)
        } else if (role === 'worker') {
            outContent = getWorkerTemplate(appName, secretFilename)
        } else if (role === 'migrations') {
            outContent = getMigrationsTemplate(appName, secretFilename)
        } else { // ingress
            outContent = getIngressTemplate(appName)
        }

        await writeFile(outPath, outContent, 'utf8')
        createdFiles.push(outPath)
        logger.info('Created', outPath)
    }

    // 2) create template .yaml files
    await writeTemplateFile(targetNames.app, 'app')
    await writeTemplateFile(targetNames.secrets, 'secrets')
    // TODO(@abshnko): ask in cli if worker is needed
    await writeTemplateFile(targetNames.worker, 'worker')
    await writeTemplateFile(targetNames.migrations, 'migrations')
    await writeTemplateFile(targetNames.ingress, 'ingress')

}