import path from 'path'

import * as p from '@clack/prompts'
import { APP_TYPES, AppType, PKG_ROOT } from '@cli/consts.js'
import { InstallerOptions } from '@cli/installers/index.js'
import { logger } from '@cli/utils/logger.js'
import chalk from 'chalk'
import fs from 'fs-extra'
import ora from 'ora'
import { type PackageJson } from 'type-fest'


function getTemplateBaseDir (appType: AppType) {
    if (appType === APP_TYPES.client) {
        return path.join(PKG_ROOT, 'template/client')
    } else if (appType === APP_TYPES.server) {
        return path.join(PKG_ROOT, 'template/server')
    }

    return path.join(PKG_ROOT, 'template/fullstack')
}

type FullstackFeatureFlags = {
    OIDC: boolean
    STITCH: boolean
}

const CONDITIONAL_START_RE = /^\/\/\s*@if\s+([A-Z_]+)\s*$/
const CONDITIONAL_END_RE = /^\/\/\s*@endif\s*$/

function resolveFeatureFlag (token: string, flags: FullstackFeatureFlags): boolean {
    if (token.startsWith('NOT_')) {
        const nestedToken = token.slice(4)
        return !resolveFeatureFlag(nestedToken, flags)
    }

    if (token in flags) {
        return flags[token as keyof FullstackFeatureFlags]
    }

    throw new Error(`Unknown fullstack template feature flag: ${token}`)
}

function pruneConditionalBlocks (raw: string, flags: FullstackFeatureFlags) {
    const lines = raw.split('\n')
    const keepStack = [true]
    const output: string[] = []

    for (const line of lines) {
        const trimmed = line.trim()
        const startMatch = trimmed.match(CONDITIONAL_START_RE)

        if (startMatch) {
            const token = startMatch[1]
            const parentEnabled = keepStack[keepStack.length - 1]
            const currentEnabled = resolveFeatureFlag(token, flags)
            keepStack.push(parentEnabled && currentEnabled)
            continue
        }

        if (CONDITIONAL_END_RE.test(trimmed)) {
            if (keepStack.length === 1) {
                throw new Error('Unexpected "// @endif" in fullstack template')
            }
            keepStack.pop()
            continue
        }

        if (keepStack[keepStack.length - 1]) {
            output.push(line)
        }
    }

    if (keepStack.length !== 1) {
        throw new Error('Unclosed "// @if" block in fullstack template')
    }

    return output.join('\n')
}

function pruneTemplateFile (filePath: string, flags: FullstackFeatureFlags) {
    if (!fs.existsSync(filePath)) return

    const raw = fs.readFileSync(filePath, 'utf-8')
    const pruned = pruneConditionalBlocks(raw, flags)
    fs.writeFileSync(filePath, pruned)
}

function configureFullstackTemplate ({
    projectDir,
    hasOidc,
    hasSchemaStitching,
}: {
    projectDir: string
    hasOidc: boolean
    hasSchemaStitching: boolean
}) {
    const packageJsonPath = path.join(projectDir, 'package.json')
    const pkgJson = fs.readJSONSync(packageJsonPath) as PackageJson

    const featureFlags = {
        OIDC: hasOidc,
        STITCH: hasSchemaStitching,
    }

    pruneTemplateFile(path.join(projectDir, 'index.js'), featureFlags)
    pruneTemplateFile(path.join(projectDir, 'pages/_app.tsx'), featureFlags)
    pruneTemplateFile(path.join(projectDir, 'bin/prepare.js'), featureFlags)
    pruneTemplateFile(path.join(projectDir, 'next.config.ts'), featureFlags)

    if (!hasOidc) {
        fs.removeSync(path.join(projectDir, 'middlewares/oidc.js'))
        fs.removeSync(path.join(projectDir, 'domains/common/hooks/useLaunchParams.ts'))
        fs.removeSync(path.join(projectDir, 'domains/common/utils/oidcAuth.tsx'))

        if (pkgJson.dependencies) {
            delete pkgJson.dependencies['openid-client']
            delete pkgJson.dependencies['@open-condo/bridge']
        }
    }

    if (!hasSchemaStitching) {
        fs.removeSync(path.join(projectDir, 'bin/generate-condo-schema.js'))
        fs.removeSync(path.join(projectDir, 'domains/condo'))
        fs.removeSync(path.join(projectDir, 'condoSchema.graphql'))

        if (pkgJson.scripts) {
            delete pkgJson.scripts['maketypes:condo']
            pkgJson.scripts.maketypes = 'cross-env NODE_ENV=development yarn maketypes:local'
        }
    }

    fs.writeJSONSync(packageJsonPath, pkgJson, { spaces: 2 })
}

