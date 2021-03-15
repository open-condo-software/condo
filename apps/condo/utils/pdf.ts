function getPdfHeightFromElement (element:HTMLElement, expectedWidth:number) {
    const { clientWidth, clientHeight } = element
    const originalRatio = clientHeight/clientWidth
    return expectedWidth * originalRatio
}

interface ICreatePdfOptions {
    element: HTMLElement
    fileName: string
}

export function createPdf (options:ICreatePdfOptions) {
    const {
        element,
        fileName,
    } = options

    return Promise.all([
        import('html2canvas'),
        import('jspdf'),
    ]).then(([html2canvas, jspdf]) => {
        html2canvas.default(element).then(canvas => {
            const doc = new jspdf.default('p', 'px')
            const pdfWidth = 400
            const elementOffset = 20
            const imageOptions = {
                imageData: canvas,
                x: elementOffset,
                y: elementOffset,
                width: pdfWidth,
                height: getPdfHeightFromElement(element, pdfWidth),
            }

            doc.addImage(imageOptions)
            return doc.save(fileName, { returnPromise: true })
        })
    })
}

