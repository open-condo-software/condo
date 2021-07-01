
function normalizeText (text) {
    if (!text) return
    const EOL = text.match(/\r\n/gm) ? '\r\n' : '\n'
    const threeOrMoreEOL = new RegExp(`(${EOL}){3,}`, 'gm')
    return text.replace(threeOrMoreEOL, EOL + EOL)
        .split(EOL)
        .map(str => str.trim().replace(/[^\S\r\n]+/g, ' '))
        .join(EOL)
}

module.exports = {
    normalizeText,
}