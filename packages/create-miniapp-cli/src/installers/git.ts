import { promises as fs } from 'fs'
import path from 'path'

import ora from 'ora'

import { AppType, APP_TYPES, CONDO_ROOT, ENVS_TYPE } from '../consts.js'
import { logger } from '../utils/logger.js'

const GITMODULES_PATH = path.resolve(CONDO_ROOT, './.gitmodules')
const WORKFLOWS_DIR = path.resolve(CONDO_ROOT, './.github/workflows')
const NODEJS_CONDO_CI_PATH = path.resolve(WORKFLOWS_DIR, './nodejs.condo.ci.yml')
const WERF_YAML_PATH = path.resolve(CONDO_ROOT, './werf.yaml')


const ENV_CONFIG = {
    prod: {
        workflowPath: path.resolve(WORKFLOWS_DIR, './deploy_production.yaml'),
        filename: 'deploy_production.yaml',
        domainSuffix: '.doma.ai',
        envVarPrefix: 'WERF_SET_CI_',
    },
    dev: {
        workflowPath: path.resolve(WORKFLOWS_DIR, './deploy_development.yaml'),
        filename: 'deploy_development.yaml',
        domainSuffix: '.d.doma.ai',
        envVarPrefix: 'WERF_SET_CI_',
    },
    review: {
        workflowPath: path.resolve(WORKFLOWS_DIR, './deploy_review.yaml'),
        filename: 'deploy_review.yaml',
        domainSuffix: '.r.doma.ai',
        envVarPrefix: 'WERF_SET_CI_',
    },
} as const

export async function addSubmoduleEntry (appName: string) {
    const spinner = ora('Adding submodule entry to .gitmodules...').start()
    const content = await fs.readFile(GITMODULES_PATH, 'utf8')
    const sectionHeader = `[submodule "apps/${appName}"]`
    if (content.split('\n').some((line) => line.trim() === sectionHeader)) {
        spinner.succeed(`Submodule apps/${appName} already exists in .gitmodules`)
        return
    }

    const submoduleEntry = `[submodule "apps/${appName}"]\n\tpath = apps/${appName}\n\turl = git@github.com:open-condo-software/condo-${appName}.git`
    const trimmedContent = content.trimEnd()
    const out = trimmedContent + (trimmedContent ? '\n' : '') + submoduleEntry + '\n'

    await fs.writeFile(GITMODULES_PATH, out, 'utf8')
    
    spinner.succeed('Adding submodule completed!')
}

export async function addDeployEnvVar (appName: string, env: ENVS_TYPE) {
    const spinner = ora('Adding deploy CI variables for ${env} environment to ./.github/workflows...').start()

    try {
        const config = ENV_CONFIG[env]
        const workflowPath = config.workflowPath
  
        const content = await fs.readFile(workflowPath, 'utf8')
        const underscoredAppName = appName.replace(/-/g, '_').toUpperCase()
        const envVarName = `${config.envVarPrefix}${underscoredAppName}_URL`
  
        if (content.includes(`${envVarName}:`)) {
            console.log(`Environment variable ${envVarName} already exists in ${config.filename}`)
            return workflowPath
        }

        let envVarValue: string
        const ciVarName = `ci_${appName.replace(/-/g, '_')}_url`
  
        if (env === 'review') {
            envVarValue = `"global.${ciVarName}=review-$\{{ env.REVIEW_URL_PREFIX }}-${appName}${config.domainSuffix}"`
        } else {
            envVarValue = `"global.${ciVarName}=${appName}${config.domainSuffix}"`
        }
  
        const newLine = `          ${envVarName}: ${envVarValue}`
  
        // Find the line with WERF_SET_CI_NAMESPACE
        const lines = content.split('\n')
        const namespaceLineIndex = lines.findIndex(line => line.includes('WERF_SET_CI_NAMESPACE:'))
  
        if (namespaceLineIndex === -1) {
            logger.error(`Github workflow for ${env} failed! You should add the CI variable manually`)
            return
        }
  
        // Insert the new line before the namespace line
        lines.splice(namespaceLineIndex, 0, newLine)
        const out = lines.join('\n')
        await fs.writeFile(workflowPath, out, 'utf8')
        spinner.succeed(`Adding deploy CI variables for ${env} environment completed!`)
    
    } catch (error) {
        spinner.fail(`Adding deploy CI variables for ${env} environment failed! You should add them manually! Error: ${error}`)
    }
}

