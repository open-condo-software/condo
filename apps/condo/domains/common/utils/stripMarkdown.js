/**
 * Removes basic markdown syntax and returns plain text.
 *
 * @param {string | null | undefined} input
 * @returns {string}
 */
const stripMarkdown = (input) => {
    if (!input) {
        return ''
    }

    return input
        .replaceAll(/!\[[^\]]{0,1000}\]\([^)]{0,1000}\)/g, '')
        .replaceAll(/\[([^\]]{1,1000})\]\(([^)]{1,1000})\)/g, '$1')
        .replaceAll(/\*\*|__/g, '')
        .replaceAll(/[`]/g, '')
        .replaceAll(/^\s{0,3}>\s?/gm, '')
        .replaceAll(/^#{1,6}\s*/gm, '')
        .replaceAll(/\n+/g, ' ')
        .replaceAll(/\s{2,1000}/g, ' ')
        .trim()
}

module.exports = { stripMarkdown }