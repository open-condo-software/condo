const { exec } = require('child_process')
const fs = require('fs').promises
const path = require('path')
const util = require('util')

const { program } = require('commander')

const execPromise = util.promisify(exec)

program
    .option('--fix', 'Automatically fix missing translation keys')
    .description('Validate and optionally fix i18n translation files')

async function writeTranslationData (translationFilePath, translationData) {
    const sortedTranslationData = Object.keys(translationData).sort().reduce((acc, key) => {
        acc[key] = translationData[key]
        return acc
    }, {})
    await fs.writeFile(translationFilePath, JSON.stringify(sortedTranslationData, null, 2), 'utf8')
}

async function writeFile (filePath, data) {
    const directoryPath = path.dirname(filePath)
    await fs.mkdir(directoryPath, { recursive: true })
    await fs.writeFile(filePath, data, 'utf8')
}

async function loadStringTranslations (langDir) {
    const translations = []
    try {
        const entries = await fs.readdir(langDir, { withFileTypes: true })
        for (const entry of entries) {
            if (!entry.isDirectory()) continue
            const folderName = entry.name
            // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
            const filePath = path.join(langDir, folderName, `${folderName}.json`)
            console.log(`Loading file ${filePath}`)

            try {
                await fs.access(filePath)
                const data = await fs.readFile(filePath, 'utf8')
                if (!data) {
                    throw new Error(`Loaded file "${filePath}" seems to be empty`)
                }
                const parsedData = JSON.parse(data)
                translations.push([folderName, Object.keys(parsedData), parsedData])
            } catch (e) {
                throw new Error(`Error reading or parsing file "${filePath}": ${e.message}`)
            }
        }
    } catch (e) {
        throw new Error(`Error reading lang directory: ${e.message}`)
    }
    return translations
}

async function isAnyMessagesDirectoryExists (langDir) {
    try {
        const locales = await fs.readdir(langDir, { withFileTypes: true })
        for (const locale of locales) {
            if (!locale.isDirectory()) continue
            // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
            const localePath = path.join(langDir, locale.name)
            // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
            const messagesPath = path.join(localePath, 'messages')
            try {
                const stat = await fs.stat(messagesPath)
                if (stat.isDirectory()) {
                    return true
                }
            } catch (e) {
                // Ignore errors that indicate messages directory does not exist
                if (e.code !== 'ENOENT') {
                    throw new Error(`Error checking messages directory at "${messagesPath}": ${e.message}`)
                }
            }
        }
    } catch (e) {
        throw new Error(`Error reading lang directory: ${e.message}`)
    }
    return false
}

async function loadMessagesDirectories (langDir) {
    const messageData = {}
    try {
        const locales = await fs.readdir(langDir, { withFileTypes: true })
        for (const locale of locales) {
            if (!locale.isDirectory()) continue
            // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
            const localePath = path.join(langDir, locale.name, 'messages')
            // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
            console.log(`Loading files ${path.join(localePath, '*')}`)
            messageData[locale.name] = {}
            try {
                const entries = await fs.readdir(localePath, { withFileTypes: true })
                for (const entry of entries) {
                    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
                    const messageDirPath = path.join(localePath, entry.name)
                    if (entry.isDirectory()) {
                        try {
                            const files = await fs.readdir(messageDirPath)
                            const njkFiles = {}
                            for (const file of files) {
                                // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
                                const filePath = path.join(messageDirPath, file)
                                if (file.endsWith('.njk')) {
                                    try {
                                        await fs.access(filePath)
                                        const data = await fs.readFile(filePath, 'utf8')
                                        if (!data) {
                                            throw new Error(`Loaded file "${filePath}" seems to be empty`)
                                        }
                                        njkFiles[file] = data
                                    } catch (e) {
                                        throw new Error(`Error reading or parsing file "${filePath}": ${e.message}`)
                                    }
                                } else {
                                    console.warn(`Warning: Unexpected file found during processing messages directory: ${filePath} (does not match the "*.njk" pattern)`)
                                }
                            }
                            messageData[locale.name][entry.name] = {
                                messageDir: entry.name,
                                njkFiles,
                            }
                        } catch (e) {
                            throw new Error(`Error reading files in directory "${messageDirPath}": ${e.message}`)
                        }
                    } else {
                        console.warn(`Warning: Unexpected file found during processing messages directory: ${messageDirPath}`)
                    }
                }
            } catch (e) {
                throw new Error(`Error working with messages directory "${localePath}": ${e.message}`)
            }
        }
    } catch (e) {
        throw new Error(`Error reading lang directory: ${e.message}`)
    }
    return messageData
}

