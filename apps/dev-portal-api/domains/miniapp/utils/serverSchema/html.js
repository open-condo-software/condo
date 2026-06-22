const { parse } = require('node-html-parser')

function _prependScriptsRegexp (content, scriptTags) {
    const headMatch = /<head/i.exec(content)
    if (!headMatch) return content
    const headEnd = content.indexOf('>', headMatch.index)
    if (headEnd === -1) return content
    return content.slice(0, headEnd + 1) + scriptTags + content.slice(headEnd + 1)
}

function injectScriptTags (content, scriptTags) {
    try {
        const root = parse(content)

        const cspTag = root.querySelectorAll('meta')
            .find((meta) => (meta.getAttribute('http-equiv') || '').toLowerCase() === 'content-security-policy')
        if (cspTag) {
            cspTag.insertAdjacentHTML('afterend', scriptTags)
            return root.toString()
        }

        const head = root.querySelector('head')
        if (head) {
            head.insertAdjacentHTML('afterbegin', scriptTags)
            return root.toString()
        }

        return content
    } catch (e) {
        return _prependScriptsRegexp(content, scriptTags)
    }
}

module.exports = {
    injectScriptTags,
}