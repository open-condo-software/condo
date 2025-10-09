import { promises as fs } from 'fs'
import path from 'path'

import { CONDO_ROOT } from '@cli/consts'

const HELM_DIR = path.resolve(CONDO_ROOT, './.helm')
const TEMPLATES_DIR = path.join(HELM_DIR, 'templates')
const SERVICES_URLS = path.join(TEMPLATES_DIR, '000-services-urls.yaml')

export async function updateServicesUrls (appName: string) {
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
