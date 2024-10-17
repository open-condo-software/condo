const path = require('path')
const fs = require('fs')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default

/*
    Inspects .ts, .js, .tsx, .jsx files in all apps inside folders "domain", "pages"
    Searching for occurrences like { messageForUser: <key> } ; i18n(<key>) ; itntl.formatMessage({ id: <key> })
    Does not work if <key> isn't string
    Saves output in ./bin/.local/test.json in format {
        [pathToApp]: {
            {filePath, lang, translationKey, message}
        }
    }
    where message =
    'Code references undefined translation' - code translates key, which not present in en.json | ru.json
    ||
    'Unused translation' - translation exists in ru.json | en.json, but isn't used in code
 */

const APPS_TO_EXCLUDE = [
    'address-service'
]

const FILE_EXTENSIONS_TO_INCLUDE = [
    'js',
    'ts',
    'jsx',
    'tsx',
]

function getDirectoriesNames (source) {
    return fs.readdirSync(source, {withFileTypes: true})
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
}

function getLanguageJSONPaths (source) {
    const subFiles = fs.readdirSync(source, {withFileTypes: true})
    let enJson = subFiles.find(v => v.name === 'en.json')
    let ruJson = subFiles.find(v => v.name === 'ru.json')

    const throwIfNotBothFilesDefined = (ruJson, enJson) => {
        if (ruJson === !enJson) {
            throw new Error(`Does not have both translation files at ${source}`)
        }
    }

    const pathToTranslation = (source, name) => {
        return path.join(source, name)
    }

    const formatResult = (ruJson, enJson) => {
        return {
            en: path.join(enJson.parentPath, enJson.name),
            ru: path.join(ruJson.parentPath, ruJson.name),
        }
    }

    if (!enJson && !ruJson) {
        const enJsonFolderPath = path.join(source, 'en')
        const ruJsonFolderPath = path.join(source, 'ru')
        const enJsonFolder = fs.readdirSync(enJsonFolderPath, {withFileTypes: true})
        const ruJsonFolder = fs.readdirSync(ruJsonFolderPath, {withFileTypes: true})
        enJson = enJsonFolder.find(v => v.name === 'en.json')
        ruJson = ruJsonFolder.find(v => v.name === 'ru.json')
        throwIfNotBothFilesDefined(ruJson, enJson)
        enJson.parentPath = enJsonFolderPath
        ruJson.parentPath = ruJsonFolderPath
        return formatResult(ruJson, enJson)
    } else if (enJson && ruJson) {
        enJson.parentPath = source
        ruJson.parentPath = source
        return formatResult(ruJson, enJson)
    }

    throwIfNotBothFilesDefined(ruJson, enJson)
}

function parseFileToJson (source) {
    const data = fs.readFileSync(source, 'utf-8')
    if (!data) {
        return {}
    }
    return JSON.parse(data)
}

function getAllFilePathsSync(dir) {
    const filePaths = [];

    function traverse(dirPath, firstLevel = true) {
        const dirents = fs.readdirSync(dirPath, { withFileTypes: true })
        dirents
            .forEach(dirent => {
            const fullPath = path.join(dirPath, dirent.name)
            if (firstLevel && !['domains', 'pages'].includes(dirent.name)) {
                return
            }
            if (dirent.isDirectory()) {
                traverse(fullPath, false)
            } else if (FILE_EXTENSIONS_TO_INCLUDE.some(ext => dirent.name.endsWith(`.${ext}`))) {
                filePaths.push(fullPath)
            }
        });
    }

    traverse(dir)
    return filePaths
}

const STATE = {errors: 0, processed: 0, complete: 0}

