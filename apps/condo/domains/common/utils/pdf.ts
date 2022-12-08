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

interface ICreatePdfOptions {
    element: HTMLElement
    fileName: string
    format: string
}

interface ICreatePdfWithPageBreaks {
    (options: Omit<ICreatePdfOptions, 'format'>): Promise<void | Jspdf>
}

export const createPdfWithPageBreaks: ICreatePdfWithPageBreaks = (options) => {
    const { element, fileName } = options
    const { elementOffset } = PDF_FORMAT_SETTINGS.a4

    return html2canvas(element).then(canvas => {
        const imgData = canvas.toDataURL('image/jpeg', 1.0)

        // Default page size is a4
        const pdf = new Jspdf('landscape')
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()
        const imgHeight = getPdfHeightFromElement(element, pdfWidth)

        let heightLeft = imgHeight + elementOffset * 2
        let position = 0
        let page = 1
        pdf.addImage(imgData, 'JPG', elementOffset, elementOffset + position, pdfWidth, imgHeight)
        heightLeft -= pdfHeight

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight + elementOffset * page
            pdf.addPage([pdfWidth, pdfHeight], 'landscape')
            pdf.addImage(imgData, 'JPG', elementOffset, position, pdfWidth, imgHeight)
            heightLeft -= (pdfHeight - elementOffset * page)
            page++
        }

        return pdf.save(fileName, { returnPromise: true })
    })
}

export const createWrappedPdf: ICreatePdfWithPageBreaks = (options) => {
    const { element, fileName } = options
    const pdfWidth = element.clientWidth
    const pdfHeight = element.clientHeight
    return html2canvas(element, {
        windowWidth: pdfWidth,
        windowHeight: pdfHeight,
    }).then(canvas => {
        const doc = new Jspdf('p', 'px', [pdfWidth, pdfHeight])
        const imageOptions = {
            imageData: canvas,
            x: 0,
            y: 0,
            width: pdfWidth,
            height: pdfHeight,
        }
        doc.addImage(imageOptions)
        return doc.save(fileName, { returnPromise: true })
    })
}