async function validateMessagesDirectories (messageData) {
    const missingFilesReport = []
    const filePresenceMap = {}
    try {
        // Gather all unique files across all locales with messageDir/njkFileName combinations
        for (const locale in messageData) {
            for (const messageDir in messageData[locale]) {
                const njkFiles = messageData[locale][messageDir].njkFiles
                for (const file in njkFiles) {
                    const fileKey = `${messageDir}/${file}`
                    if (!filePresenceMap[fileKey]) {
                        filePresenceMap[fileKey] = new Set()
                    }
                    filePresenceMap[fileKey].add(locale)
                }
            }
        }

        // Validate each locale to ensure it contains all necessary files
        for (const fileKey in filePresenceMap) {
            const [messageDir, fileName] = fileKey.split('/')
            for (const locale in messageData) {
                if (!messageData[locale][messageDir] || !messageData[locale][messageDir].njkFiles[fileName]) {
                    missingFilesReport.push({
                        locale,
                        messageDir,
                        missingFile: fileName,
                        // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
                        missingPath: path.join(locale, 'messages', messageDir, fileName),
                    })
                }
            }
        }

        // Report missing files
        if (missingFilesReport.length > 0) {
            console.log('Missing files found in message directories:')
            for (const report of missingFilesReport) {
                console.log(`- Locale "${report.locale}", Message "${report.messageDir}" is missing file "${report.missingFile}": ${report.missingPath}`)
            }
        } else {
            console.log('✔︎ All message directories are consistent across locales and contain all necessary files')
        }
    } catch (e) {
        throw new Error(`Error validating messages directories: ${e.message}`)
    }
    return missingFilesReport
}

async function saveTranslations (langDir, translations) {
    try {
        for (const [folderName, , translationData] of translations) {
            // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
            const filePath = path.join(langDir, folderName, `${folderName}.json`)
            console.log(`Saving file ${filePath}`)
            await writeTranslationData(filePath, translationData)
        }
    } catch (e) {
        throw new Error(`Error saving translations: ${e.message}`)
    }
}

async function saveFixedFiles (langDir, filesToWrite) {
    try {
        for (const { path: targetPath, content } of filesToWrite) {
            // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
            const filePath = path.join(langDir, targetPath)
            console.log(`Saving file ${filePath}`)
            await writeFile(filePath, content)
        }
    } catch (e) {
        throw new Error(`Error saving translations: ${e.message}`)
    }
}

async function validateStringTranslations (translations) {
    const allKeys = new Set()
    translations.forEach(([, keys]) => {
        keys.forEach(key => allKeys.add(key))
    })

    const missingKeysReport = []

    for (const [lang, keys] of translations) {
        const missingKeys = Array.from(allKeys).filter(key => !keys.includes(key))

        if (missingKeys.length > 0) {
            missingKeysReport.push({
                lang,
                missingKeys,
            })
        }
    }

    if (missingKeysReport.length > 0) {
        console.log('Missing keys found in i18n translation files:')
        for (const report of missingKeysReport) {
            console.log(`- ${report.lang} is missing keys: ${report.missingKeys.join(', ')}`)
        }
    } else {
        console.log('✔︎ All i18n translation files have identical keys')
    }

    return missingKeysReport
}

async function fixStringTranslations (translations, missingKeysReport, gptquery) {
    console.log('Fixing translations...')

    const tmpFilePath = path.join('.', '.gpt_translation_prompts.log')
    const prompts = []

    for (const { lang: missedLang, missingKeys } of missingKeysReport) {
        for (const key of missingKeys) {
            const examples = translations
                .filter(([lang, , data]) => lang !== missedLang && data[key])
                .map(([lang, , data]) => `${lang}: ${data[key]}\n`)
                .join('')

            const prompt = `We are translating property management software, and we have a translation key "${key}". The translation uses the ICU Message Format, so please preserve the placeholders, variables, and syntax exactly as they are. Here are examples of translations for this key in other languages: \n${examples}\n\nYour task is to translate this key into the language "${missedLang}". Ensure that your response is in the "${missedLang}" language and retains any formatting, placeholders, or markup (e.g., HTML tags, ICU syntax) from the examples. Please provide only the translated text in your response.`
            prompts.push(prompt)
        }
    }

    try {
        await fs.writeFile(tmpFilePath, prompts.join('\n----\n'), 'utf8')
        console.log(`Prompt file created at ${tmpFilePath}`)

        const { stdout, stderr } = await execPromise(`node ${gptquery} ${tmpFilePath}`)
        if (stderr) {
            console.error('Warning during GPT query execution:', stderr)
        }

        console.log(`GPT query executed successfully:\n${stdout.trim()}`)

        let i = 0
        for (const { lang: missedLang, missingKeys } of missingKeysReport) {
            const translation = translations.find(([lang]) => lang === missedLang)
            const [, , translationData] = translation
            for (const key of missingKeys) {
                i++
                const resultFilePath = path.join('out', `result_${i}.md`)
                const resultData = (await fs.readFile(resultFilePath, 'utf8')).trim()
                translationData[key] = resultData
            }
        }
    } catch (e) {
        throw new Error(`Error fixing translations: ${e.message}`)
    }

    console.log('Fixing completed.')
}

