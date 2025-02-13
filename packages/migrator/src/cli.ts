#!/usr/bin/env node

import { Command } from 'commander'

import pkg from '../package.json'

import { addAppsKVPrefixes } from '@/commands'
import { YES_OPTION, FILTER_OPTION } from '@/utils/options'

const program = new Command()

program
    .name(pkg.name)
    .description(pkg.description)
    .version(pkg.version)

program
    .command('add-apps-kv-prefixes')
    .description([
        'Adds application prefixes to KV database keys. ',
        'You can provide connection string by REDIS_URL env when migration single app, or by .env files when migrating multiple apps locally.',
        '',
        'For example, the app keys “@app/example-keystone” would look like this:',
        '"some_key" -> "example_keystone:some_key"',
        '"bull:queue_name:something" -> "{example_keystone:bull:queue_name}:something"',
        '',
        'Example #1 (remote server migration):',
        'REDIS_URL=redis://127.0.0.1:6379/6 npx @open-condo/migrator add-kv-prefixes',
        '',
        'Example #2 (local monorepo migration):',
        'condo-migrator add-kv-prefixes',
    ].join('\n'))
    .option(...YES_OPTION)
    .option(...FILTER_OPTION)
    .action(addAppsKVPrefixes)


program.parse(process.argv)