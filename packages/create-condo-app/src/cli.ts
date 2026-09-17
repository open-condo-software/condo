import { Command } from 'commander'

import packageJson from './package.json'

function onTermination () {
    process.exit(0)
}

process.on('SIGINT', onTermination)
process.on('SIGTERM', onTermination)

const program = new Command(packageJson.name)
    .version(
        packageJson.version,
        '-v, --version',
        'output the current version of create-condo-app'
    )
    .argument('[directory]')
    .usage('[directory] [options]')
    .helpOption('-h, --help', 'Display this help message')
    .option('--empty', 'Remove "getting started" usage examples from generated app', false)
    .option('--reset', 'Reset user preferences saved to create-condo-app')
    .option('--use-npm', 'Explicitly tell the CLI to bootstrap the application using npm')
    .option('--use-yarn', 'Explicitly tell the CLI to bootstrap the application using yarn')
    .option('--use-pnpm', 'Explicitly tell the CLI to bootstrap the application using yarn')
    .option('--agents-md', 'Include AGENTS.md to guide coding agents to write up-to-date Next.js code. (default)', true)

async function run () {
    // const
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
    await notifyUpdate()
    process.exit(1)
}
