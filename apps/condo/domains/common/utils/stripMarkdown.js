/**
 * Removes basic markdown syntax and returns plain text.
 *
 * @param {string | null | undefined} input
 * @param {{ collapseLineBreaks?: boolean }} [options]
 * @param {boolean} [options.collapseLineBreaks=true] Collapses line breaks into a single line. Use false to preserve paragraph breaks (e.g. copy/export).
 * @returns {string}
 */
const stripMarkdown = (input, options = {}) => {
    const { collapseLineBreaks = true } = options

    if (!input) {
        return ''
    }

    let result = input
        .replaceAll(/!\[[^\]]{0,1000}\]\([^)]{0,1000}\)/g, '')
        .replaceAll(/\[([^\]]{1,1000})\]\(([^)]{1,1000})\)/g, '$1')
        .replaceAll(/\*\*|__/g, '')
        .replaceAll(/(^|[^\w*])\*([^*\s][^*]{0,1000}?)\*(?=[^\w*]|$)/g, '$1$2')
        .replaceAll(/[`]/g, '')
        .replaceAll(/^\s{0,3}>\s?/gm, '')
        .replaceAll(/^#{1,6}\s*/gm, '')

    if (collapseLineBreaks) {
        result = result
            .replaceAll(/\n+/g, ' ')
            .replaceAll(/\s{2,1000}/g, ' ')
    } else {
        result = result
            .split('\n')
            .map((line) => line.replaceAll(/\s{2,1000}/g, ' ').trimEnd())
            .join('\n')
            .replace(/\n{3,}/g, '\n\n')
    }

    return result.trim()
}

module.exports = { stripMarkdown }
