const chalk = require('chalk')
const boxen = require('boxen')
const yargs = require('yargs/yargs')
const fs = require('fs')
const os = require('os')
const path = require('path')
const ncp = require('ncp')
const { promisify } = require('util')
const nunjucks = require('nunjucks')
const { Readable } = require('stream')
const { replace } = require('lodash')
const pluralize = require('pluralize')
const conf = require('@core/config')

const DEFAULT_APPLICATION_TEMPLATE = 'app00'
const DEFAULT_SCHEMA_TEMPLATE = 'schema00'
const access = promisify(fs.access)
const copy = promisify(ncp)
const readdir = promisify(fs.readdir)
const rename = promisify(fs.rename)
const exists = promisify(fs.exists)
const mkdtemp = promisify(fs.mkdtemp)
const rmdir = promisify(fs.rmdir)
const rmfile = promisify(fs.unlink)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

nunjucks.configure({ autoescape: false })

async function streamToString (stream) {
    const chunks = []
    return new Promise((resolve, reject) => {
        stream.on('data', chunk => chunks.push(chunk))
        stream.on('error', reject)
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    })
}

function renderToString (filename, template, templateContext) {
    const globalContext = {
        pluralize,
        command: process.argv[1].split('/').slice(-1)[0] + ' ' + process.argv.slice(2).join(' '),
    }
    try {
        return nunjucks.renderString(template, { ...globalContext, ...templateContext })
    } catch (e) {
        console.error('%s Render file problem: %s (file=%s)', chalk.yellow.bold('WARN'), e, filename)
    }
    return '_RENDER_ERROR_'
}

async function applyPatches (patchSource, patchTarget, ctx) {
    const source = await readFile(patchSource, { encoding: 'utf8' })
    const originalTarget = await readFile(patchTarget, { encoding: 'utf8' })
    let target = originalTarget
    const patches = source.matchAll(/\/\* AUTOGENERATE MARKER (<[a-zA-Z0-9_-]+>) \*\/(?:[^\n]*\n)(.*?)\/\*\*\//sg)
    for (const [, markerName, patch] of patches) {
        const marker = `/* AUTOGENERATE MARKER ${markerName} */`
        const renderedPatch = renderToString(patchSource, patch, ctx) + marker
        if (!target.includes(renderedPatch)) {
            target = replace(target, marker, renderedPatch)
        }
    }
    if (target === originalTarget) {
        console.error('%s Patching problem: nothing to patch! (file=%s)', chalk.yellow.bold('WARN'), patchTarget)
    } else {
        await writeFile(patchTarget, target)
    }
}

async function renderTemplate (templateFile, targetFile, ctx) {
    const source = await readFile(templateFile, { encoding: 'utf8' })
    const rendered = renderToString(templateFile, source, ctx)
    await writeFile(targetFile, rendered)
}

async function renderTemplates (templateDirectory, targetDirectory, templateContext) {
    return copy(templateDirectory, targetDirectory, {
        transform: async (readStream, writeStream, file) => {
            if (['.jsx', '.js', '.json', '.ts', '.tsx', '.md'].some((x) => file.name.endsWith(x))) {
                const template = await streamToString(readStream)
                const renderedTemplate = renderToString(file.name, template, templateContext)
                const readable = Readable.from([renderedTemplate])
                readable.pipe(writeStream)
            } else {
                readStream.pipe(writeStream)
            }
        },
        clobber: true,
    })
}

async function renaming (templateDirectory, targetDirectory, ctx) {
    const files = await readdir(targetDirectory, { withFileTypes: true })
    for (const file of files) {
        const filename = file.name
        const renderedName = renderToString(filename, filename, ctx)
        const templatePath = path.join(templateDirectory, filename)
        const isTemplateBasedPath = await exists(templatePath)
        if (isTemplateBasedPath) {
            if (filename !== renderedName && renderedName) {
                await rename(path.join(targetDirectory, filename), path.join(targetDirectory, renderedName))
            }
            if (file.isDirectory()) await renaming(path.join(templateDirectory, filename), path.join(targetDirectory, renderedName), ctx)
        }
    }
}

async function patching (templateDirectory, targetDirectory, ctx) {
    const files = await readdir(templateDirectory, { withFileTypes: true })
    for (const file of files) {
        const filename = file.name
        const patchSuffix = '.patch'
        if (filename.endsWith(patchSuffix)) {
            const patchPath = path.join(templateDirectory, filename)
            const patchingTargetFilename = filename.slice(0, -patchSuffix.length)
            const patchingTargetPath = path.join(targetDirectory, patchingTargetFilename)
            console.log('%s Applying patches to: %s', chalk.green.bold('INFO'), patchingTargetPath)
            const isPatchingTargetExists = await exists(patchingTargetPath)
            if (isPatchingTargetExists) {
                await applyPatches(patchPath, patchingTargetPath, ctx)
            } else {
                console.error('%s Patching problem: file not exists! (file=%s)', chalk.yellow.bold('WARN'), patchingTargetPath)
            }
            await rmfile(patchPath)
        }
        const defaultSuffix = '.default'
        if (filename.endsWith(defaultSuffix)) {
            const defaultPath = path.join(templateDirectory, filename)
            const defaultTargetFilename = filename.slice(0, -defaultSuffix.length)
            const defaultTargetPath = path.join(targetDirectory, defaultTargetFilename)
            const isTargetExists = await exists(defaultTargetPath)
            if (!isTargetExists) {
                await renderTemplate(defaultPath, defaultTargetPath, ctx)
            }
            await rmfile(defaultPath)
        }
        if (file.isDirectory()) await patching(path.join(templateDirectory, filename), path.join(targetDirectory, filename), ctx)
    }
}

async function generate (templateDirectory, targetDirectory, ctx) {
    const readmeFile = path.join(targetDirectory, 'README.md')
    const tmpDirectory = await mkdtemp(path.join(os.tmpdir(), 'tmp-'))
    // console.log('%s Temporary dir: %s', chalk.green.bold('INFO'), tmpDirectory)

    try {
        await access(templateDirectory, fs.constants.R_OK)
    } catch (err) {
        console.error('%s Invalid template name', chalk.red.bold('ERROR'))
        process.exit(1)
    }

    await renderTemplates(templateDirectory, tmpDirectory, ctx)
    await renaming(templateDirectory, tmpDirectory, ctx)

    const isPatchFile = (name) => !name.endsWith('.patch') && !name.endsWith('.default')
    await copy(tmpDirectory, targetDirectory, { filter: isPatchFile })
    await patching(tmpDirectory, targetDirectory, ctx)
    await rmdir(tmpDirectory, { recursive: true })

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
                const template = conf.CODEGEN_APPLICATION_TEMPLATE || DEFAULT_APPLICATION_TEMPLATE
                const targetDirectory = path.resolve(process.cwd(), `./apps/${name}`)
                const templateDirectory = path.resolve(path.dirname(__filename), 'templates', template)
                generate(templateDirectory, targetDirectory, { name })
            },
        )

    args.parse(argv.slice(2))
}

