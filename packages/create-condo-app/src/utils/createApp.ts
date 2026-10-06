import { mkdirSync } from 'fs'
import path from 'path'

import { cyan, green, blue } from 'picocolors'

import { getConfig } from '@/utils/config'
import { copyAppTemplate, copyAppDir } from '@/utils/copy'
import { resolveTemplatesDir } from '@/utils/fs'
import { install } from '@/utils/packageManagers'

export async function initAppFromTemplate () {
    const { preferences, monorepoInfo, projectPath, appName } = getConfig()

    console.log()
    console.log(`Creating new Condo app in ${green(projectPath)}`)
    console.log()

    mkdirSync(projectPath, { recursive: true })
    process.chdir(projectPath)

    const templateName = typeof preferences.template === 'string' ? preferences.template : 'base'
    console.log(`Copying ${cyan(templateName)} template. This might take a moment...`)
    console.log()
    await copyAppTemplate(templateName)
    if (preferences.examples) {
        console.log(`Adding ${cyan('examples')} files...`)
        console.log()
        await copyAppDir(path.join(resolveTemplatesDir(), 'examples', 'basic'))
    }
    if (monorepoInfo.isCondoRepo) {
        console.log(`Condo monorepo detected. Adding ${cyan('condo-specific')} files...`)
        console.log()
        await copyAppDir(path.join(resolveTemplatesDir(), 'examples', 'condo'))
        // TODO: replace env to conf here
        // TODO: resolve local dependencies
        // TODO: change codegen / envs to local
    }

    console.log(`${blue('Installing packages.')} This might take a couple of minutes...`)
    console.log()
    await install()

    // TODO: git init
    //

    console.log(`${green('Success!')} Created ${appName} at ${projectPath}`)
}