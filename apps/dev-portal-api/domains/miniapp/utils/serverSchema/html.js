const { parse } = require('node-html-parser')

function _prependScriptsRegexp (content, scriptTags) {
    const headMatch = /<head/i.exec(content)
    if (!headMatch) return content
    const headEnd = content.indexOf('>', headMatch.index)
    if (headEnd === -1) return content
    // Self-closing <head/> — normalize to <head ...>...</head>, preserving attributes.
    if (content[headEnd - 1] === '/') {
        return content.slice(0, headEnd - 1) + '>' + scriptTags + '</head>' + content.slice(headEnd + 1)
    }
    return content.slice(0, headEnd + 1) + scriptTags + content.slice(headEnd + 1)
}

function injectScriptTags (content, scriptTags) {
    // NOTE: node-html-parser is used only to locate tag positions via .range.
    // We intentionally never call root.toString() because any DOM serialization
    // normalizes malformed HTML and causes content loss (e.g. dropped <body> attributes,
    // stripped comments). See html.spec.js "malformed HTML preservation" tests.
    try {
        const root = parse(content)

        const cspTag = root.querySelectorAll('meta')
            .find((meta) => (meta.getAttribute('http-equiv') || '').toLowerCase() === 'content-security-policy')
        if (cspTag) {
            const end = cspTag.range[1]
            return content.slice(0, end) + scriptTags + content.slice(end)
        }

        const head = root.querySelector('head')
        if (head) {
            return _prependScriptsRegexp(content, scriptTags)
        }

        return content
    } catch (e) {
        return _prependScriptsRegexp(content, scriptTags)
    }
}

module.exports = {
    injectScriptTags,
}