function makeWerfShellSetupLines (appName: string, appType: AppType): string[] {
    const lines = ['  - "cd /app"']

    if (appType !== APP_TYPES.client) {
        lines.push(
            '  - "echo \'# Build time .env config!\' >> /app/.env"',
            '  - "echo \'COOKIE_SECRET=undefined\' >> /app/.env"',
            '  - "echo \'DATABASE_URL=undefined\' >> /app/.env"',
            '  - "echo \'REDIS_URL=undefined\' >> /app/.env"',
            '  - "echo \'NODE_ENV=production\' >> /app/.env"',
            '  - "echo \'FILE_FIELD_ADAPTER=local\' >> /app/.env"',
        )
    }

    if (appType !== APP_TYPES.server) {
        lines.push(`  - "yarn workspace @app/${appName} next telemetry disable"`)
    }

    lines.push(
        `  - "yarn workspace @app/${appName} build:deps"`,
        `  - "yarn workspace @app/${appName} build"`,
    )

    lines.push('  - "rm -rf /app/.env"')
    lines.push('  - "rm -rf /app/.config"')

    return lines
}

function getCurrentFromCacheVersion (content: string): string {
    const matches = Array.from(content.matchAll(/fromCacheVersion:\s*"([^"]+)"/g)).map((m) => m[1])
    if (!matches.length) {
        throw new Error('Unable to detect fromCacheVersion from werf.yaml')
    }

    const parsed = matches
        .map((value) => ({ raw: value, numeric: Number(value) }))
        .filter((entry) => Number.isFinite(entry.numeric))

    if (!parsed.length) {
        throw new Error('Unable to parse numeric fromCacheVersion from werf.yaml')
    }

    parsed.sort((a, b) => a.numeric - b.numeric)
    return parsed[parsed.length - 1].raw
}

function makeWerfImageBlock (appName: string, appType: AppType, fromCacheVersion: string): string {
    const appUnderscoreName = appName.replace(/-/g, '_')
    const shellSetup = makeWerfShellSetupLines(appName, appType).join('\n')

    return [
        '---',
        `image: ${appUnderscoreName}`,
        'fromImage: deps',
        `fromCacheVersion: "${fromCacheVersion}"`,
        'git:',
        '  - add: /',
        '    to: /app',
        '    stageDependencies:',
        '      install:',
        '        - "yarn.lock"',
        '        - "package.json"',
        '        - "**/yarn.lock"',
        '        - "**/package.json"',
        '      setup:',
        '        - "apps/**"',
        '        - "packages/**"',
        '        - "bin/**/*"',
        '    excludePaths:',
        '      - .github',
        '      - .helm',
        '      - werf.yaml',
        '      - werf-giterminism.yaml',
        '    owner: app',
        '    group: app',
        '',
        'shell:',
        '  setup:',
        shellSetup,
        '',
        'docker:',
        '  ENV:',
        '    LANG: C.UTF-8',
        '',
    ].join('\n')
}

