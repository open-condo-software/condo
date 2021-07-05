function normalizeText (text) {
    if (!text) return
    String(text).normalize()
    const EOL = text.match(/\r\n/gm) ? '\r\n' : '\n'
    const threeOrMoreEOL = new RegExp(`(${EOL}){3,}`, 'gm')
    const punctuations = '.,:'
    return text
        // replace three or more EOL to two EOL
        .replace(threeOrMoreEOL, EOL + EOL)
        // replace two or more spaces to one space
        .replace(/ {2,}/gm, ' ')
        // eslint-disable-next-line no-irregular-whitespace
        .replace(/ {2,}/gm, ' ')
        // eslint-disable-next-line no-irregular-whitespace
        .replace(/[  ]{2,}/gm, ' ')
        // normalize punctuation between words, e.g: 'test  ,test' -> 'test, test'
        .replace(new RegExp(`[^${punctuations}] *[${punctuations}]+ *`, 'gm'), wordWithPunctuation => (
            `${wordWithPunctuation.replace(new RegExp(` *[${punctuations}] *`, 'gm'), punctuation => punctuation.trim())} `
        ))
        // normalize spaces in double quotes, e.g: "  a b c   " => "a b c"
        .replace(/"[^"]*"/gm, m => `"${m.split('"')[1].trim()}"`)
        // trim each row
        .split(EOL)
        .map(str => str.trim())
        .join(EOL)
}

module.exports = {
    normalizeText,
}