import { type PackageManager } from '@cli/utils/getUserPkgManager.js'
import { logger } from '@cli/utils/logger'
import { execa } from 'execa'

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
}


const runScript = async ({
    command,
    args,
    cwd,
    successMessage,
    errorMessage,
    ignoreFailure = false,
}: {
    command: string
    args: string[]
    cwd?: string
    successMessage: string
    errorMessage: string
    ignoreFailure?: boolean
}) => {
    try {
        await execa(command, args, { cwd, stdio: 'inherit' })
        logger.success(successMessage)
        return true
    } catch (err: any) {
        logger.error(errorMessage, err.message)
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
        GLOBAL_PREPARE: {
            name: 'global-prepare',
            command: 'node',
            args: ['../../bin/prepare.js', '--https', '-f', appName],
            successMessage: 'Successfully finished global prepare.js script!',
            errorMessage: 'Global prepare.js script failed, but it is okay on the first run:',
            ignoreFailure: true,
        },
        LOCAL_PREPARE: {
            name: 'local-prepare',
            command: 'node',
            args: ['./bin/prepare.js'],
            cwd: projectDir,
            successMessage: 'Successfully finished local prepare.js script!',
            errorMessage: 'Local prepare.js script failed:',
        },
        MAKE_MIGRATIONS: {
            name: 'make-migrations',
            command: pkgManager,
            args: ['makemigrations'],
            cwd: projectDir,
            successMessage: `${pkgManager} makemigrations script finished successfully!`,
            errorMessage: `${pkgManager} makemigrations script failed:`,
        },
        MAKE_TYPES: {
            name: 'make-types',
            command: pkgManager,
            args: ['maketypes'],
            cwd: projectDir,
            successMessage: `${pkgManager} maketypes script finished successfully!`,
            errorMessage: `${pkgManager} maketypes script failed:`,
        },
        BUILD_DEPS: {
            name: 'build-deps',
            command: pkgManager,
            args: ['build:deps'],
            cwd: projectDir,
            successMessage: `${pkgManager} build:deps script finished successfully!`,
            errorMessage: `${pkgManager} build:deps script failed:`,
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
            successMessage: 'Ran migrator successfully after build failure!',
            errorMessage: 'Migrator failed to run after build failure:',
        },
    } satisfies Record<string, ScriptConfig>


    const scriptKeys = Object.keys(SCRIPTS) as (keyof typeof SCRIPTS)[]

    for (const key of scriptKeys) {
        const script = SCRIPTS[key]

        // Skip running the fallback migrator in normal flow
        if (script.name === 'fallback-migrator') continue

        const success = await runScript(script)

        const retryableScripts = [
            SCRIPTS.BUILD_DEPS.name,
            SCRIPTS.BUILD.name,
            SCRIPTS.MAKE_TYPES.name,
        ]

        if (retryableScripts.includes(script.name) && !success) {
            await handleFailureWithMigrator(script, SCRIPTS.FALLBACK_MIGRATOR)
        }
    }
}