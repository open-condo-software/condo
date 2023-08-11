/*
    Validating i18n translation keys in lang files

    It loads files from `lang` folder of current working directory (cwd)
    and compares it pair-by-pair.
    It exits with code 1 in case of spotted differences in keys set and order.

    ## Validation rules

    Translation files should match following rules:
    1. All supported languages should have the same set of keys
    2. Each key should be on the same line in JSON-file for each language

    ## Use-cases

    Typical use cases would be to launch this util:
    - As a pre-commit hook locally, to get instant feedback, containing inconsistencies,
      made by changes, being committed
    - As part of a CI/CD workflow

    ### Locally as a pre-commit hook

    To use it as a pre-commit hook, add following entry into `script` section of repository's `package.json`:

    ```json
    "lint-i18n-translations": "node ./../../bin/lint-i18n-translations.js",
    ```

    In `.husky/pre-commit` add a launch command, like following, supposing, that your repo
    is named `your_repo` and located in `apps` folder:

    ```
    yarn workspace @app/your_repo lint-i18n-translations
    ```

    Update pre-commit hooks, for example, when husky is in `prepare` script, run

    ```shell
    npm run prepare
    ```

    ### As part of CI/CD workflow

    Add following command to appropriate workflow configuration file:

    ```
    yarn workspace @app/condo lint-i18n-translations
    ```
*/
const fs = require('fs')
const path = require('path')

const { diffLinesUnified, diffLinesRaw } = require('jest-diff')

const name = path.basename(process.cwd())
const root = path.join(__dirname, '..', 'apps', name)
const langDir = path.join(root, 'lang')

const translations = []

fs.readdirSync(langDir).map(folderName => {
    const lang = folderName

    const filenames = [`${folderName}/${folderName}.json`, `${folderName}/${folderName}.pages.json`]
    const langKeys = []

    filenames.forEach(filename => {
        let data

        try {
            data = fs.readFileSync(langDir + '/' + filename)
        } catch (e) {
            console.log(`Error reading file "${filename}"`)
            console.error(e)
            process.exit(1)
        }

        let parsedData

        try {
            parsedData = JSON.parse(data)
        } catch (e) {
            console.log(`Error parsing file "${filename}"`)
            console.error(e)
            process.exit(1)
        }
        langKeys.push(...Object.keys(parsedData))
    })

    translations.push([lang, langKeys])
})

translations.map(([lang, keys], i) => {
    if (i === 0) return
    const [prevLang, prevKeys] = translations[i - 1]
    const diff = diffLinesRaw(prevKeys, keys)
    // Individual item of `diff` array is not an array ;)
    const diffCount = diff.filter(d => d[0] !== 0).length
    if (diffCount > 0) {
        console.log('Keys in i18n translation files are invalid!')
        console.log(`Found ${diffCount} differences between ${prevLang} and ${lang}:`)
        const visualDiff = diffLinesUnified(prevKeys, keys, { contextLines: 1, expand: false })
        console.log(visualDiff)
        process.exit(1)
    } else {
        console.log(`✔︎ I18 keys for ${prevLang} and ${lang} are identical`)
    }
})

