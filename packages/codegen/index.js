const fs = require('fs')
const os = require('os')
const path = require('path')
const { Readable } = require('stream')
const { promisify } = require('util')

const boxen = require('boxen')
const chalk = require('chalk')
const { replace } = require('lodash')
const ncp = require('ncp')
const nunjucks = require('nunjucks')
const pluralize = require('pluralize')
const yargs = require('yargs/yargs')

const conf = require('@open-condo/config')

const DEFAULT_APPLICATION_TEMPLATE = 'app00'
const DEFAULT_SCHEMA_TEMPLATE = 'schema00'
const DEFAULT_SERVICE_TEMPLATE = 'service00'

const SERVICE_TYPES = ['mutations', 'queries']

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

function pathJoin (directory, filename) {
    // used only for code generation at development stage
    // no end user input expected
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    return path.join(directory, filename)
}

async function streamToString (stream) {
    const chunks = []
    return new Promise((resolve, reject) => {
        stream.on('data', chunk => chunks.push(chunk))
        stream.on('error', reject)
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    })
}

function convertSnakeCaseToUpperCase (text) {
    // EXAMPLE: convertSnakeCaseToUpperCase('ModelNameField') --> 'MODEL_NAME_FIELD'
    return text.split(/([A-Z]+[a-z]+)/).filter(x => x).map(x => x.toUpperCase()).join('_')
}

function convertFirstLetterToLower (text) {
    if (!text) return ''
    return text.slice(0, 1).toLowerCase() + text.slice(1)
}

function toFields (signature) {
    return signature.map(([typeScriptName, attrType, arg1, arg2]) => {
        return {
            typeScriptName,
            name: typeScriptName.replace('?', ''),
            upperCaseName: convertSnakeCaseToUpperCase(typeScriptName.replace('?', '')),
            type: attrType,
            isRequired: !typeScriptName.endsWith('?'),
            isRelation: attrType === 'Relationship',
            ref: (attrType === 'Relationship') ? arg1 : undefined,
            on_delete: (attrType === 'Relationship') ? arg2 : undefined,
            options: (attrType === 'Select') ? arg1 : undefined,
        }
    })
}

function getEscapedShellCommand () {
    const command = process.argv[1].split('/').slice(-1)[0]
    const argsList = process.argv.slice(2).map(x => x.match(/^[a-zA-Z0-9_\-.]+$/g) ? x : `'${x.replace(/[']/g, '\'"\'"\'')}'`)
    const args = (argsList.length > 0) ? ` ${argsList.join(' ')}` : ''
    return `${command}${args}`
}