function findTranslationKeysInCode (filePath) {
    const contents = fs.readFileSync(filePath, 'utf-8')
    let ast
    try {
        const sourceType = filePath.endsWith('.js') ? 'script' : 'module'
        ast = parser.parse(contents, {
            allowImportExportEverywhere: true,
            allowAwaitOutsideFunction: true,
            allowReturnOutsideFunction: true,
            allowNewTargetOutsideFunction: true,
            allowSuperOutsideMethod: true,
            allowUndeclaredExports: true,
            attachComment: false,
            errorRecovery: false,
            sourceFilename: filePath,
            sourceType: 'unambiguous',
            plugins: ['typescript', 'jsx'],
        })
    } catch (e) {
        console.error('Error parsing tree', e)
        STATE.errors += 1
        debugger;
        return []
    }
    const translationKeys = new Set()
    const isAstValid = ast && (ast.type !== 'Program' || ast.type === 'File')
    if (!isAstValid) {
        return []
    }

    try {
        traverse(ast, {
            ObjectExpression(path) {
                path.node.properties.forEach((property) => {
                    // in cases {...anotherObj}, {[someKey]: 'someValue'}, dynamic and spreaded keys checking is harder
                    if (!property.key) {
                        return
                    }
                    const keyName = property.key.type === 'Identifier'
                        ? property.key.name
                        : property.key.type === 'StringLiteral'
                            ? property.key.value
                            : null;

                    if (keyName === 'messageForUser') {
                        if (property.value.type === 'StringLiteral') {
                            translationKeys.add(property.value.value);
                        }
                    }
                });
            },

            CallExpression(path) {
                const callee = path.node.callee;

                if (callee.type === 'Identifier' && callee.name === 'i18n' && path.node.arguments.length > 0) {
                    const arg = path.node.arguments[0];

                    if (arg.type === 'StringLiteral') {
                        translationKeys.add(arg.value);
                    }
                }

                // Check if the call is to `intl.formatMessage`
                if (
                    callee.type === 'MemberExpression' &&
                    callee.object.name === 'intl' &&
                    callee.property.name === 'formatMessage' &&
                    path.node.arguments.length > 0
                ) {
                    const firstArg = path.node.arguments[0];

                    // Ensure the first argument is an object
                    if (firstArg.type === 'ObjectExpression') {
                        // Traverse the properties of the object
                        firstArg.properties.forEach((property) => {
                            // Check if there's an `id` property with the value `AskForAccessButton`
                            if (
                                property.key.name === 'id' &&
                                property.value.type === 'StringLiteral'
                            ) {
                                translationKeys.add(property.value.value)
                            }
                        });
                    }
                }
            }
        })
    } catch (e) {
        console.error(e)
        console.error(filePath, `typescript=${filePath.endsWith('.ts')}`)
        console.error(ast)
        STATE.errors += 1
        return []
    }

    STATE.complete += 1

    return [...translationKeys]
}

function compareTranslationKeys (appFolderPath, translations) {
    const allFilePaths = getAllFilePathsSync(appFolderPath)
    const translationKeys = new Set()
    const errors = []
    for (const filePath of allFilePaths) {
        const translationKeysInFile = findTranslationKeysInCode(filePath)
        STATE.processed += 1
        for (const translationKey of translationKeysInFile) {
            translationKeys.add(translationKey)
            for (const lang of ['en', 'ru']) {
                if (!translations[lang][translationKey]) {
                    errors.push({filePath, lang, translationKey, message: 'Code references undefined translation'})
                }
            }
        }
    }

    for (const lang of ['en', 'ru']) {
        const translationMap = translations[lang]
        for (const translationKey in translationMap) {
            if (!translationKeys.has(translationKey)) {
                errors.push({appFolderPath, lang, translationKey, message: 'Unused translation'})
            }
        }
    }

    return errors
}

const errors = {}

function testApp(source) {
    let langPaths
    try {
        langPaths = getLanguageJSONPaths(path.join(source, 'lang'))
    } catch {
        console.error('No "lang" folder for', source)
        return
    }
    const translations = {
        ru: parseFileToJson(langPaths.ru),
        en: parseFileToJson(langPaths.en),
    }
    errors[source] = compareTranslationKeys(source, translations)
}

async function main () {
    const appsDir = path.join(__dirname, '..', 'apps')
    const appsNames = getDirectoriesNames(appsDir).filter(name => !APPS_TO_EXCLUDE.includes(name))

    for (const appName of appsNames) {
        console.log('TEST', appName)
        testApp(path.join(appsDir, appName))
    }

    console.log(errors)
    console.log(STATE)

    const binPath = path.join(appsDir, '..', 'bin')
    if (!fs.existsSync(path.join(binPath, '.local'))) {
        fs.mkdirSync(path.join(binPath, '.local'))
    }
    fs.writeFileSync(path.join(binPath,'.local','test.json'), JSON.stringify(errors), {encoding: 'utf-8'})
    process.exit(0)
}

main().catch((e) => {
    console.error(e)
    console.log(errors)
    console.log(STATE)
    process.exit(1)
})