function createschema (argv) {
    const args = yargs(argv)
        .coerce('domainschema', opt => {
            let name = opt
            if (name.length < 3) throw new Error('<domain>.<schema> is too short!')
            if (!/^[A-Z][a-zA-Z0-9]+[.][A-Z][a-zA-Z0-9]+$/.test(name)) throw new Error('<domain>.<schema> has a invalid name format: we expect Domain.SchemaName or Domain.SomeService')
            return name
        })
        .coerce('signature', opt => {
            let signature = opt
            if (signature.length < 3) throw new Error('<signature> is too short!')
            if (!/^(?:(?<field>[a-z][a-zA-Z0-9]+[?]?):(?<type>Text|Password|Integer|Decimal|File|DateTimeUtc|Json|Checkbox:(true|false|null)|Select:[a-z0-9, ]+|Relationship:[A-Za-z0-9]+:(CASCADE|PROTECT|SET_NULL|DO_NOTHING))[ ;]*?)+$/.test(signature)) throw new Error('<signature> has a invalid format: we expect <field>:<type>. Example: user:Relationship:User:CASCADE; password:Password; email:Text; type:Select:t1,t2')
            return signature.split(/[ ]*;+[ ]*/).map(x => x.split(':'))
        })
        .usage(
            '$0 <domain>.<schema> <signature>',
            'generate new domain models and services',
            (yargs) => {
                yargs.positional('<domain>.<schema>', {
                    describe: 'model or service name',
                    type: 'string',
                })
                yargs.positional('<signature>', {
                    describe: 'type definition',
                    type: 'string',
                })
            },
            (args) => {
                const [domain, name] = args.domainschema.split('.')
                const signature = args.signature
                const greeting = chalk.blue.bold(domain) + chalk.green.bold('.') + chalk.red.bold(name)
                const boxenOptions = {
                    padding: 1,
                    margin: 1,
                    borderStyle: 'round',
                    borderColor: 'green',
                    backgroundColor: '#555555',
                }
                const msgBox = boxen(greeting, boxenOptions)
                console.log(msgBox)
                const template = conf.CODEGEN_SCHEMA_TEMPLATE || DEFAULT_SCHEMA_TEMPLATE
                const targetDirectory = path.resolve(process.cwd())
                const templateDirectory = path.resolve(path.dirname(__filename), 'templates', template)
                generate(templateDirectory, targetDirectory, { domain, name, signature })
            },
        )

    args.parse(argv.slice(2))
}

module.exports = {
    createapp,
    createschema,
}