async function fixMessagesDirectories (missingFilesReport, messageData, gptquery) {
    console.log('Fixing missing message files...')
    const prompts = []

    // Generate prompts for missing files
    for (const { locale, messageDir, missingFile } of missingFilesReport) {
        const examples = Object.entries(messageData)
            .filter(([exampleLocale]) => exampleLocale !== locale && messageData[exampleLocale][messageDir] && messageData[exampleLocale][messageDir].njkFiles[missingFile])
            .map(([exampleLocale, data]) => `### translation for ${exampleLocale} locale\n${data[messageDir].njkFiles[missingFile].trim()}`)
            .join('\n\n')

        const prompt = `We are missing the message template "${missingFile}" in the directory "${messageDir}" for the locale "${locale}".\n\n# Here are examples of the template in other languages:\n\n${examples}\n\n# Your task\nPlease generate the content for this file in the "${locale}" locale. Ensure that your response is in the "${locale}" language and retains any formatting, placeholders, or markup (e.g., HTML tags, ICU syntax) from the examples. Please provide only the translated text in your response.`
        prompts.push({ locale, messageDir, missingFile, prompt })
    }

    const tmpFilePath = path.join('.', '.gpt_missing_files_prompts.log')
    try {
        // Write all prompts to a temporary file
        await fs.writeFile(tmpFilePath, prompts.map(p => p.prompt).join('\n----\n'), 'utf8')
        console.log(`Prompt file created at ${tmpFilePath}`)

        // Execute the GPT query command
        const { stdout, stderr } = await execPromise(`node ${gptquery} ${tmpFilePath}`)
        if (stderr) {
            console.error('Warning during GPT query execution:', stderr)
        }

        console.log(`GPT query executed successfully:\n${stdout.trim()}`)

        let i = 0
        const filesToWrite = []
        for (const { missingPath } of missingFilesReport) {
            i++
            const resultFilePath = path.join('out', `result_${i}.md`)
            try {
                const resultData = (await fs.readFile(resultFilePath, 'utf8')).trim()
                filesToWrite.push({ path: missingPath, content: resultData })
            } catch (e) {
                throw new Error(`Error reading result file "${resultFilePath}": ${e.message}`)
            }
        }

        return filesToWrite
    } catch (e) {
        throw new Error(`Error fixing translations: ${e.message}`)
    }
}

async function main () {
    const { fix: shouldFix } = program.parse().opts()

    const name = path.basename(process.cwd())
    const root = path.join(__dirname, '..', 'apps', name)
    const gptquery = path.join(__dirname, '..', 'bin', 'gptquery.js')
    const langDir = path.join(root, 'lang')
    const filesToWrite = []

    const translations = await loadStringTranslations(langDir)
    const missingKeysReport = await validateStringTranslations(translations)

    if (missingKeysReport.length > 0) {
        if (shouldFix) {
            await fixStringTranslations(translations, missingKeysReport, gptquery)
        } else {
            throw new Error('Validation failed: Missing keys found in translation files')
        }
    }

    const hasMessagesDirectory = await isAnyMessagesDirectoryExists(langDir)
    if (hasMessagesDirectory) {
        const messageData = await loadMessagesDirectories(langDir)
        const missingFilesReport = await validateMessagesDirectories(messageData)

        if (missingFilesReport.length > 0) {
            if (shouldFix) {
                const messagesFilesToWrite = await fixMessagesDirectories(missingFilesReport, messageData, gptquery)
                if (messagesFilesToWrite.length > 0) filesToWrite.push(...messagesFilesToWrite)
            } else {
                throw new Error('Validation failed: Missing messages file found')
            }
        }
    }

    if (shouldFix) {
        // NOTE: all save operations should be here! to realize --dry-run feature in a future
        await saveTranslations(langDir, translations)
        await saveFixedFiles(langDir, filesToWrite)
    }
}

main().catch(e => {
    console.error('Error:', e.message)
    process.exit(1)
})
