function removeSpacesInsideQuotes (s) {
    const nestedQuotes = []
    let res = [...s]
    for (let i = 0; i < res.length; i++) {
        const char = res[i]
        if (char === '"') {
            if (nestedQuotes[nestedQuotes.length - 1] === char) {
                nestedQuotes.pop()
                if (res[i - 1] === ' ') res[i - 1] = ''
            } else {
                nestedQuotes.push(char)
                if (res[i + 1] === ' ') res[i + 1] = ''
            }
        }
    }
    return res.join('')
}

function normalizeText (text) {
    if (!text) return
    String(text).normalize()
    const EOL = text.match(/\r\n/gm) ? '\r\n' : '\n'
    const threeOrMoreEOL = new RegExp(`(${EOL}){3,}`, 'gm')
    const punctuations = '.,:'
    const formatted = text
        // replace three or more EOL to two EOL
        .replace(threeOrMoreEOL, EOL + EOL)
        // replace two or more spaces to one space
        .replace(/ {2,}/gm, ' ')
        // normalize punctuation between words, e.g: 'test  ,test' -> 'test, test'
        .replace(new RegExp(`[^${punctuations}] *[${punctuations}]+ *`, 'gm'), wordWithPunctuation => (
            `${wordWithPunctuation.replace(new RegExp(` *[${punctuations}] *`, 'gm'), punctuation => punctuation.trim())} `
        ))
        // trim each row
        .split(EOL)
        .map(str => str.trim())
        .join(EOL)

    return removeSpacesInsideQuotes(formatted)
}

module.exports = {
    normalizeText,
}