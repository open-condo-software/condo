const fs = require('fs')

const COMMENT_LINE_REGEX = /^\s*#/

async function main () {
    const filename = 'eslint.seatbelt.tsv'
    const text = fs.readFileSync(filename, 'utf8')

    console.log([text])

    const split = text.split(/(?<=\n)/)
    const lines = split
        .filter(
            (line) =>
                line !== '' && line !== '\n' && !COMMENT_LINE_REGEX.test(line),
        )

    console.log(lines)
}

main().then(() => console.log('ALL DONE'))

console.log(JSON.parse('1\r\n'))