// This bootstraps the base application based on user's choice of AppType(server | client | full-stack)
export const scaffoldProject = async ({
    projectName,
    projectDir,
    pkgManager,
    noInstall,
    appType,
    hasWorker,
    hasOidc,
    hasSchemaStitching,
}: InstallerOptions) => {
    const srcDir = getTemplateBaseDir(appType)

    if (!noInstall) {
        logger.info(`\nUsing: ${chalk.cyan.bold(pkgManager)}\n`)
    }

    const spinner = ora(`Scaffolding in: ${projectDir}...\n`).start()

    if (fs.existsSync(projectDir)) {
        if (fs.readdirSync(projectDir).length === 0) {
            if (projectName !== '.')
                spinner.info(
                    `${chalk.cyan.bold(projectName)} exists but is empty, continuing...\n`,
                )
        } else {
            spinner.stopAndPersist()
            const overwriteDir = await p.select({
                message: `${chalk.redBright.bold('Warning:')} ${chalk.cyan.bold(
                    projectName,
                )} already exists and isn't empty. How would you like to proceed?`,
                options: [
                    {
                        label: 'Abort installation (recommended)',
                        value: 'abort',
                    },
                    {
                        label: 'Clear the directory and continue installation',
                        value: 'clear',
                    },
                    {
                        label: 'Continue installation and overwrite conflicting files',
                        value: 'overwrite',
                    },
                ],
                initialValue: 'abort',
            })

            if (p.isCancel(overwriteDir) || overwriteDir === 'abort') {
                spinner.fail('Aborting installation...')
                process.exit(1)
            }

            const confirmOverwriteDir = await p.confirm({
                message: `Are you sure you want to ${
                    overwriteDir === 'clear'
                        ? 'clear the directory'
                        : 'overwrite conflicting files'
                }?`,
                initialValue: false,
            })

            if (p.isCancel(confirmOverwriteDir) || !confirmOverwriteDir) {
                spinner.fail('Aborting installation...')
                process.exit(1)
            }

            if (overwriteDir === 'clear') {
                spinner.info(
                    `Emptying ${chalk.cyan.bold(projectName)} and creating miniapp..\n`,
                )
                fs.emptyDirSync(projectDir)
            }
        }
    }

    spinner.start()

    fs.copySync(srcDir, projectDir)
    const gitignorePath = path.join(projectDir, '_gitignore')
    if (fs.existsSync(gitignorePath)) {
        fs.renameSync(
            gitignorePath,
            path.join(projectDir, '.gitignore'),
        )
    }

    if (!hasWorker) {
        fs.removeSync(path.join(projectDir, 'worker.js'))

        const packageJsonPath = path.join(projectDir, 'package.json')
        const pkgJson = fs.readJSONSync(packageJsonPath) as PackageJson
        if (pkgJson.scripts && 'worker' in pkgJson.scripts) {
            delete pkgJson.scripts.worker
            fs.writeJSONSync(packageJsonPath, pkgJson, { spaces: 2 })
        }
    }

    if (appType === APP_TYPES['full-stack']) {
        configureFullstackTemplate({ projectDir, hasOidc, hasSchemaStitching })
    }

    const scaffoldedName = projectName === '.' ? 'App' : chalk.cyan.bold(projectName)

    spinner.succeed(
        `${scaffoldedName} ${chalk.green('scaffolded successfully!')}\n`,
    )
}
