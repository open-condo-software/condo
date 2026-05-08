import { createWrappedPdf } from '@condo/domains/common/utils/pdf'

export type ExportAIMessageFormat = 'txt' | 'pdf' | 'docx'

export type ExportAIMessageTxtOptions = {
    format: 'txt'
    text: string
    fileNameBase?: string
}

export type ExportAIMessageDocxOptions = {
    format: 'docx'
    text: string
    fileNameBase?: string
}

export type ExportAIMessagePdfOptions = {
    format: 'pdf'
    pdfSourceElement: HTMLElement
    fileNameBase?: string
}

export type ExportAIMessageOptions =
    | ExportAIMessageTxtOptions
    | ExportAIMessageDocxOptions
    | ExportAIMessagePdfOptions

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

async function exportPlainText (text: string, fileNameBase: string): Promise<void> {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    downloadBlob(blob, `${fileNameBase}.txt`)
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

export async function exportAIMessage (options: ExportAIMessageOptions): Promise<void> {
    if (typeof window === 'undefined') return

    const safeFileNameBase = options.fileNameBase || createFileNameBase()

    if (options.format === 'txt') {
        if (!options.text) return
        await exportPlainText(options.text, safeFileNameBase)
        return
    }

    if (options.format === 'docx') {
        if (!options.text) return
        await exportDocx(options.text, safeFileNameBase)
        return
    }

    const { pdfSourceElement } = options
    if (!pdfSourceElement) return

    await createWrappedPdf({
        element: pdfSourceElement,
        fileName: `${safeFileNameBase}.pdf`,
    })
}
