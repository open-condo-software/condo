import { createWrappedPdf } from '@condo/domains/common/utils/pdf'

type ExportFormat = 'md' | 'pdf' | 'docx'

type ExportMessageOptions = {
    text: string
    format: ExportFormat
    fileNameBase?: string
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
    const { Document, Packer, Paragraph, TextRun } = await import('docx')
    const lines = text.split('\n')
    const paragraphs: InstanceType<typeof Paragraph>[] = []

    lines.forEach((line) => {
        paragraphs.push(new Paragraph({
            children: [new TextRun({ text: line || ' ' })],
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
    element.style.whiteSpace = 'pre-wrap'
    element.textContent = text

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
