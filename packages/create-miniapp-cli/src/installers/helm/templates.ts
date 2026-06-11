import { promises as fs } from 'fs'
import path from 'path'

import { HELM_TEMPLATES } from './constants.js'
import { fileExists, padNum } from './utils.js'

import { APP_TYPES, AppType, CONDO_ROOT } from '../../consts.js'
import { resolvePathInside } from '../../utils/resolvePathInside.js'

const HELM_DIR = path.resolve(CONDO_ROOT, './.helm')
const TEMPLATES_DIR = path.join(HELM_DIR, 'templates')

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

export async function writeHelmTemplates (
    appName: string,
    nextPrefix: number,
    reviewEnabled: boolean,
    hasWorker: boolean,
    appType: AppType,
) {
    const created: string[] = []
    const existingFiles = await fs.readdir(TEMPLATES_DIR)
    const names = [
        'app',
        'secrets',
        ...(hasWorker ? ['worker' as const] : []),
        ...(appType === APP_TYPES.client ? [] : ['migrations' as const]),
        'ingress',
    ] as const
    let prefixOffset = 0
    for (const role of names) {
        const suffix = `-${appName}-${role}.yaml`
        const existingFile = existingFiles.find((file) => {
            return /^\d{3}-/.test(file) && file.endsWith(suffix)
        })
        if (existingFile) {
            created.push(resolvePathInside(TEMPLATES_DIR, existingFile))
            continue
        }

        const fileName = `${padNum(nextPrefix + prefixOffset)}-${appName}-${role}.yaml`
        const fullPath = resolvePathInside(TEMPLATES_DIR, fileName)
        const content = fillTemplate(HELM_TEMPLATES[role], appName, reviewEnabled)
        if (await fileExists(fullPath)) {
            throw new Error(`File already exists: ${fullPath} - aborting to avoid overwrite`)
        }
        await fs.writeFile(fullPath, content, 'utf8')
        created.push(fullPath)
        prefixOffset++
    }

    return created
}
