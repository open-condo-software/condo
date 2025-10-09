import { promises as fs } from 'fs'
import path from 'path'

import { CONDO_ROOT } from '@cli/consts'
import { HELM_TEMPLATES } from '@cli/installers/helm/constants'
import { fileExists, padNum } from '@cli/installers/helm/utils'

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

export async function writeHelmTemplates (appName: string, nextPrefix: number, reviewEnabled: boolean) {
    const created: string[] = []
    // TODO(@abshnko): filter out needed templates based on appType and user's input
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