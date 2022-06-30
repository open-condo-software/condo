import React from 'react'

import { HtmlContent, HtmlContentProps } from '@condo/domains/common/components/HtmlContent'

export const useTicketPropertyHintContent = () => {
    const ref = React.createRef<HTMLDivElement>()
    const [isContentOverflow, setIsContentOverflow] = React.useState(false)

    React.useLayoutEffect(() => {
        if (ref.current) {
            setIsContentOverflow(ref.current.clientHeight + 10 < ref.current.scrollHeight)
        }
    }, [ref])

    return {
        TicketPropertyHintContent: (props: HtmlContentProps) => <HtmlContent {...props} ref={ref}/>,
        isContentOverflow,
    }
}