export async function addWerfImage (appName: string, appType: AppType) {
    const spinner = ora('Adding app image block to werf.yaml...').start()

    try {
        const appUnderscoreName = appName.replace(/-/g, '_')
        const content = await fs.readFile(WERF_YAML_PATH, 'utf8')
        const imageHeaderLine = `image: ${appUnderscoreName}`
        if (content.split('\n').some((line) => line.trim() === imageHeaderLine)) {
            spinner.succeed(`werf.yaml already contains image block for ${appUnderscoreName}`)
            return
        }

        const fromCacheVersion = getCurrentFromCacheVersion(content)
        const block = makeWerfImageBlock(appName, appType, fromCacheVersion)
        const out = `${content.trimEnd()}\n\n${block}`
        await fs.writeFile(WERF_YAML_PATH, out, 'utf8')

        spinner.succeed('werf.yaml image block added successfully')
    } catch (error) {
        spinner.fail(`Failed to add image block to werf.yaml: ${error}`)
    }
}

function makeClientTestsJobBlock (appName: string): string {
    return [
        `  run-${appName}-tests:`,
        `    name: ${appName} Tests`,
        '    runs-on: ubuntu-22.04',
        '    needs:',
        '      - authorize',
        '      - detect-changes',
        `    if: \${{ needs.detect-changes.outputs.${appName} == 'true' }}`,
        '    steps:',
        '      - name: Checkout code with submodules',
        '        uses: actions/checkout@v4',
        '        with:',
        '          fetch-depth: 0',
        '          submodules: recursive',
        '          ssh-key: ${{ secrets.SSH_DOCK_SERVER_PRIVATE_KEY }}',
        '          ref: ${{ env.REF }}',
        '      - name: Install packages',
        '        run: |',
        '          npm i -g turbo',
        '          yarn install --immutable',
        `      - name: Run @app/${appName} tests`,
        `        run: yarn workspace @app/${appName} test`,
        '        env:',
        '          PROMETHEUS_RW_SERVER_URL: ${{ secrets.K6_PROMETHEUS_RW_SERVER_URL }}',
        '          PROMETHEUS_USER: ${{ secrets.K6_PROMETHEUS_USER }}',
        '          PROMETHEUS_PASSWORD: ${{ secrets.K6_PROMETHEUS_PASSWORD }}',
        '          GH_REF_NAME: ${{ github.event.pull_request.head.ref || github.ref_name }}',
    ].join('\n')
}

function makeServerLikeTestsJobBlock (appName: string): string {
    return [
        `  run-${appName}-tests:`,
        `    name: ${appName} Tests`,
        '    runs-on: ubuntu-22.04',
        '    needs:',
        '      - authorize',
        '      - build-image',
        '      - detect-changes',
        `    if: \${{ needs.detect-changes.outputs.${appName} == 'true' }}`,
        '    steps:',
        '      - name: Login to cloud registry',
        '        uses: docker/login-action@v3',
        '        with:',
        '          registry: ${{ secrets.DOCKER_REGISTRY }}',
        '          username: ${{ secrets.SBERCLOUD_CR_USERNAME }}',
        '          password: ${{ secrets.SBERCLOUD_CR_PASSWORD }}',
        '      - name: Setup PG db',
        '        run: |',
        '          docker run -e POSTGRES_USER=$POSTGRES_USER -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD -e POSTGRES_DB=$POSTGRES_DB -p="127.0.0.1:5432:5432" -d ${{ env.PG_IMAGE_FULL }}',
        '        env:',
        '          POSTGRES_USER: postgres',
        '          POSTGRES_PASSWORD: postgres',
        '          POSTGRES_DB: main',
        '      - name: Setup Redis db',
        '        run: |',
        '          ${{ env.REDIS_RUN_COMMAND }}',
        '      - name: Run condo container with daemon',
        '        run: |',
        '          docker run --network="host" --name condo-container -dit ${{ env.DOCKER_IMAGE_FULL }} sh',
        '      - name: Prepare apps',
        '        run: |',
        `          docker exec condo-container node bin/prepare.js -f ${appName}`,
        '      - name: Check migrations state',
        '        run: |',
        `          docker exec condo-container yarn workspace @app/${appName} makemigrations --check`,
        '      - name: Run apps and tests',
        '        run: |',
        '          docker exec \\',
        '          -e PROMETHEUS_RW_SERVER_URL=$PROMETHEUS_RW_SERVER_URL \\',
        '          -e PROMETHEUS_USER=$PROMETHEUS_USER \\',
        '          -e PROMETHEUS_PASSWORD=$PROMETHEUS_PASSWORD \\',
        '          -e GH_REF_NAME=$GH_REF_NAME \\',
        '          condo-container sh -c "(\\',
        `          yarn workspace @app/${appName} start & \\`,
        `          node bin/wait-apps-apis.js -f ${appName}) && \\`,
        `          yarn workspace @app/${appName} test"`,
        '        env:',
        '          PROMETHEUS_RW_SERVER_URL: ${{ secrets.K6_PROMETHEUS_RW_SERVER_URL }}',
        '          PROMETHEUS_USER: ${{ secrets.K6_PROMETHEUS_USER }}',
        '          PROMETHEUS_PASSWORD: ${{ secrets.K6_PROMETHEUS_PASSWORD }}',
        '          GH_REF_NAME: ${{ github.event.pull_request.head.ref || github.ref_name }}',
    ].join('\n')
}

