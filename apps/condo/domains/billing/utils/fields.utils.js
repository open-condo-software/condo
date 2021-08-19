/**
 * Generates new import id as <contextId>__<importId>
 * @param {string} contextId
 * @param {string} importId
 * @return {string}
 */
function generateImportId (contextId, importId) {
    if (importId.startsWith(contextId + '__')) {
        return importId
    }
    return contextId + '__' + importId
}

module.exports = {
    generateImportId,
}