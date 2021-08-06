import html2canvas from 'html2canvas'
import Jspdf from 'jspdf'
const PDF_FORMAT_SETTINGS = {
    // pdfWidth - width of final image (in mm)
    // pdfHeight - height of final image (in mm)
    // elementOffset - offset of image (in mm)
    // firstLineOffset - margin right for first line (in css pixels)
    // lineSpace - margin right for rest of lines (in css pixels)
    'a4': { pdfWidth: 210, pdfHeight: 297, elementOffset: 10, firstLineOffset: 23, lineSpace: 80 },
    'a5': { pdfWidth: 148, pdfHeight: 210, elementOffset: 10, firstLineOffset: 23, lineSpace: 80 },
}

function getPdfHeightFromElement (element: HTMLElement, expectedWidth: number) {
    const { clientWidth, clientHeight } = element
    const originalRatio = clientHeight / clientWidth
    return expectedWidth * originalRatio
}

function getLine () {
    const line = document.createElement('div')
    line.style.width = '100%'
    line.style.borderTop = '1px solid black'
    return line
}

interface ICreatePdfOptions {
    element: HTMLElement
    fileName: string
    format: string
}

interface ICreatePdf {
    (options: ICreatePdfOptions): Promise<Jspdf>
}

interface ICreatePdfWithPageBreaks {
    (options: Omit<ICreatePdfOptions, 'format'>): Promise<Jspdf>
}

export const createPdf: ICreatePdf = (options) => {
    const {
        element,
        fileName,
        format,
    } = options
    const settings = format in PDF_FORMAT_SETTINGS ? PDF_FORMAT_SETTINGS[format] : PDF_FORMAT_SETTINGS['a4']
    const { pdfWidth, pdfHeight, elementOffset, firstLineOffset, lineSpace } = settings

    // Calculating image ratio
    // Width = pdfWidth - leftOffset - rightOffset = pdfWidth - elementOffset * 2
    // Same for height
    const imageRatio = (pdfHeight - elementOffset * 2) / (pdfWidth - elementOffset * 2)
    // Now let's define what's max css height with this ratio
    const maxElHeight = (element.clientWidth) * imageRatio
    // And how much space in css pixels is left for lines
    let freeSpace = maxElHeight - element.clientHeight - firstLineOffset

    const linesContainer = element.querySelector('#pdfLineInput')
    let linesCounter = 0

    // Adding lines while we have free space
    while (linesContainer && freeSpace > lineSpace / 2) {
        const marginTop = linesCounter > 0 ? lineSpace : firstLineOffset
        const line = getLine()
        line.style.marginTop = `${marginTop}px`
        linesContainer.appendChild(line)
        freeSpace -= lineSpace
        linesCounter++
    }

    const pdfImageHeight = getPdfHeightFromElement(element, pdfWidth)
    return  html2canvas(element).then(canvas => {
        const doc = new Jspdf('p', 'mm', [pdfWidth, pdfHeight])
        const imageOptions = {
            imageData: canvas,
            x: elementOffset,
            y: elementOffset,
            width: pdfWidth - elementOffset * 2,
            height: pdfImageHeight,
        }

        doc.addImage(imageOptions)
        return doc.save(fileName, { returnPromise: true })
    })
}

export const createPdfWithPageBreaks: ICreatePdfWithPageBreaks = (options) => {
    const { element, fileName } = options
    const elementWidth = element.clientWidth
    const elementHeight = element.clientHeight
    const topLeftMargin = 15
    const pdfWidth = elementWidth + (topLeftMargin * 2)
    const pdfHeight = (pdfWidth * 1.5) + (topLeftMargin * 2)

    const totalPDFPages = Math.ceil(elementHeight / pdfHeight) - 1

    return html2canvas(element, { allowTaint: true }).then(canvas => {
        const imgData = canvas.toDataURL('image/jpeg', 1.0)
        const pdf = new Jspdf('p', 'pt',  [pdfWidth, pdfHeight])
        pdf.addImage(imgData, 'JPG', topLeftMargin, topLeftMargin, elementWidth, elementHeight)


        for (let i = 1; i <= totalPDFPages; i++) {
            pdf.addPage([pdfWidth, pdfHeight], 'p')
            pdf.addImage(imgData, 'JPG', topLeftMargin, -(pdfHeight * i) + (topLeftMargin * 4), elementWidth, elementHeight)
        }

        return pdf.save(fileName, { returnPromise: true })
    })
}
