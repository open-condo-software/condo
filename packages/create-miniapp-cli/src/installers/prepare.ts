import path from 'path'
import { fileURLToPath } from 'url'

import { type PackageManager } from '@cli/utils/getUserPkgManager.js'
import { logger } from '@cli/utils/logger'
import { execa } from 'execa'
import ora from 'ora'

interface PrepareAppProps {
    pkgManager: PackageManager
    appName: string
    projectDir: string
}

interface ScriptConfig {
    name: string
    command: string
    args: string[]
    successMessage: string
    errorMessage: string
    cwd?: string
    ignoreFailure?: boolean
    showSubprocessLogs?: boolean
    allowInput?: boolean
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CONDO_ROOT_PATH = path.resolve(__dirname, '../../../')

const runScript = async ({
    command,
    args,
    cwd,
    successMessage,
    errorMessage,
    ignoreFailure = false,
    showSubprocessLogs = false,
    allowInput = false,
}: ScriptConfig) => {
    // If script needs user input or full logs — don’t show spinner
    const spinner = allowInput
        ? null
        : ora(`Running ${command} ${args.join(' ')} ...`).start()

    try {
        const stdio = showSubprocessLogs || allowInput ? 'inherit' : 'pipe'

        // 👇 Increase buffer size so logs aren’t truncated
        await execa(command, args, {
            cwd,
            stdio,
            maxBuffer: Infinity,
        })

        if (spinner) spinner.succeed(successMessage)
        else logger.success(successMessage)

        return true
    } catch (err: any) {
        if (spinner) spinner.fail(errorMessage)
        else logger.error(errorMessage)

        // Show captured logs only if subprocess logs were hidden
        if (!showSubprocessLogs && !allowInput) {
            if (err.stdout) logger.error(`\n[stdout]\n${err.stdout}`)
            if (err.stderr) logger.error(`\n[stderr]\n${err.stderr}`)
        }

        logger.error(`\n[error]\n${err.message}`)

        if (!ignoreFailure) throw err
        return false
    }
}

const handleFailureWithMigrator = async (
    failedScript: ScriptConfig,
    fallbackScript: ScriptConfig,
) => {
    await runScript(fallbackScript)
    await runScript(failedScript)
}

export const prepareApp = async ({ pkgManager, appName, projectDir }: PrepareAppProps) => {
    const SCRIPTS = {
        BUILD_PACKAGES: {
            name: 'build-packages',
            command: pkgManager,
            args: ['build:packages'],
            successMessage: `${pkgManager} build:packages script finished successfully!`,
            errorMessage: `${pkgManager} build:packages script failed:`,
            ignoreFailure: true,
            cwd: CONDO_ROOT_PATH,
        },
        GLOBAL_PREPARE: {
            name: 'global-prepare',
            command: 'node',
            args: ['./bin/prepare.js', '--https', '-f', appName],
            successMessage: 'Successfully finished global prepare.js script!',
            errorMessage: 'Global prepare.js script failed, but it is okay on the first run:',
            ignoreFailure: true,
            cwd: CONDO_ROOT_PATH,
        },
        BUILD_DEPS: {
            name: 'build-deps',
            command: pkgManager,
            args: ['build:deps'],
            cwd: projectDir,
            successMessage: `${pkgManager} build:deps script finished successfully!`,
            errorMessage: `${pkgManager} build:deps script failed:`,
        },
        MAKE_MIGRATIONS: {
            name: 'make-migrations',
            command: pkgManager,
            args: ['makemigrations'],
            cwd: projectDir,
            successMessage: `${pkgManager} makemigrations script finished successfully!`,
            errorMessage: `${pkgManager} makemigrations script failed:`,
        },
        LOCAL_PREPARE: {
            name: 'local-prepare',
            command: 'node',
            args: ['./bin/prepare.js'],
            cwd: projectDir,
            successMessage: 'Successfully finished local prepare.js script!',
            errorMessage: 'Local prepare.js script failed:',
            ignoreFailure: true,
        },
        MAKE_TYPES: {
            name: 'make-types',
            command: pkgManager,
            args: ['maketypes'],
            cwd: projectDir,
            successMessage: `${pkgManager} maketypes script finished successfully!`,
            errorMessage: `${pkgManager} maketypes script failed:`,
            ignoreFailure: true,
        },
        BUILD: {
            name: 'build',
            command: pkgManager,
            args: ['build'],
            cwd: projectDir,
            successMessage: `${pkgManager} build script finished successfully!`,
            errorMessage: `${pkgManager} build script failed:`,
        },
        FALLBACK_MIGRATOR: {
            name: 'fallback-migrator',
            command: 'npx',
            args: ['@open-condo/migrator', 'add-apps-kv-prefixes'],
            cwd: projectDir,
            successMessage: 'Ran migrator successfully after prepare failure!',
            errorMessage: 'Migrator failed to run after prepare failure:',
            showSubprocessLogs: true,
            allowInput: true,
        },
    } satisfies Record<string, ScriptConfig>

    const scriptOrder = [
        SCRIPTS.BUILD_PACKAGES,
        SCRIPTS.GLOBAL_PREPARE, // base env vars
        SCRIPTS.MAKE_MIGRATIONS,
        SCRIPTS.GLOBAL_PREPARE, // migrate and run local prepare
        SCRIPTS.MAKE_TYPES,
    ]

    const retryableScripts = [
        SCRIPTS.GLOBAL_PREPARE.name,
        SCRIPTS.MAKE_TYPES.name,
    ]

    for (const script of scriptOrder) {
        const success = await runScript(script)

        if (retryableScripts.includes(script.name) && !success) {
            await handleFailureWithMigrator(script, SCRIPTS.FALLBACK_MIGRATOR)
        }
    }
}