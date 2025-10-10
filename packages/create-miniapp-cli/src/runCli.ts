import * as p from '@clack/prompts'
import { AvailablePackages } from '@cli/installers/index.js'
import { getUserPkgManager } from '@cli/utils/getUserPkgManager.js'
import { validateAppName } from '@cli/utils/validateAppName.js'
import { Command } from 'commander'

import { APP_TYPES, AppType, DEFAULT_APP_RESOURCES, DEFAULT_MAX_OLD_SPACE, TITLE_TEXT } from './consts.js'
import { askForResources, validateNumber } from './installers/helm/utils.js'
import { MaxOldSpace, ResourceSettings } from './installers/helm/values.js'
import { isAppType } from './utils/isAppType.js'
import { validateImportAlias } from './utils/validateImportAlias.js'

interface CliFlags {
    noInstall: boolean
    default: boolean
    importAlias: string
    appType: AppType
    eslint: boolean
    hasReview: boolean
    hasWorker: boolean
    appResources: ResourceSettings
    maxOldSpace: MaxOldSpace
    workerResources?: ResourceSettings
}

interface CliResults {
    appName: string
    flags: CliFlags
    packages?: AvailablePackages[]
}

const defaultOptions: CliResults = {
    appName: 'condo-miniapp',
    flags: {
        noInstall: false,
        default: false,
        importAlias: '~/',
        eslint: false,
        appType: APP_TYPES.server,
        hasReview: false,
        hasWorker: false,
        appResources: DEFAULT_APP_RESOURCES,
        maxOldSpace: DEFAULT_MAX_OLD_SPACE,
    },
}

export const runCli = async (): Promise<CliResults> => {
    const cliResults = defaultOptions

    const program = new Command()
        .name(TITLE_TEXT)
        .description('A CLI for creating web applications compatible with Condo')
        .argument('[dir]', 'The name of the application, as well as the name of the directory to create')
        .option(
            '--noInstall',
            'Explicitly tell the CLI to not run the package manager\'s install command',
            false,
        )
        .option(
            '-i, --import-alias',
            'Explicitly tell the CLI to use a custom import alias',
            defaultOptions.flags.importAlias,
        )
        .parse(process.argv)

    const cliProvidedName = program.args[0]
    if (cliProvidedName) {
        cliResults.appName = cliProvidedName
    }

    cliResults.flags = program.opts()

    if (cliResults.flags.default) {
        return cliResults
    }

    const pkgManager = getUserPkgManager()

    const project = await p.group(
        {
            ...(!cliProvidedName && {
                name: () =>
                    p.text({
                        message: 'What will your project be called?',
                        defaultValue: cliProvidedName,
                        validate: validateAppName,
                    }),
            }),
            appType: () => {
                return p.select({
                    message: 'What kind of app do you need?',
                    options: [
                        { value: 'server', label: 'Server-side' },
                        { value: 'client', label: 'Client-side' },
                        { value: 'full-stack', label: 'Both client and server' },
                    ],
                    initialValue: 'server',
                })
            },
            ...(!cliResults.flags.noInstall && {
                install: () => {
                    return p.confirm({
                        message:
              `Should we run '${pkgManager}` +
              (pkgManager === 'yarn' ? '\'?' : ' install\' for you?'),
                        initialValue: !defaultOptions.flags.noInstall,
                    })
                },
            }),
            importAlias: ({ results }) => {
                return p.text({
                    message: 'What import alias would you like to use?',
                    defaultValue: (results.name ? `@${results.name}` : `@${cliProvidedName}`) || defaultOptions.flags.importAlias,
                    placeholder: (results.name ? `@${results.name}` : `@${cliProvidedName}`) || defaultOptions.flags.importAlias,
                    validate: validateImportAlias,
                })
            },
            hasReview: () => {
                return p.confirm({
                    message: 'We will setup helm templates for the new miniapp. Would you also like to have a review namespace?',
                    initialValue: defaultOptions.flags.hasReview,
                })
            },
            hasWorker: () => {
                return p.confirm({
                    message: 'Will you need a worker?',
                    initialValue: defaultOptions.flags.hasWorker,
                })
            },
            appResources: ({ results }) => askForResources({
                label: 'app',
                wantReview: Boolean(results.hasReview),
                defaults: DEFAULT_APP_RESOURCES,
            }),

            workerResources: async ({ results }) => {
                if (!results.hasWorker) return undefined
                return askForResources({
                    label: 'worker',
                    wantReview: Boolean(results.hasReview),
                    defaults: DEFAULT_APP_RESOURCES,
                })
            },

            maxOldSpace: async ({ results }) => {
                const wantReview = results.hasReview
                const envCount = wantReview ? 4 : 3
                const envLabels = wantReview
                    ? 'default,review,development,production'
                    : 'default,development,production'

                const defaultValue =  wantReview
                    ? `${DEFAULT_MAX_OLD_SPACE.default},${DEFAULT_MAX_OLD_SPACE.default},${DEFAULT_MAX_OLD_SPACE.development},${DEFAULT_MAX_OLD_SPACE.production}`
                    : `${DEFAULT_MAX_OLD_SPACE.default},${DEFAULT_MAX_OLD_SPACE.development},${DEFAULT_MAX_OLD_SPACE.production}`

                const input = await p.text({
                    message: `Enter max_old_space_size (${envLabels}) or hit Enter to accept default values:`,
                    defaultValue,
                    placeholder: defaultValue,
                    validate: (v) => {
                        if (v){
                            const parts = v.split(',').map((s) => s.trim())
                            if (parts.length !== envCount)
                                return `Please provide ${envCount} comma-separated numbers`
                            for (const pVal of parts) {
                                const res = validateNumber(pVal)
                                if (res !== true) return res
                            }
                        }
                        return
                    },
                }) as string

                const parts = input.split(',').map((s) => Number(s.trim()))
                const base: Record<'default' | 'review' | 'development' | 'production', number | undefined> = {
                    default: parts[0],
                    review: undefined,
                    development: undefined,
                    production: undefined,
                }
                let i = 1
                if (wantReview) base['review'] = parts[i++]
                base['development'] = parts[i]
                base['production'] = parts[i + 1]
                return base as MaxOldSpace
            },
        },
        {
            onCancel () {
                process.exit(1)
            },
        },
    )

    const packages: AvailablePackages[] = []
    if (!isAppType(project.appType)) {
        throw new Error(`Invalid app type: ${project.appType}`)
    }

    return {
        appName: project.name ?? cliResults.appName,
        packages,
        flags: {
            ...cliResults.flags,
            noInstall: !project.install || cliResults.flags.noInstall,
            importAlias: project.importAlias as string ?? cliResults.flags.importAlias,
            appType: project.appType ?? cliResults.flags.appType,
            hasReview: project.hasReview ?? cliResults.flags.hasReview,
            hasWorker: project.hasWorker ?? cliResults.flags.hasWorker,
            appResources: project.appResources as ResourceSettings ?? cliResults.flags.appResources,
            workerResources: project.workerResources as ResourceSettings ?? cliResults.flags.workerResources,
            maxOldSpace: project.maxOldSpace as MaxOldSpace ?? cliResults.flags.maxOldSpace,
        },
    }
}
