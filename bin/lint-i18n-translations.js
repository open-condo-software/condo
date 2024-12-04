const { exec } = require('child_process')
const fs = require('fs').promises
const path = require('path')
const util = require('util')

const execPromise = util.promisify(exec)

async function writeTranslationData (translationFilePath, translationData) {
    const sortedTranslationData = Object.keys(translationData).sort().reduce((acc, key) => {
        acc[key] = translationData[key]
        return acc
    }, {})
    await fs.writeFile(translationFilePath, JSON.stringify(sortedTranslationData, null, 2), 'utf8')
}

async function loadTranslations (langDir) {
    const translations = []
    try {
        const children = await fs.readdir(langDir, { withFileTypes: true })
        for (const dirent of children) {

            // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
            const lang = dirent.isFile() ? dirent.name.split('.')[0] : dirent.name
            const fileName = dirent.isFile() ? `${dirent.name}` : `${dirent.name}/${dirent.name}.json`
            const filePath = `${langDir}/${fileName}`
            console.log(`Loading file ${filePath}`)

            try {
                const data = await fs.readFile(filePath, 'utf8')
                if (!data) {
                    throw new Error(`Loaded file "${fileName}" seems to be empty`)
                }
                const parsedData = JSON.parse(data)
                translations.push([lang, Object.keys(parsedData), parsedData])
            } catch (e) {
                throw new Error(`Error reading or parsing file "${fileName}": ${e.message}`)
            }
        }
    } catch (e) {
        throw new Error(`Error reading lang directory: ${e.message}`)
    }
    return translations
}

async function saveTranslations (langDir, translations) {
    try {
        for (const [folderName, , translationData] of translations) {
            // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
            const filePath = path.join(langDir, `${folderName}/${folderName}.json`)
            console.log(`Saving file ${filePath}`)
            await writeTranslationData(filePath, translationData)
        }
    } catch (e) {
        throw new Error(`Error saving translations: ${e.message}`)
    }
}

async function validateTranslations (translations) {
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

async function fixTranslations (translations, missingKeysReport, gptquery) {
    console.log('Fixing translations...')

    const tmpFilePath = path.join(__dirname, '..', '.gpt_translation_prompts.txt')
    const prompts = []

    for (const { lang: missedLang, missingKeys } of missingKeysReport) {
        for (const key of missingKeys) {
            const examples = translations
                .filter(([lang, , data]) => lang !== missedLang && data[key])
                .map(([lang, , data]) => `${lang}: ${data[key]}\n`)
                .join('')

            const prompt =  `We are translating property management software, and we have a translation key "${key}". The translation uses the ICU Message Format, so please preserve the placeholders, variables, and syntax exactly as they are. Here are examples of translations for this key in other languages: \n${examples}\n\nYour task is to translate this key into the language "${missedLang}". Ensure that your response is in the "${missedLang}" language and retains any formatting, placeholders, or markup (e.g., HTML tags, ICU syntax) from the examples. Please provide only the translated text in your response.`
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

async function main () {
    const args = process.argv.slice(2)
    const shouldFix = args.includes('--fix')

    const name = path.basename(process.cwd())
    const root = path.join(__dirname, '..', 'apps', name)
    const gptquery = path.join(__dirname, '..', 'bin', 'gptquery.js')
    const langDir = path.join(root, 'lang')

    const translations = await loadTranslations(langDir)
    const missingKeysReport = await validateTranslations(translations)

    if (missingKeysReport.length > 0) {
        if (shouldFix) {
            await fixTranslations(translations, missingKeysReport, gptquery)
        } else {
            throw new Error('Validation failed: Missing keys found in translation files')
        }
    }

    if (shouldFix) {
        await saveTranslations(langDir, translations)
    }
}

main().catch(e => {
    console.error('Error:', e.message)
    process.exit(1)
})
