const fs = require('fs')

const COMMENT_LINE_REGEX = /^\s*#/
const NON_EMPTY_LINE_REGEX = /\S+/

function decodeLine (line, index) {
    // eslint-disable-next-line no-useless-catch
    try {
        const lineParts = line.split('\t')
        if (lineParts.length !== 3) {
            throw new Error(
                `Expected 3 tab-separated JSON strings, instead have ${lineParts.length}`,
            )
        }
        let filename
        // eslint-disable-next-line no-useless-catch
        try {
            filename = JSON.parse(lineParts[0])
        } catch (e) {
            // appendErrorContext(e, 'at tab-separated column 1 (filename)')
            throw e
        }

        let ruleId
        // eslint-disable-next-line no-useless-catch
        try {
            ruleId = JSON.parse(lineParts[1])
        } catch (e) {
            // appendErrorContext(e, 'at tab-separated column 2 (RuleId)')
            throw e
        }

        let maxErrors
        // eslint-disable-next-line no-useless-catch
        try {
            maxErrors = JSON.parse(lineParts[2])
        } catch (e) {
            // appendErrorContext(e, 'at tab-separated column 3 (maxErrors)')
            throw e
        }

        return {
            encoded: line,
            filename,
            ruleId,
            maxErrors,
        }
    } catch (e) {
        // appendErrorContext(e, `at line ${index + 1}: \`${line.trim()}\``)
        throw e
    }
}

async function main () {
    const text = fs.readFileSync('eslint.seatbelt.tsv', 'utf8')

    console.log('T', [text])

    const split = text.split(/(?<=\n)/)
    console.log('SPLIT', split)

    const filtered = split
        .filter(
            (line) =>
                NON_EMPTY_LINE_REGEX.test(line) && !COMMENT_LINE_REGEX.test(line),
        )

    console.log('filtered', filtered)

    const lines = filtered.map(decodeLine)

    console.log('lines', lines)
}

main()

