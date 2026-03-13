export const stripMarkdown = (input?: string | null): string => {
    if (!input) {
        return ''
    }

    return input
        .replaceAll(/!\[[^\]]{0,1000}\]\([^)]{0,1000}\)/g, '')
        .replaceAll(/\[([^\]]{1,1000})\]\(([^)]{1,1000})\)/g, '$1')
        .replaceAll(/\*\*|__|[_*`~]/g, '')
        .replaceAll(/^\s{0,3}>\s?/gm, '')
        .replaceAll(/^#{1,6}\s*/gm, '')
        .replaceAll(/^\s{0,3}[-+*]\s+/gm, '')
        .replaceAll(/^\s{0,3}\d+\.\s+/gm, '')
        .replaceAll(/\n+/g, ' ')
        .replaceAll(/\s{2,}/g, ' ')
        .trim()
}
