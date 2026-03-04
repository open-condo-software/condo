/**
 * Removes basic markdown syntax and returns plain text.
 *
 * @param {string | null | undefined} input
 * @returns {string}
 */
export const stripMarkdown = (input) => {
    if (!input) {
        return ''
    }

    return input
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
        .replace(/\*\*|__|[_*`~]/g, '')
        .replace(/^\s{0,3}>\s?/gm, '')
        .replace(/^#{1,6}\s*/gm, '')
        .replace(/^\s*[-+*]\s+/gm, '')
        .replace(/^\s*\d+\.\s+/gm, '')
        .replace(/\n+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
}