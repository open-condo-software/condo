import * as p from '@clack/prompts'
import { AvailablePackages } from '@cli/installers/index.js'
import { getUserPkgManager } from '@cli/utils/getUserPkgManager.js'
import { validateAppName } from '@cli/utils/validateAppName.js'
import { Command } from 'commander'

import { APP_TYPES, AppType, TITLE_TEXT } from './consts.js'
import { isAppType } from './utils/isAppType.js'
import { validateImportAlias } from './utils/validateImportAlias.js'

interface CliFlags {
    noInstall: boolean
    default: boolean
    importAlias: string
    appType: AppType
    eslint: boolean
    wantReview: boolean
    appUrl?: string
}

interface CliResults {
    appName: string
    flags: CliFlags
    packages?: AvailablePackages[]
}

const defaultOptions: CliResults = {
    appName: 'Condo-miniapp',
    flags: {
        noInstall: false,
        default: false,
        importAlias: '~/',
        eslint: false,
        appType: APP_TYPES.server,
        wantReview: false,
    },
}

export const runCli = async (): Promise<CliResults> => {
    const cliResults = defaultOptions

    const program = new Command()
        .name(TITLE_TEXT)
        .description('A CLI for creating web applications compatible with Condo')
        .argument(
            '[dir]',
            'The name of the application, as well as the name of the directory to create',
        )
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
            wantReview: () => {
                return p.confirm({
                    message: 'We will setup helm templates for the new miniapp. Would you also like to have a review namespace?',
                    initialValue: defaultOptions.flags.wantReview,
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
            importAlias: () => {
                return p.text({
                    message: 'What import alias would you like to use?',
                    defaultValue: defaultOptions.flags.importAlias,
                    placeholder: defaultOptions.flags.importAlias,
                    validate: validateImportAlias,
                })
            },
        },
        {
            onCancel () {
                process.exit(1)
            },
        },
    )

    const packages: AvailablePackages[] = []
    // if (project.linter) packages.push('eslint')
    if (!isAppType(project.appType)) {
        throw new Error(`Invalid app type: ${project.appType}`)
    }

    return {
        appName: project.name ?? cliResults.appName,
        packages,
        flags: {
            ...cliResults.flags,
            noInstall: !project.install || cliResults.flags.noInstall,
            importAlias: project.importAlias ?? cliResults.flags.importAlias,
            appType: project.appType ?? cliResults.flags.appType,
            wantReview: project.wantReview ?? cliResults.flags.wantReview,
        },
    }
}