export async function addNodeJsCondoCiTests (appName: string, appType: AppType) {
    const spinner = ora('Adding miniapp tests job to nodejs.condo.ci.yml...').start()

    try {
        const content = await fs.readFile(NODEJS_CONDO_CI_PATH, 'utf8')
        const lines = content.split('\n')
        const outputLine = `      ${appName}: \${{ steps.detect-changes.outputs.${appName} }}`
        const filterLines = [
            `            ${appName}:`,
            `              - 'apps/${appName}/**'`,
        ]
        const jobStartLine = `  run-${appName}-tests:`

        if (!lines.includes(outputLine)) {
            const residentOutputIdx = lines.findIndex((line) => line.trim() === 'resident-app: ${{ steps.detect-changes.outputs.resident-app }}')
            const detectChangesIdx = lines.findIndex((line) => line.trim() === 'detect-changes:')
            const detectStepsIdx = lines.findIndex((line, idx) => idx > detectChangesIdx && line.trim() === 'steps:')
            const insertIdx = residentOutputIdx !== -1 ? residentOutputIdx + 1 : detectStepsIdx

            if (insertIdx !== -1) {
                lines.splice(insertIdx, 0, outputLine)
            } else {
                spinner.fail('Failed to add detect-changes output: anchor was not found')
                return
            }
        }

        if (!lines.includes(filterLines[0])) {
            const webhooksIdx = lines.findIndex((line) => line.trim() === 'webhooks:')
            if (webhooksIdx === -1) {
                spinner.fail('Failed to add paths-filter rule: webhooks anchor was not found')
                return
            }

            let insertIdx = webhooksIdx + 1
            while (insertIdx < lines.length && lines[insertIdx].startsWith('              - ')) {
                insertIdx++
            }
            lines.splice(insertIdx, 0, ...filterLines)
        }

        if (!lines.includes(jobStartLine)) {
            const block = (appType === APP_TYPES.client)
                ? makeClientTestsJobBlock(appName)
                : makeServerLikeTestsJobBlock(appName)
            const webhooksJobIdx = lines.findIndex((line) => line.trim() === 'run-webhooks-tests:')
            const blockLines = ['', ...block.split('\n')]

            if (webhooksJobIdx !== -1) {
                lines.splice(webhooksJobIdx, 0, ...blockLines)
            } else {
                lines.push(...blockLines)
            }
        }

        await fs.writeFile(NODEJS_CONDO_CI_PATH, lines.join('\n'), 'utf8')
        spinner.succeed('Miniapp tests job was added to nodejs.condo.ci.yml')
    } catch (error) {
        spinner.fail(`Failed to add miniapp tests job to nodejs.condo.ci.yml: ${error}`)
    }
}
