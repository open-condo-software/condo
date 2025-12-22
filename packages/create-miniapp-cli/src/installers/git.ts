import { promises as fs } from 'fs'
import path from 'path'

import { CONDO_ROOT } from '@cli/consts'

const GITMODULES_PATH = path.resolve(CONDO_ROOT, './.gitmodules')

export async function addSubmoduleEntry (appName: string) {
    const content = await fs.readFile(GITMODULES_PATH, 'utf8')
    const submoduleEntry = `[submodule "apps/${appName}"]\n\tpath = apps/${appName}\n\turl = git@github.com:open-condo-software/condo-${appName}.git`
    const trimmedContent = content.trimEnd()
    const out = trimmedContent + (trimmedContent ? '\n' : '') + submoduleEntry + '\n'
    
    await fs.writeFile(GITMODULES_PATH, out, 'utf8')
    
    return GITMODULES_PATH
}