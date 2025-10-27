interface ICreatePdfOptions {
    element: HTMLElement
    fileName: string
}

interface ICreatePdfWithPageBreaks {
    (options: ICreatePdfOptions): Promise<void>
}

/**
 * Create PDF from HTML element using html2canvas + pdfmake
 * Only works on client side (browser)
 */
export const createWrappedPdf: ICreatePdfWithPageBreaks = async (options) => {
    // Check if running on client side
    if (typeof window === 'undefined') {
        console.warn('createWrappedPdf can only be called on client side')
        return Promise.resolve()
    }

    const { element, fileName } = options
    
    try {
        // Dynamic imports to avoid SSR issues
        const html2canvas = (await import('html2canvas')).default
        const pdfMake = (await import('pdfmake/build/pdfmake')).default
        const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default
        
        // Register fonts
        if (pdfMake && pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
            pdfMake.vfs = pdfFonts.pdfMake.vfs
        }
        
        const pdfWidth = element.clientWidth
        const pdfHeight = element.clientHeight
        
        // Render HTML element to canvas
        const canvas = await html2canvas(element, {
            windowWidth: pdfWidth,
            windowHeight: pdfHeight,
        })
        
        // Convert canvas to base64 image
        const imageData = canvas.toDataURL('image/png')
        
        // Create PDF document with image
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
        
        // Generate and download PDF
        const pdfDocGenerator = pdfMake.createPdf(docDefinition)
        pdfDocGenerator.download(fileName)
        
        return Promise.resolve()
    } catch (error) {
        console.error('Error generating PDF:', error)
        return Promise.reject(error)
    }
}
