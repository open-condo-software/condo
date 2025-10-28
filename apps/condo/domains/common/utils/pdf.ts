import html2canvas from 'html2canvas'
import pdfMake from 'pdfmake/build/pdfmake'

interface ICreatePdfOptions {
    element: HTMLElement
    fileName: string
}

interface ICreatePdfWithPageBreaks {
    (options: ICreatePdfOptions): Promise<void>
}


export const createWrappedPdf: ICreatePdfWithPageBreaks = async (options) => {
    if (typeof window === 'undefined') {
        console.warn('createWrappedPdf can only be called on client side')
        return
    }

    const { element, fileName } = options
    
    try {
        const pdfWidth = element.clientWidth
        const pdfHeight = element.clientHeight
        const canvas = await html2canvas(element, {
            windowWidth: pdfWidth,
            windowHeight: pdfHeight,
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
