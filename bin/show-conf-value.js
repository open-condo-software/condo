const { program } = require('commander')

const conf = require('@open-condo/config')

program
    .argument('<name>', 'Configuration key to retrieve')
    .description('Retrieve a configuration value by key from @open-condo/config')

async function main () {
    const { args } = program.parse()
    const name = args[0]
    console.log(conf[name] || '')
}

main().catch(e => {
    console.error('Error:', e.message)
    process.exit(1)
})
