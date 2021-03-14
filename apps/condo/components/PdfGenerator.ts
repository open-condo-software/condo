import React, { useCallback } from 'react'
import { notification } from 'antd'
import { useIntl } from '@core/next/intl'

function getPdfHeightFromElement (element:HTMLElement, expectedWidth:number) {
    const { clientWidth, clientHeight } = element
    const originalRatio = clientHeight/clientWidth

    return expectedWidth * originalRatio
}

interface ICreatePdfOptions {
    element: HTMLElement
    fileName: string
}

function createPdf (options:ICreatePdfOptions) {
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
            doc.save(fileName)
        })
    })
}

interface IChildrenRenderProps {
    generatePdf:() => void
    loading:boolean
}

interface IPdfGeneratorProps {
    elementRef: React.RefObject<HTMLElement>,
    fileName: string,
    children: (args: IChildrenRenderProps) => React.ReactElement
}

export const PdfGenerator:React.FunctionComponent<IPdfGeneratorProps> = (props) => {
    const intl = useIntl()
    const [ loading, setLoading ] = React.useState(false)
    const { elementRef, children, fileName } = props

    const generatePdf = useCallback(() => {
        setLoading(true)

        createPdf({ element: elementRef.current, fileName })
            .then(() => {
                setLoading(false)
            })
            .catch((e) => {
                notification.error({
                    message: intl.formatMessage(({ id: 'errors.PdfGenerationError' })),
                    description: e.message,
                })

                setLoading(false)
            })

    }, [elementRef])

    return children({ generatePdf, loading })
}
