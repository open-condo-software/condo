type Section = {
    level: number
    header: string
    content: string
}

function _parseSections (content: string): Section[] {
    const lines = content.split('\n')
    const sections: Section[] = []
    let currentSection: Section | null = null
    let contentLines: string[] = []

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const headerMatch = line.match(/^(#{1,2})\s+(.+)$/)

        if (headerMatch) {
            // Save previous section if exists
            if (currentSection) {
                currentSection.content = contentLines.join('\n')
                sections.push(currentSection)
            }

            // Start new section
            const level = headerMatch[1].length
            currentSection = {
                level,
                header: headerMatch[2],
                content: '',
            }
            contentLines = []
        } else if (currentSection) {
            contentLines.push(line)
        }
    }

    // Save last section
    if (currentSection) {
        currentSection.content = contentLines.join('\n')
        sections.push(currentSection)
    }

    return sections
}

export function mergeAgentsMd (existingContent: string, newContent: string): string {
    const existingSections = _parseSections(existingContent)
    const newSections = _parseSections(newContent)

    const mergedSections: Section[] = []

    // Process h1 sections (replace first h1)
    const existingH1Index = existingSections.findIndex(s => s.level === 1)
    const newH1Index = newSections.findIndex(s => s.level === 1)

    if (newH1Index !== -1) {
        mergedSections.push(newSections[newH1Index])
    } else if (existingH1Index !== -1) {
        mergedSections.push(existingSections[existingH1Index])
    }

    // Process h2 sections (replace by header match)
    const existingH2Sections = existingSections.filter(s => s.level === 2)
    const newH2Sections = newSections.filter(s => s.level === 2)
    const h2Headers = new Set([...existingH2Sections.map(s => s.header), ...newH2Sections.map(s => s.header)])

    for (const header of h2Headers) {
        const newSection = newH2Sections.find(s => s.header === header)
        if (newSection) {
            mergedSections.push(newSection)
        } else {
            const existingSection = existingH2Sections.find(s => s.header === header)
            if (existingSection) {
                mergedSections.push(existingSection)
            }
        }
    }

    // Reconstruct content
    return mergedSections.map(section => {
        const hashes = '#'.repeat(section.level)
        return `${hashes} ${section.header}\n\n${section.content.trim()}`
    }).join('\n\n') + '\n'
}