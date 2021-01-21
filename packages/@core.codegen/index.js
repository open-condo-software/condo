const chalk = require('chalk')
const boxen = require('boxen')
const yargs = require('yargs/yargs')
const fs = require('fs')
const path = require('path')
const ncp = require('ncp')
const { promisify } = require('util')
const nunjucks = require('nunjucks')
const { Readable } = require('stream')
const conf = require('@core/config')

const DEFAULT_PROJECT_TEMPLATE = 'app00'
const access = promisify(fs.access)
const copy = promisify(ncp)

nunjucks.configure({ autoescape: false })

async function streamToString (stream) {
    const chunks = []
    return new Promise((resolve, reject) => {
        stream.on('data', chunk => chunks.push(chunk))
        stream.on('error', reject)
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    })
}

async function renderTemplates (templateDirectory, targetDirectory, templateContext) {
    return copy(templateDirectory, targetDirectory, {
        transform: async (readStream, writeStream, file) => {
            if (['.jsx', '.js', '.json', '.ts', '.tsx', '.md'].some((x) => file.name.endsWith(x))) {
                const tpl = await streamToString(readStream)
                let result = tpl
                try {
                    result = nunjucks.renderString(tpl, { ...templateContext, file: file.name })
                } catch (e) {
                    console.error('%s Render (%s) problem:', chalk.yellow.bold('WARN'), file.name, e)
                }

                const readable = Readable.from([result])
                readable.pipe(writeStream)
            } else {
                readStream.pipe(writeStream)
            }
        },
        clobber: true,
    })
}

async function generate (template, ctx) {
    const targetDirectory = path.resolve(process.cwd(), `./apps/${ctx.name}`)
    const templateDirectory = path.resolve(path.dirname(__filename), 'templates', template.toLowerCase())
    const readmeFile = path.join(targetDirectory, 'README.md')

    try {
        await access(templateDirectory, fs.constants.R_OK)
    } catch (err) {
        console.error('%s Invalid template name', chalk.red.bold('ERROR'))
        process.exit(1)
    }

    await renderTemplates(templateDirectory, targetDirectory, ctx)

    console.log('%s Project ready', chalk.green.bold('DONE'))
    if (fs.existsSync(readmeFile)) {
        console.log('%s cat ' + readmeFile, chalk.blue.bold('The next step is:'))
    }

    return true
}

function createapp (argv) {
    const args = yargs(argv)
        .coerce('name', opt => {
            let name = opt.toLowerCase()
            if (name.length < 3) throw new Error('<name> is too short!')
            if (!/^[a-z_][a-z0-9_]+$/.test(name)) throw new Error('<name> should be [a-z0-9_]+ string')
            return name
        })
        .usage(
            '$0 <name>',
            'generate new application folder at apps/<name>',
            (yargs) => {
                yargs.positional('name', {
                    describe: 'application name',
                    type: 'string',
                })
            },
            (args) => {
                const name = args.name
                const greeting = chalk.white.bold(name)
                const boxenOptions = {
                    padding: 1,
                    margin: 1,
                    borderStyle: 'round',
                    borderColor: 'green',
                    backgroundColor: '#555555',
                }
                const msgBox = boxen(greeting, boxenOptions)
                console.log(msgBox)
                generate(conf.CODEGEN_TEMPLATE || DEFAULT_PROJECT_TEMPLATE, { name })
            },
        )

    args.parse(argv.slice(2))
}

module.exports = {
    createapp,
}
