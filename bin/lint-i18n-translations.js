const fs = require('fs')
const { diffLinesUnified, diffLinesRaw } = require('jest-diff')

const langDir = 'apps/condo/lang'

const translations = []

console.log(
    'Validating i18n translation keys\n' +
    '1. All supported languages should have the same set of keys\n' +
    '2. Each key should be on the same line in JSON-file for each language'
)

fs.readdirSync(langDir).map(fileName => {
    const lang = fileName.match(/(\w+)\.json/)[1]
    const filePath = `${langDir}/${fileName}`
    console.log(`Load file ${filePath}`)

    let data
    try {
        data = fs.readFileSync(filePath, 'utf8')
    } catch (e) {
        console.log(`Error reading file "${fileName}"`)
        console.error(e)
    }
    if (!data) {
        return
    }
    let parsedData
    try {
        parsedData = JSON.parse(data)
    } catch (e) {
        console.log(`Error reading file "${fileName}"`)
        console.error(e)
    }
    translations.push([lang, Object.keys(parsedData)])
})

translations.map(([lang, keys], i) => {
    if (i === 0) return
    const [prevLang, prevKeys] = translations[i - 1]
    const diff = diffLinesRaw(prevKeys, keys)
    // Individual item of `diff` array is not an array ;)
    const diffCount = diff.filter(d => d[0] !== 0).length
    if (diffCount > 0) {
        console.log(`Found ${diffCount} differences between ${prevLang} and ${lang}:`)
        const visualDiff = diffLinesUnified(prevKeys, keys, { contextLines: 1, expand: false })
        console.log(visualDiff)
    } else {
        console.log(`✔︎ I18 keys for ${prevLang} and ${lang} are identical`)
    }
})

