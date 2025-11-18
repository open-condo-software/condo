export const stripMarkdown = (input?: string | null): string => {
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
