#!/usr/bin/env node

const { execFileSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

// Lightweight, modern prompts like create-next-app
let prompts
try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    prompts = require('prompts')
} catch (e) {
    console.error('\n❌ Dependencies are not installed. Please install them first:')
    console.error('   yarn install\n')
    process.exit(1)
}

// Persisted state location (not committed into repo)
const STATE_DIR = path.join(os.homedir(), '.config', 'open-condo')
const STATE_FILE = path.join(STATE_DIR, 'prepare.json')

// Get all apps from .gitmodules file
function getAvailableApps () {
    const gitmodulesPath = path.join(__dirname, '..', '.gitmodules')

    try {
        const gitmodulesContent = fs.readFileSync(gitmodulesPath, 'utf8')
        const apps = []

        // Parse .gitmodules file to extract app paths
        const lines = gitmodulesContent.split('\n')
        let currentSubmodule = null

        for (const line of lines) {
            const trimmedLine = line.trim()

            // Check if this is a submodule section
            if (trimmedLine.startsWith('[submodule ')) {
                currentSubmodule = {}
            }

            // Extract path for apps/* submodules
            if (trimmedLine.startsWith('path = apps/') && currentSubmodule !== null) {
                const appPath = trimmedLine.replace('path = apps/', '')
                if (appPath && !appPath.includes('/')) { // Only direct apps, not nested paths
                    apps.push(appPath)
                }
                currentSubmodule = null
            }
        }

        // Check which apps have bin/prepare.js and return app objects with status
        return apps.map(appName => {
            // NOTE: controlled environment
            // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
            const preparePath = path.join(__dirname, '..', 'apps', appName, 'bin', 'prepare.js')
            const hasPrepareBin = fs.existsSync(preparePath)

            return {
                name: appName,
                available: hasPrepareBin,
                reason: hasPrepareBin ? null : 'Missing bin/prepare.js',
            }
        }).sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
        console.error('Error reading .gitmodules file:', error.message)
        console.log('Falling back to directory scanning...')

        // Fallback to directory scanning if .gitmodules is not available
        const appsDir = path.join(__dirname, '..', 'apps')
        const excludedDirs = ['node_modules', '.git', '.DS_Store', 'dist', 'build', 'coverage']

        try {
            const appNames = fs.readdirSync(appsDir, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name)
                .filter(name => !excludedDirs.includes(name) && !name.startsWith('.'))

            return appNames.map(appName => {
                // NOTE: controlled environment
                // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
                const preparePath = path.join(appsDir, appName, 'bin', 'prepare.js')
                const hasPrepareBin = fs.existsSync(preparePath)

                return {
                    name: appName,
                    available: hasPrepareBin,
                    reason: hasPrepareBin ? null : 'Missing bin/prepare.js',
                }
            }).sort((a, b) => a.name.localeCompare(b.name))
        } catch (fallbackError) {
            console.error('Error reading apps directory:', fallbackError.message)
            process.exit(1)
        }
    }
}

function loadState () {
    try {
        if (!fs.existsSync(STATE_FILE)) return null
        const raw = fs.readFileSync(STATE_FILE, 'utf8')
        return JSON.parse(raw)
    } catch (e) {
        return null
    }
}

function saveState (state) {
    try {
        fs.mkdirSync(STATE_DIR, { recursive: true })
        fs.writeFileSync(STATE_FILE, JSON.stringify({ ...state, savedAt: new Date().toISOString() }, null, 2))
    } catch (e) {
        // Non-fatal
    }
}

async function promptUser (apps) {
    const state = loadState() || {}
    const savedApps = Array.isArray(state.selectedApps) ? state.selectedApps : []
    const savedHttps = typeof state.https === 'boolean' ? state.https : true

    const availableChoices = apps.map(app => ({
        title: app.available ? app.name : `${app.name} (${app.reason})`,
        value: app.name,
        disabled: !app.available,
        selected: savedApps.includes(app.name),
    }))

    const onCancel = () => {
        console.log('\n❌ Cancelled')
        process.exit(0)
    }

    console.log('🚀 Interactive App Preparation')
    console.log('Follow the steps to configure your local environment\n')

    // Step 1: Choose apps
    const { apps: selectedApps } = await prompts({
        type: 'multiselect',
        name: 'apps',
        message: 'Select apps to prepare',
        choices: availableChoices,
        hint: 'Space to select. Enter to submit',
        instructions: false,
        min: 1,
    }, { onCancel })

    // Step 2: HTTPS or not
    const { https } = await prompts({
        type: 'toggle',
        name: 'https',
        message: 'Use HTTPS for local running?',
        initial: savedHttps,
        active: 'yes',
        inactive: 'no',
    }, { onCancel })

    // Persist for next run
    saveState({ selectedApps, https })

    // Final confirmation (optional)
    const commandPreview = `node bin/prepare.js ${https ? '--https ' : ''}-f ${selectedApps.join(' ')}`
    const { confirm } = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: `Run now?\n  ${commandPreview}`,
        initial: true,
    }, { onCancel })

    if (!confirm) {
        console.log('\n❌ Cancelled')
        process.exit(0)
    }

    return { selectedApps, https }
}

async function main () {
    const apps = getAvailableApps()

    if (apps.length === 0) {
        console.log('No apps found in the apps directory')
        process.exit(1)
    }

    const { selectedApps, https } = await promptUser(apps)

    if (selectedApps.length === 0) {
        console.log('No apps selected. Cancelled.')
        process.exit(0)
    }

    console.log(`\n🔧 Preparing apps: ${selectedApps.join(', ')}`)

    // Execute the prepare command
    const args = []
    if (https) args.push('--https')
    args.push('-f', ...selectedApps)
    const displayCmd = `node bin/prepare.js ${args.map(a => (/\s/.test(a) ? `"${a}"` : a)).join(' ')}`
    console.log(`Running: ${displayCmd}\n`)

    try {
        execFileSync('node', ['bin/prepare.js', ...args], { // NOSONAR
            stdio: 'inherit',
            cwd: path.join(__dirname, '..'),
            timeout: 15 * 60_000,
        })
        console.log('\n✅ Apps prepared successfully!')
    } catch (error) {
        console.error('\n❌ Error preparing apps:', error.message)
        process.exit(1)
    }
}

main().catch(error => {
    console.error('Unexpected error:', error)
    process.exit(1)
})

