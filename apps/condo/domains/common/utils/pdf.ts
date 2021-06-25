import html2canvas from 'html2canvas'
import Jspdf from 'jspdf'

function getPdfHeightFromElement (element: HTMLElement, expectedWidth: number) {
    const { clientWidth, clientHeight } = element
    const originalRatio = clientHeight / clientWidth
    return expectedWidth * originalRatio
}

function getLine () {
    const line = document.createElement('div')
    // line.style.width = 'calc(100% + 48px)'
    line.style.width = '100%'
    // line.style.margin = '0 -24px'
    line.style.borderTop = '1px solid black'
    return line
}

interface ICreatePdfOptions {
    element: HTMLElement
    fileName: string
}

export function createPdf (options: ICreatePdfOptions) {
    const {
        element,
        fileName,
    } = options
    const pdfWidth = 400
    const elementOffset = 20
    const firstLineOffset = 23
    const lineSpace = 80

    const maxElHeight = (element.clientWidth + 40) * Math.sqrt(2)
    let freeSpace = maxElHeight - element.clientHeight - firstLineOffset

    const linesContainer = element.querySelector('#pdfLineInput')
    let linesCounter = 0

    while (linesContainer && freeSpace > elementOffset) {
        const marginTop = linesCounter > 0 ? lineSpace : firstLineOffset
        const line = getLine()
        line.style.marginTop = `${marginTop}px`
        linesContainer.appendChild(line)
        freeSpace -= lineSpace
        linesCounter++
    }

    const pdfHeight = getPdfHeightFromElement(element, pdfWidth)
    return  html2canvas(element).then(canvas => {
        const doc = new Jspdf('p', 'px')
        const imageOptions = {
            imageData: canvas,
            x: elementOffset,
            y: elementOffset,
            width: pdfWidth,
            height: pdfHeight,
        }

        doc.addImage(imageOptions)
        return doc.save(fileName, { returnPromise: true })
    })
}

