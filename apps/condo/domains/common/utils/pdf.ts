import html2canvas from 'html2canvas'
import pdfMake from 'pdfmake/build/pdfmake'

interface ICreatePdfOptions {
    element: HTMLElement
    fileName: string
}

interface ICreatePdf {
    (options: ICreatePdfOptions): Promise<void>
}


export const createWrappedPdf: ICreatePdf = async (options) => {
    if (typeof window === 'undefined') {
        console.warn('createWrappedPdf can only be called on client side')
        return
    }

    const { element, fileName } = options
    
    try {
        const pixelWidth = element.clientWidth
        const pixelHeight = element.clientHeight
        const pdfWidth = pixelWidth * 0.75
        const pdfHeight = pixelHeight * 0.75

        const canvas = await html2canvas(element, {
            windowWidth: pixelWidth,
            windowHeight: pixelHeight,
        })
        const imageData = canvas.toDataURL('image/png')
        
        
        const docDefinition = {
            pageSize: {
                width: pdfWidth,
                height: pdfHeight,
            },
            pageMargins: [0, 0, 0, 0],
            content: [
                {
                    image: imageData,
                    width: pdfWidth,
                    height: pdfHeight,
                },
            ],
        }
        const pdfDocGenerator = pdfMake.createPdf(docDefinition)
        pdfDocGenerator.download(fileName)
    } catch (error) {
        console.error('Error generating PDF:', error)
    }
}
