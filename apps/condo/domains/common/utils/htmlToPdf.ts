import Jspdf, { ImageOptions, jsPDFOptions } from 'jspdf'
import html2canvas from 'html2canvas'

type FormatSettingType = {
    pdfWidth: number
    pdfHeight: number
    elementOffset: number
    firstLineOffset: number
    lineSpace: number
}

const PDF_FORMAT_SETTINGS: Record<'a4' | 'a5', FormatSettingType> = {
    // pdfWidth - width of final image (in mm)
    // pdfHeight - height of final image (in mm)
    // elementOffset - offset of image (in mm)
    // firstLineOffset - margin right for first line (in css pixels)
    // lineSpace - margin right for rest of lines (in css pixels)
    'a4': { pdfWidth: 210, pdfHeight: 297, elementOffset: 10, firstLineOffset: 23, lineSpace: 80 },
    'a5': { pdfWidth: 148, pdfHeight: 210, elementOffset: 10, firstLineOffset: 23, lineSpace: 80 },
}

type IPdfOptions = Pick<jsPDFOptions, 'orientation'> & { format: string }


class HtmlToPdf {
    private options: IPdfOptions
    private readonly splitter: HTMLElement
    private readonly settings: FormatSettingType
    private doc: Jspdf
    private countParts: number

    constructor (options: IPdfOptions, splitter: HTMLElement) {
        const format = options.format || 'a5'

        this.options = options
        this.splitter = splitter
        this.settings = format in PDF_FORMAT_SETTINGS ? PDF_FORMAT_SETTINGS[format] : PDF_FORMAT_SETTINGS['a5']
        this.doc = new Jspdf({ ...options, unit: 'mm' })
        this.countParts = 0
    }

    private static getPdfHeightFromElement (block: HTMLElement, expectedWidth: number) {
        const { clientWidth, clientHeight } = block
        const originalRatio = clientHeight / clientWidth
        return expectedWidth * originalRatio
    }

    private addHeader (headerData: { canvas: HTMLCanvasElement, block: HTMLElement }, pdfWidth: number) {
        const pdfImageHeight = HtmlToPdf.getPdfHeightFromElement(headerData.block, pdfWidth)

        const imageOptions: ImageOptions = {
            imageData: headerData.canvas,
            x: 0,
            y: 0,
            width: pdfWidth,
            height: pdfImageHeight,

        }

        this.doc.addImage(imageOptions)

        return pdfImageHeight
    }

    private async addFooter (footerData: { canvas: HTMLCanvasElement, block: HTMLElement }, pdfWidth: number, pdfHeight: number, page: number) {
        const { block } = footerData

        const pageNumber = block.querySelector('#pageNumber')
        pageNumber.cloneNode()
        pageNumber.textContent = String(page)

        const canvas = await html2canvas(block)

        const pdfImageHeight = HtmlToPdf.getPdfHeightFromElement(block, pdfWidth)

        const imageOptions: ImageOptions = {
            imageData: canvas,
            x: 0,
            y: pdfHeight - pdfImageHeight,
            width: pdfWidth,
            height: pdfImageHeight,
        }

        this.doc.addImage(imageOptions)
    }

    private addSplitter (splitData: { canvas: HTMLCanvasElement, block: HTMLElement }, pdfWidth: number) {
        const pdfImageHeight = HtmlToPdf.getPdfHeightFromElement(splitData.block, pdfWidth)

        const imageOptions: ImageOptions = {
            imageData: splitData.canvas,
            x: pdfWidth - 0.2,
            y: 0,
            width: 0.2,
            height: pdfImageHeight,
        }

        this.doc.addImage(imageOptions)
    }

    private splitByPages (data: { canvas: HTMLCanvasElement, block: HTMLElement }[], headerData: { canvas: HTMLCanvasElement, block: HTMLElement }, footerData: { canvas: HTMLCanvasElement, block: HTMLElement }, maxImageHeight: number, pdfWidth: number) {
        const dataByPages: { canvas: HTMLCanvasElement, block: HTMLElement }[][] = []
        const stack = [...data]
        const headerHeight = HtmlToPdf.getPdfHeightFromElement(headerData.block, pdfWidth)
        const footerHeight = HtmlToPdf.getPdfHeightFromElement(footerData.block, pdfWidth)
        const maxHeight = maxImageHeight - headerHeight - footerHeight

        let height = 0
        const byPage: { canvas: HTMLCanvasElement, block: HTMLElement }[] = []
        for (const item of stack) {
            const { block } = item
            const elementHeight = HtmlToPdf.getPdfHeightFromElement(block, pdfWidth)
            if (height + elementHeight > maxHeight && byPage.length !== 0) {
                height = 0
                dataByPages.push([...byPage])
                byPage.splice(0, byPage.length)
            }
            height += elementHeight
            byPage.push(item)
        }
        dataByPages.push([...byPage])
        byPage.splice(0, byPage.length)

        return dataByPages
    }

    private mergeCanvases (canvases: HTMLCanvasElement[]) {
        const resultCanvas = document.createElement('canvas')
        resultCanvas.height = canvases.reduce((prev, cur) => prev + cur.height, 0)
        resultCanvas.width = canvases[0].width
        const ctx = resultCanvas.getContext('2d')
        let height = 0
        canvases.forEach((canvas) => {
            ctx.drawImage(canvas, 0, height)
            height += canvas.height
        })
        return resultCanvas
    }

    async addPart (blocks: HTMLElement[], header: HTMLElement, footer: HTMLElement): Promise<void> {
        const { pdfWidth, pdfHeight } = this.settings

        try {
            const data: { canvas: HTMLCanvasElement, block: HTMLElement }[] = []

            for (const block of blocks) {
                const canvas = await html2canvas(block)
                data.push({ canvas, block })
            }
            const headerData = { canvas: await html2canvas(header), block: header }
            const footerData = { canvas: await html2canvas(footer), block: footer }
            const splitterData = { canvas: await html2canvas(this.splitter), block: this.splitter }

            const dataByPages = this.splitByPages(data, headerData, footerData, pdfHeight, pdfWidth)

            let page = 1
            for (const dataPage of dataByPages) {
                if (page !== 1 || this.countParts > 0) {
                    this.doc.addPage()
                }

                const mergedCanvas = this.mergeCanvases(dataPage.map(item => item.canvas))
                const pdfImageHeight = dataPage.reduce((prev, cur) => prev + HtmlToPdf.getPdfHeightFromElement(cur.block, pdfWidth), 0)
                const headerHeight = this.addHeader(headerData, pdfWidth)
                const imageOptions = {
                    imageData: mergedCanvas,
                    x: 0,
                    y: headerHeight,
                    width: pdfWidth,
                    height: pdfImageHeight,
                }
                this.doc.addImage(imageOptions)
                await this.addFooter(footerData, pdfWidth, pdfHeight, page)
                this.addSplitter(splitterData, pdfWidth)
                page++
            }

            this.countParts++
        } catch (e) {
            console.log(e)
        }
    }

    save (fileName: string): Promise<void> {
        return this.doc.save(`${fileName}.pdf`, { returnPromise: true })
    }
}

export {
    HtmlToPdf,
}
