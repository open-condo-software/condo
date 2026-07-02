import { Document, Packer, Paragraph, TextRun } from 'docx'

import { createWrappedPdf } from '@condo/domains/common/utils/pdf'
import { stripMarkdown } from '@condo/domains/common/utils/stripMarkdown'

const AI_EXPORT_FILE_NAME_PREFIX = 'ai-answer'
const AI_EXPORT_PDF_PADDING_PX = 24
const PLAIN_TEXT_MIME = 'text/plain;charset=utf-8'
const DOCX_LINE_BREAK = '\n'
const EMPTY_DOCX_LINE_PLACEHOLDER = ' '

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
    return `${AI_EXPORT_FILE_NAME_PREFIX}-${timestamp}`
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
    const blob = new Blob([text], { type: PLAIN_TEXT_MIME })
    downloadBlob(blob, `${fileNameBase}.txt`)
}

async function exportDocx (text: string, fileNameBase: string): Promise<void> {
    const lines = text.split(DOCX_LINE_BREAK)
    const paragraphs: InstanceType<typeof Paragraph>[] = []

    lines.forEach((line) => {
        paragraphs.push(new Paragraph({
            children: [new TextRun({ text: line || EMPTY_DOCX_LINE_PLACEHOLDER })],
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

async function exportPdf (sourceElement: HTMLElement, fileNameBase: string): Promise<void> {
    const wrapper = document.createElement('div')
    wrapper.style.boxSizing = 'content-box'
    wrapper.style.padding = `${AI_EXPORT_PDF_PADDING_PX}px`
    wrapper.style.background = '#ffffff'
    wrapper.style.position = 'fixed'
    wrapper.style.left = '-10000px'
    wrapper.style.top = '0'
    wrapper.style.width = `${sourceElement.scrollWidth}px`

    const clone = sourceElement.cloneNode(true) as HTMLElement
    wrapper.appendChild(clone)
    document.body.appendChild(wrapper)

    try {
        await createWrappedPdf({
            element: wrapper,
            fileName: `${fileNameBase}.pdf`,
        })
    } finally {
        document.body.removeChild(wrapper)
    }
}

export async function exportAIMessage (options: ExportAIMessageOptions): Promise<void> {
    if (typeof window === 'undefined') return

    const safeFileNameBase = options.fileNameBase || createFileNameBase()

    if (options.format === 'txt') {
        if (!options.text) return
        const plainText = stripMarkdown(options.text, { collapseLineBreaks: false })
        await exportPlainText(plainText, safeFileNameBase)
        return
    }

    if (options.format === 'docx') {
        if (!options.text) return
        const plainText = stripMarkdown(options.text, { collapseLineBreaks: false })
        await exportDocx(plainText, safeFileNameBase)
        return
    }

    const { pdfSourceElement } = options
    if (!pdfSourceElement) return

    await exportPdf(pdfSourceElement, safeFileNameBase)
}
