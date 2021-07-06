function normalizeText (text) {
    if (!text) return
    String(text).normalize()
    const punctuations = '.,:;'
    return text
        // remove unprintable letters without \n
        .replace(/[^\P{C}\n]+/gmu, '')
        // replace two or more \n to one \n
        .replace(/\n+/gm, '\n')
        // replace two or more spaces to one space
        .replace(/\p{Z}+/gu, ' ')
        // normalize punctuation between words, e.g: 'test  ,test' -> 'test, test'
        .replace(new RegExp(`[\\p{L}\\p{N}] *[${punctuations}]+ *`, 'gmu'), wordWithPunctuation => (
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