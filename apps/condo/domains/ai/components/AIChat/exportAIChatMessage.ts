import { createWrappedPdf } from '@condo/domains/common/utils/pdf'

type ExportFormat = 'md' | 'pdf' | 'docx'

type ExportMessageOptions = {
    text: string
    format: ExportFormat
    fileNameBase?: string
}

function escapeHtml (value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

function applyInlineMarkdownToHtml (line: string): string {
    const escapedLine = escapeHtml(line)
    return escapedLine
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

function markdownToHtml (markdown: string): string {
    const lines = markdown.split('\n')
    const htmlParts: string[] = []
    let inCodeBlock = false
    let inUl = false
    let inOl = false

    const closeLists = () => {
        if (inUl) {
            htmlParts.push('</ul>')
            inUl = false
        }
        if (inOl) {
            htmlParts.push('</ol>')
            inOl = false
        }
    }

    lines.forEach((line) => {
        const trimmed = line.trim()

        if (trimmed.startsWith('```')) {
            closeLists()
            if (!inCodeBlock) {
                htmlParts.push('<pre><code>')
                inCodeBlock = true
            } else {
                htmlParts.push('</code></pre>')
                inCodeBlock = false
            }
            return
        }

        if (inCodeBlock) {
            htmlParts.push(`${escapeHtml(line)}\n`)
            return
        }

        const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/)
        if (headingMatch) {
            closeLists()
            const level = headingMatch[1].length
            htmlParts.push(`<h${level}>${applyInlineMarkdownToHtml(headingMatch[2])}</h${level}>`)
            return
        }

        const ulMatch = trimmed.match(/^[-*]\s+(.*)$/)
        if (ulMatch) {
            if (inOl) {
                htmlParts.push('</ol>')
                inOl = false
            }
            if (!inUl) {
                htmlParts.push('<ul>')
                inUl = true
            }
            htmlParts.push(`<li>${applyInlineMarkdownToHtml(ulMatch[1])}</li>`)
            return
        }

        const olMatch = trimmed.match(/^\d+\.\s+(.*)$/)
        if (olMatch) {
            if (inUl) {
                htmlParts.push('</ul>')
                inUl = false
            }
            if (!inOl) {
                htmlParts.push('<ol>')
                inOl = true
            }
            htmlParts.push(`<li>${applyInlineMarkdownToHtml(olMatch[1])}</li>`)
            return
        }

        if (!trimmed) {
            closeLists()
            htmlParts.push('<br/>')
            return
        }

        const quoteMatch = trimmed.match(/^>\s+(.*)$/)
        if (quoteMatch) {
            closeLists()
            htmlParts.push(`<blockquote>${applyInlineMarkdownToHtml(quoteMatch[1])}</blockquote>`)
            return
        }

        closeLists()
        htmlParts.push(`<p>${applyInlineMarkdownToHtml(line)}</p>`)
    })

    closeLists()
    if (inCodeBlock) {
        htmlParts.push('</code></pre>')
    }

    return htmlParts.join('')
}

function createFileNameBase (): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    return `ai-answer-${timestamp}`
}

function downloadBlob (blob: Blob, fileName: string): void {
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(objectUrl)
}

async function exportMarkdown (text: string, fileNameBase: string): Promise<void> {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
    downloadBlob(blob, `${fileNameBase}.md`)
}

