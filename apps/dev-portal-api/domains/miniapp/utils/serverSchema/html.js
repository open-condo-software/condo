function injectScriptTags (content, scriptTags) {
    const headMatch = /<head/i.exec(content)
    if (!headMatch) return content
    const headEnd = content.indexOf('>', headMatch.index)
    if (headEnd === -1) return content
    return content.slice(0, headEnd + 1) + scriptTags + content.slice(headEnd + 1)
}

module.exports = {
    injectScriptTags,
}