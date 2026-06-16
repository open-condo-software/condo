function injectScriptTags (content, scriptTags) {
    const headStart = content.indexOf('<head')
    if (headStart === -1) return content
    const headEnd = content.indexOf('>', headStart)
    if (headEnd === -1) return content
    return content.slice(0, headEnd + 1) + scriptTags + content.slice(headEnd + 1)
}

module.exports = {
    injectScriptTags,
}