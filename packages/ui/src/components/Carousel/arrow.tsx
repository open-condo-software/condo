import React from 'react'
import { ChevronRight } from '@open-condo/icons'

export const CarouselArrow: React.FC<React.HtmlHTMLAttributes<HTMLDivElement>> = (props) => {
    return (
        <div {...props}>
            <ChevronRight
            />
        </div>
    )
}