function renderToString (filename, template, templateContext) {
    const globalContext = {
        command: getEscapedShellCommand(),
        now: Date.now(),
        pluralize,
        convertSnakeCaseToUpperCase,
        convertFirstLetterToLower,
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
            if (['.jsx', '.js', '.json', '.ts', '.tsx', '.md', ...SERVICE_TYPES.map(x=>'.' + x)].some((x) => file.name.endsWith(x))) {
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
        let renderedName = renderToString(filename, filename, ctx)
        const templatePath = pathJoin(templateDirectory, filename)
        const isTemplateBasedPath = await exists(templatePath)
        if (isTemplateBasedPath) {
            if (filename !== renderedName && renderedName) {
                await rename(pathJoin(targetDirectory, filename), pathJoin(targetDirectory, renderedName))
            }
            if (file.isDirectory()) await renaming(pathJoin(templateDirectory, filename), pathJoin(targetDirectory, renderedName), ctx)
        }
    }
}

async function patching (templateDirectory, targetDirectory, ctx) {
    const files = await readdir(templateDirectory, { withFileTypes: true })
    for (const file of files) {
        const filename = file.name
        const patchSuffix = '.patch'
        if (filename.endsWith(patchSuffix)) {
            const patchPath = pathJoin(templateDirectory, filename)
            const patchingTargetFilename = filename.slice(0, -patchSuffix.length)
            const patchingTargetPath = pathJoin(targetDirectory, patchingTargetFilename)
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
            const defaultPath = pathJoin(templateDirectory, filename)
            const defaultTargetFilename = filename.slice(0, -defaultSuffix.length)
            const defaultTargetPath = pathJoin(targetDirectory, defaultTargetFilename)
            const isTargetExists = await exists(defaultTargetPath)
            if (!isTargetExists) {
                await renderTemplate(defaultPath, defaultTargetPath, ctx)
            }
            await rmfile(defaultPath)
        }
        if (file.isDirectory()) await patching(pathJoin(templateDirectory, filename), pathJoin(targetDirectory, filename), ctx)
    }
}

async function generate (templateDirectory, targetDirectory, ctx) {
    const readmeFile = pathJoin(targetDirectory, 'README.md')
    const tmpDirectory = await mkdtemp(pathJoin(os.tmpdir(), 'tmp-'))

    try {
        await access(templateDirectory, fs.constants.R_OK)
    } catch (err) {
        console.error('%s Invalid template name', chalk.red.bold('ERROR'))
        process.exit(1)
    }

    await renderTemplates(templateDirectory, tmpDirectory, ctx)
    await renaming(templateDirectory, tmpDirectory, ctx)
    const isPatchFile = (name) => !name.endsWith('.default') && !name.endsWith('.patch')

    await copy(tmpDirectory, targetDirectory, { filter: isPatchFile })
    await patching(tmpDirectory, targetDirectory, ctx)
    await rmdir(tmpDirectory, { recursive: true })

    console.log('%s Project ready', chalk.green.bold('DONE'))
    if (fs.existsSync(readmeFile)) {
        // this log entry for development purposes only
        // no logs formatters can be injected
        // nosemgrep: javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
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
        .options({
            'force': {
                default: false,
                describe: 'create if exists',
                type: 'boolean',
            },
        })
        .usage(
            '$0 <name> [--force]',
            'generate new application folder at apps/<name>',
            (yargs) => {
                yargs.positional('name', {
                    describe: 'application name',
                    type: 'string',
                })
            },
            async (args) => {
                const force = args.force
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
                const template = conf.CODEGEN_APPLICATION_TEMPLATE || DEFAULT_APPLICATION_TEMPLATE
                const targetDirectory = path.resolve(process.cwd(), `./apps/${name}`)
                const templateDirectory = path.resolve(path.dirname(__filename), 'templates', template)

                const isTargetDirExists = await exists(targetDirectory)
                if (isTargetDirExists && !force) throw new Error(`App '${name}' is already exists!`)

                console.log(msgBox)
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
            if (!/^[a-z][a-z0-9]+[.][A-Z][a-zA-Z0-9]+$/.test(name)) throw new Error('<domain>.<schema> has a invalid name format: we expect `domain.SchemaName`')
            return name
        })
        .coerce('signature', opt => {
            let signature = opt
            if (signature.length < 3) throw new Error('<signature> is too short!')
            return signature.split(/[ ]*;+[ ]*/).filter(x => x.includes(':')).map(field => {
                if (!/^(?:(?<field>[a-z][a-zA-Z0-9]*[?]?):[ ]*?(?<type>[A-Za-z0-9:,]+)[ ]*?)/.test(field)) {
                    throw new Error(`Unknown filed signature "${field}"`)
                }
                const result = field.split(':')
                const type = result[1]
                // Just developer helping messages
                switch (type) {
                    case 'String':
                        console.error('Use `Text` type instead of `String`')
                        break
                    case 'Boolean':
                        console.error('Use `Checkbox` type instead of `Boolean`')
                        break
                }
                switch (type) {
                    case 'Text':
                    case 'Password':
                    case 'Integer':
                    case 'Decimal':
                    case 'File':
                    case 'DateTimeUtc':
                    case 'CalendarDay':
                    case 'Json':
                    case 'Uuid':
                    case 'Checkbox':
                    case 'Url':
                        if (result.length !== 2) throw new Error(`Wrong number of argument for filed signature "${field}"`)
                        break
                    case 'Select':
                        if (result.length !== 3) throw new Error(`Wrong number of argument for filed signature "${field}"`)
                        if (!result[2].match(/^([a-z0-9-_, ]+)$/g)) throw new Error(`Wrong argument 1 for type ${type}. Filed signature "${field}"`)
                        break
                    case 'Relationship':
                        if (result.length !== 4) throw new Error(`Wrong number of argument for filed signature "${field}"`)
                        if (!result[2].match(/^([A-Za-z0-9]+)$/)) throw new Error(`Wrong argument 1 for type ${type}. Filed signature "${field}"`)
                        if (!result[3].match(/^(CASCADE|PROTECT|SET_NULL|DO_NOTHING)$/)) throw new Error(`Wrong argument 2 for type ${type}. Filed signature "${field}"`)
                        break
                    default:
                        throw new Error(`Unknown type for filed signature "${field}"`)
                }
                return result
            })
        })
        .options({
            'force': {
                default: false,
                describe: 'create if exists',
                type: 'boolean',
            },
        })
        .usage(
            '$0 <domain>.<schema> <signature> [--force]',
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
            async (args) => {
                const force = args.force
                const [domain, name] = args.domainschema.split('.')
                const signature = toFields(args.signature)
                const greeting = chalk.blue.bold(domain) + chalk.green.bold('.') + chalk.red.bold(name)
                const boxenOptions = {
                    padding: 1,
                    margin: 1,
                    borderStyle: 'round',
                    borderColor: 'green',
                    backgroundColor: '#555555',
                }
                const msgBox = boxen(greeting, boxenOptions)
                const template = conf.CODEGEN_SCHEMA_TEMPLATE || DEFAULT_SCHEMA_TEMPLATE
                const targetDirectory = path.resolve(process.cwd())
                const templateDirectory = path.resolve(path.dirname(__filename), 'templates', template)
                const app = path.basename(targetDirectory)
                console.log(app)

                // no end user input expected
                // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
                const isTargetDirExists = await exists(path.join(targetDirectory, 'domains', domain, 'schema', `${name}.js`))
                if (isTargetDirExists && !force) throw new Error(`Schema ${domain}.'${name}'.js is already exists!`)

                console.log(msgBox)
                generate(templateDirectory, targetDirectory, { app, domain, name, signature })
            },
        )

    args.parse(argv.slice(2))
}

function createservice (argv) {
    const args = yargs(argv)
        .coerce('domainschema', opt => {
            let name = opt
            if (name.length < 3) throw new Error('<domain>.<schema> is too short!')
            if (!/^[a-z][a-z0-9]+[.][A-Z][a-zA-Z0-9]+$/.test(name)) throw new Error('<domain>.<schema> has a invalid name format: we expect `domain.SomeService`')
            if (!name.endsWith('Service')) throw new Error('service name should ends with Service')
            return name
        })
        .options({
            'force': {
                default: false,
                describe: 'create if exists',
                type: 'boolean',
            },
            'type': {
                default: 'mutations',
                descirbe: 'type of service: mutations or queries',
                type: 'string',
                choices: ['mutations', 'queries'],
            },
        })
        .usage(
            '$0 <domain>.<schema> [--force]',
            'Creates a scaffold for a custom GraphQL mutation or query in specified domain',
            (yargs) => {
                yargs.positional('<domain>.<service>', {
                    describe: 'domain should be in lowercase, service name should start from uppercase and end with …Service. Don\'t delete automatically generated comment "Generated by…" in resulting module',
                    type: 'string',
                })
            },
            async (args) => {
                const force = args.force
                const type = args.type
                const [domain, name] = args.domainschema.split('.')
                const greeting = chalk.blue.bold(domain) + chalk.green.bold('.') + chalk.red.bold(name)
                const boxenOptions = {
                    padding: 1,
                    margin: 1,
                    borderStyle: 'round',
                    borderColor: 'green',
                    backgroundColor: '#555555',
                }
                const msgBox = boxen(greeting, boxenOptions)
                const template = conf.CODEGEN_SERVICE_TEMPLATE || DEFAULT_SERVICE_TEMPLATE
                const targetDirectory = path.resolve(process.cwd())
                const templateDirectory = path.resolve(path.dirname(__filename), 'templates', template)
                const app = path.basename(targetDirectory)

                // no end user input expected
                // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
                const isTargetDirExists = await exists(path.join(targetDirectory, 'domains', domain, 'schema', `${name}.js`))
                if (isTargetDirExists && !force) throw new Error(`Service ${domain}.'${name}'.js is already exists!`)

                console.log(msgBox)
                generate(templateDirectory, targetDirectory, { app, domain, name, type })
            },
        )

    args.parse(argv.slice(2))
}

module.exports = {
    createapp,
    createschema,
    createservice,
}
