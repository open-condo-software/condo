export function replaceHeaders (text: string, minLevel = 1, maxLevel = 6) {
    return text.replace(/^(#{1,6})(?=$|\s)/gm, (match) => {
        const clampedLevel = Math.min(Math.max(match.length, minLevel), maxLevel)
        return '#'.repeat(clampedLevel)
    })
}