async function exportDocx (text: string, fileNameBase: string): Promise<void> {
    const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import('docx')
    const lines = text.split('\n')
    const paragraphs: InstanceType<typeof Paragraph>[] = []
    let inCodeBlock = false

    const toRuns = (line: string): InstanceType<typeof TextRun>[] => {
        const runs: InstanceType<typeof TextRun>[] = []
        const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
        let lastIndex = 0
        let match

        while ((match = pattern.exec(line)) !== null) {
            if (match.index > lastIndex) {
                runs.push(new TextRun({ text: line.slice(lastIndex, match.index) }))
            }
            const token = match[0]
            if (token.startsWith('**') && token.endsWith('**')) {
                runs.push(new TextRun({ text: token.slice(2, -2), bold: true }))
            } else if (token.startsWith('*') && token.endsWith('*')) {
                runs.push(new TextRun({ text: token.slice(1, -1), italics: true }))
            } else if (token.startsWith('`') && token.endsWith('`')) {
                runs.push(new TextRun({ text: token.slice(1, -1), font: 'Courier New' }))
            }
            lastIndex = match.index + token.length
        }
        if (lastIndex < line.length) {
            runs.push(new TextRun({ text: line.slice(lastIndex) }))
        }
        return runs.length ? runs : [new TextRun({ text: ' ' })]
    }

    lines.forEach((line) => {
        const trimmed = line.trim()
        if (trimmed.startsWith('```')) {
            inCodeBlock = !inCodeBlock
            return
        }

        if (inCodeBlock) {
            paragraphs.push(new Paragraph({
                children: [new TextRun({ text: line || ' ', font: 'Courier New' })],
            }))
            return
        }

        const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/)
        if (headingMatch) {
            const headingMap = {
                1: HeadingLevel.HEADING_1,
                2: HeadingLevel.HEADING_2,
                3: HeadingLevel.HEADING_3,
                4: HeadingLevel.HEADING_4,
                5: HeadingLevel.HEADING_5,
                6: HeadingLevel.HEADING_6,
            }
            const level = Math.min(headingMatch[1].length, 6) as 1 | 2 | 3 | 4 | 5 | 6
            paragraphs.push(new Paragraph({
                heading: headingMap[level],
                children: toRuns(headingMatch[2]),
            }))
            return
        }

        const ulMatch = trimmed.match(/^[-*]\s+(.*)$/)
        if (ulMatch) {
            paragraphs.push(new Paragraph({
                bullet: { level: 0 },
                children: toRuns(ulMatch[1]),
            }))
            return
        }

        const olMatch = trimmed.match(/^\d+\.\s+(.*)$/)
        if (olMatch) {
            paragraphs.push(new Paragraph({
                bullet: { level: 0 },
                children: toRuns(olMatch[1]),
            }))
            return
        }

        const quoteMatch = trimmed.match(/^>\s+(.*)$/)
        if (quoteMatch) {
            paragraphs.push(new Paragraph({
                children: [
                    new TextRun({ text: '> ', italics: true }),
                    ...toRuns(quoteMatch[1]),
                ],
            }))
            return
        }

        paragraphs.push(new Paragraph({
            children: toRuns(line),
        }))
    })

    const document = new Document({
        sections: [
            {
                children: paragraphs,
            },
        ],
    })

    const blob = await Packer.toBlob(document)
    downloadBlob(blob, `${fileNameBase}.docx`)
}

async function exportPdf (text: string, fileNameBase: string): Promise<void> {
    const element = document.createElement('div')
    element.style.position = 'fixed'
    element.style.left = '-10000px'
    element.style.top = '0'
    element.style.width = '900px'
    element.style.padding = '24px'
    element.style.background = '#ffffff'
    element.style.color = '#000000'
    element.style.fontFamily = 'Arial, sans-serif'
    element.style.fontSize = '14px'
    element.style.lineHeight = '1.6'
    element.style.whiteSpace = 'normal'
    element.style.wordBreak = 'break-word'
    element.innerHTML = `<style>
        h1,h2,h3,h4,h5,h6{margin:16px 0 8px;line-height:1.3}
        p{margin:8px 0}
        ul,ol{margin:8px 0 8px 24px;padding:0}
        li{margin:4px 0}
        blockquote{margin:8px 0;padding-left:12px;border-left:3px solid #d9d9d9;color:#595959}
        pre{margin:8px 0;padding:10px;background:#f5f5f5;border-radius:6px;white-space:pre-wrap}
        code{font-family:'Courier New',monospace}
    </style>${markdownToHtml(text)}`

    document.body.appendChild(element)
    try {
        await createWrappedPdf({
            element,
            fileName: `${fileNameBase}.pdf`,
        })
    } finally {
        document.body.removeChild(element)
    }
}

export async function exportAIChatMessage ({ text, format, fileNameBase }: ExportMessageOptions): Promise<void> {
    if (typeof window === 'undefined') return
    if (!text) return

    const safeFileNameBase = fileNameBase || createFileNameBase()

    if (format === 'md') {
        await exportMarkdown(text, safeFileNameBase)
        return
    }

    if (format === 'docx') {
        await exportDocx(text, safeFileNameBase)
        return
    }

    await exportPdf(text, safeFileNameBase)
}
