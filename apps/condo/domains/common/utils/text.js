function normalizeText (text) {
    if (!text) return
    String(text).normalize()
    const punctuations = '.,:'
    return text
        // replace three or more EOL to two EOL
        .replace(/\n{3,}/gm, '\n\n')
        // replace two or more spaces to one space
        .replace(/[^\S\r\n]+/g, ' ')
        // normalize punctuation between words, e.g: 'test  ,test' -> 'test, test'
        .replace(new RegExp(`[^${punctuations}] *[${punctuations}]+ *`, 'gm'), wordWithPunctuation => (
            `${wordWithPunctuation.replace(new RegExp(` *[${punctuations}] *`, 'gm'), punctuation => punctuation.trim())} `
        ))
        // normalize spaces in double quotes, e.g: "  a b c   " => "a b c"
        .replace(/"[^"]*"/gm, m => `"${m.split('"')[1].trim()}"`)
        // trim each row
        .split('\n')
        .map(str => str.trim())
        .join('\n')
}

module.exports = {
    normalizeText,
}