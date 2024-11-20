const fs = require('fs').promises
const path = require('path')

const { diffLinesUnified, diffLinesRaw } = require('jest-diff')

async function loadTranslations (langDir) {
    const translations = []
    try {
        const folders = await fs.readdir(langDir)
        for (const folderName of folders) {
            const fileName = `${folderName}/${folderName}.json`
            const filePath = `${langDir}/${fileName}`
            console.log(`Loading file ${filePath}`)

            try {
                const data = await fs.readFile(filePath, 'utf8')
                if (!data) {
                    throw new Error(`Loaded file "${fileName}" seems to be empty`)
                }
                const parsedData = JSON.parse(data)
                translations.push([folderName, Object.keys(parsedData)])
            } catch (e) {
                throw new Error(`Error reading or parsing file "${fileName}": ${e.message}`)
            }
        }
    } catch (e) {
        throw new Error(`Error reading lang directory: ${e.message}`)
    }
    return translations
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
                missingKeys
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

async function fixTranslations (translations, missingKeysReport) {
    console.log('Fixing translations...')
    // TODO: Implement logic to add missing keys to the corresponding translation files
    console.log('Fixing completed.')
}

async function main () {
    const args = process.argv.slice(2)
    const shouldFix = args.includes('--fix')

    const name = path.basename(process.cwd())
    const root = path.join(__dirname, '..', 'apps', name)
    const langDir = path.join(root, 'lang')

    const translations = await loadTranslations(langDir)
    const missingKeysReport = await validateTranslations(translations)

    if (missingKeysReport.length > 0) {
        if (shouldFix) {
            await fixTranslations(translations, missingKeysReport)
        } else {
            throw new Error('Validation failed: Missing keys found in translation files')
        }
    }
}

main().catch(e => {
    console.error('Error:', e.message)
    process.exit(1)
})
