import { Command } from 'commander'
import Conf from 'conf'
import { cyan, red, green, bold, blue } from 'picocolors'
import prompts from 'prompts'

import packageJson from '../package.json'

import type { InitialReturnValue } from 'prompts'

import { setConfig } from '@/utils/config'
import { getAvailableTemplates, resolvePackagePath } from '@/utils/fs'
import { validateNpmName } from '@/utils/npm'
import { isValidPreferences } from '@/utils/objects'
import { getPackageManager } from '@/utils/packageManagers'

function onTermination () {
    process.exit(0)
}

process.on('SIGINT', onTermination)
process.on('SIGTERM', onTermination)

const onPromptState = (state: {
    value: InitialReturnValue
    aborted: boolean
    exited: boolean
}) => {
    if (state.aborted) {
        // If we don't re-enable the terminal cursor before exiting
        // the program, the cursor will remain hidden
        process.stdout.write('\x1B[?25h')
        process.stdout.write('\n')
        process.exit(1)
    }
}

const onCancel = () => {
    console.error('Exiting.')
    process.exit(1)
}

let projectPath: string | undefined

const program = new Command(packageJson.name)
    .version(
        packageJson.version,
        '-v, --version',
        'output the current version of create-condo-app'
    )
    .argument('[directory]')
    .usage('[directory] [options]')
    .helpOption('-h, --help', 'Display this help message')
    .option('--empty', 'Remove "getting started" usage examples from generated app')
    .option('--reset', 'Reset user preferences saved to create-condo-app')
    .option('--use-npm', 'Explicitly tell the CLI to bootstrap the application using npm')
    .option('--use-yarn', 'Explicitly tell the CLI to bootstrap the application using yarn')
    .option('--use-pnpm', 'Explicitly tell the CLI to bootstrap the application using yarn')
    .option('--agents-md', 'Include AGENTS.md to guide coding agents to write up-to-date Next.js code. (default)')
    .action((name) => {
        // Commander does not implicitly support negated options. When they are used
        // by the user they will be interpreted as the positional argument (name) in
        // the action handler. See https://github.com/tj/commander.js/pull/1355
        if (name && !name.startsWith('--no-')) {
            projectPath = name
        }
    })
    .allowUnknownOption()


async function run () {
    const conf = new Conf({ projectName: 'create-condo-app' })

    const parsedCommand = program.parse(process.argv)
    const opts = parsedCommand.opts()
    // const { args } = parsedCommand

    // STEP 0: Handle reset preferences
    if (opts.reset) {
        const { resetPreferences } = await prompts({
            onState: onPromptState,
            type: 'toggle',
            name: 'resetPreferences',
            message: 'Would you like to reset the saved preferences?',
            initial: false,
            active: 'Yes',
            inactive: 'No',
        })
        if (resetPreferences) {
            conf.clear()
            console.log('The preferences have been reset successfully!')
        }
        process.exit(0)
    }

    // STEP 1: Resolve app name and project path
    if (typeof projectPath === 'string') {
        projectPath = projectPath.trim()
    }

    if (!projectPath) {
        const res = await prompts({
            onState: onPromptState,
            type: 'text',
            name: 'path',
            message: 'What is your project named?',
            initial: 'my-app',
        })

        if (typeof res.path === 'string') {
            projectPath = res.path.trim()
        }
    }

    if (!projectPath) {
        console.log(
            '\nPlease specify the project directory:\n' +
            `  ${cyan(opts.name())} ${green('<project-directory>')}\n` +
            'For example:\n' +
            `  ${cyan(opts.name())} ${green('my-condo-app')}\n\n` +
            `Run ${cyan(`${opts.name()} --help`)} to see all options.`
        )
        process.exit(1)
    }

    // Extract package name and resolve absolute path, omitting scope from folder name
    const { packageName, absolutePath } = resolvePackagePath(projectPath)
    const nameValidationResult = validateNpmName(packageName)

    if (!nameValidationResult.valid) {
        console.error(
            `Could not create a project called ${red(
                `"${packageName}"`
            )} because of npm naming restrictions:`
        )

        nameValidationResult.problems.forEach((p) =>
            console.error(`    ${red(bold('*'))} ${p}`)
        )
        process.exit(1)
    }

    // Save both app name and project path for utils to reuse
    setConfig({ appName: packageName, projectPath: absolutePath })

    // STEP 2: Resolve package manager
    const packageManager =
        opts.useNpm ? 'npm' :
            opts.useYarn ? 'yarn' :
                opts.usePnpm ? 'pnpm' :
                    getPackageManager()
    setConfig({ packageManager })

    // STEP 3: Resolve choices
    const initialPreferences = (conf.get('preferences') || {})
    const preferences = isValidPreferences(initialPreferences) ? initialPreferences : {}
    const availableTemplates = getAvailableTemplates()

    if (availableTemplates.length > 1) {
        const { selectedTemplate } = await prompts({
            onState: onPromptState,
            type: 'select',
            name: 'selectedTemplate',
            message: 'Which template would you like to use?',
            initial: preferences.template,
            choices: availableTemplates.map(t => ({
                title: t.name,
                value: t.id,
                description: t.description,
            })),
        }, { onCancel })

        preferences.template = selectedTemplate
    } else {
        preferences.template = availableTemplates[0].id
    }

    if (typeof opts.empty === 'boolean') {
        preferences.examples = !opts.empty
    } else {
        const { examples } = await prompts({
            type: 'toggle',
            name: 'examples',
            message: `Would you like to add ${blue('examples')}?`,
            initial: preferences.examples ?? true,
            active: 'Yes',
            inactive: 'No',
        }, { onCancel })
        preferences.examples = examples
    }

    if (typeof opts.agentsMd === 'boolean') {
        preferences.agentsMd = opts.agentsMd
    } else {
        const { agentsMd } = await prompts({
            type: 'toggle',
            name: 'agentsMd',
            message: `Would you like to include ${blue('AGENTS.md')} to guide coding agents to write relevant code?`,
            initial: preferences.agentsMd ?? true,
            active: 'Yes',
            inactive: 'No',
        }, { onCancel })
        preferences.agentsMd = agentsMd
    }

    conf.set('preferences', preferences)
    setConfig({ preferences })

    // STEP 4: App creation
    // TODO: do me
}

async function exit (reason: { command?: string }) {
    console.log()
    console.log('Aborting installation.')
    if (reason.command) {
        console.log(`  ${cyan(reason.command)} has failed.`)
    } else {
        console.log(
            red('Unexpected error. Please report it as a bug:') + '\n',
            reason
        )
    }
    console.log()
    // TODO: ADD THIS
    // await notifyUpdate()
    process.exit(1)
}

run().catch(exit)
