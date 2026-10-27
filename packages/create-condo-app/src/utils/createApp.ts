import { mkdirSync, existsSync } from 'fs'
import { writeFile, readFile } from 'fs/promises'
import { join } from 'path'

import { cyan, green, blue, yellowBright } from 'picocolors'

import { resolveLocalDependencies, resolveLocalSchema, replaceEnvToConf, replaceLocalCondoAddress } from '@/utils/condo'
import { getConfig } from '@/utils/config'
import { copyAppTemplate, copyAppDir } from '@/utils/copy'
import { getAvailableTemplates, resolveTemplatesDir } from '@/utils/fs'
import { tryGitInit } from '@/utils/git'
import { adjustScripts, install, exec, runScript } from '@/utils/packageManagers'

async function runTypeGen (knownScripts: Array<string>) {
    await exec('next', ['typegen'])
    if (knownScripts.includes('maketypes')) {
        await runScript('maketypes')
    }
}

function getExamplesByTemplate (templateName: string) {
    const templates = getAvailableTemplates({ showHidden: true })
    const examples: Array<string> = []
    let currentTemplate = templates.find(template => template.id === templateName)
    while (currentTemplate) {
        if (currentTemplate.examples?.length) {
            const newExamples = currentTemplate.examples.filter(e => !examples.includes(e))
            examples.push(...newExamples.toReversed())
        }

        const baseTemplateName = currentTemplate.extends
        currentTemplate = typeof baseTemplateName === 'string'
            ? templates.find(template => template.id === baseTemplateName)
            : undefined
    }

    return examples.toReversed()
}

async function setAppName () {
    const { projectPath, appName } = getConfig()
    const packageJsonPath = join(projectPath, 'package.json')
    if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'))
        packageJson.name = appName
        await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
    }
}

export async function initAppFromTemplate () {
    const { preferences, monorepoInfo, projectPath, appName, packageManager } = getConfig()

    console.log()
    console.log(`Creating new Condo app in ${green(projectPath)}`)
    console.log()

    mkdirSync(projectPath, { recursive: true })
    process.chdir(projectPath)

    const templateName = typeof preferences.template === 'string' ? preferences.template : 'base'
    console.log(`Copying ${cyan(templateName)} template. This might take a moment...`)
    console.log()
    await copyAppTemplate(templateName)
    await setAppName()

    if (preferences.examples) {
        const examples = getExamplesByTemplate(templateName)
        if (examples.length) {
            console.log(`Adding ${cyan('examples')} files...`)
            console.log()
            for (const example of examples) {
                await copyAppDir(join(resolveTemplatesDir(), 'examples', example))
            }
        }
    }
    if (monorepoInfo.isCondoRepo) {
        console.log(`Condo monorepo detected. Adding ${cyan('condo-specific')} files...`)
        console.log()
        await copyAppDir(join(resolveTemplatesDir(), 'examples', 'condo'))
        await resolveLocalDependencies()
        await replaceLocalCondoAddress()
        await resolveLocalSchema()
        await replaceEnvToConf()
    }

    const hasPackageJson = existsSync(join(projectPath, 'package.json'))

    let scripts: Array<string> = []

    if (hasPackageJson) {
        console.log(`Rewriting scripts to use ${blue(packageManager)}`)
        console.log()
        scripts = adjustScripts()

        console.log(`${blue('Installing packages.')} This might take a couple of minutes...`)
        console.log()
        await install()
    }

    console.log(`${blue('Generating types.')} This might take a moment...`)
    console.log()
    await runTypeGen(scripts)
    console.log()

    if (!preferences.git) {
        console.log(`${yellowBright('Skipping')} git initialization`)
        console.log()
    } else if (tryGitInit()) {
        console.log('Initialized a git repository')
        console.log()
    }

    console.log(`${green('Success!')} Created ${appName} at ${projectPath}`)
}