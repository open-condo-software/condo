import React from 'react'

export const CarouselArrow: React.FC<React.HtmlHTMLAttributes<HTMLDivElement>> = (props) => {
    return (
        <div {...props}>
            {/*TODO (DOMA-4666): Move to icons pack*/}
            <svg width='9' height='14' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path d='M1 2.374 5.414 7 1 11.626 2.293 13 8 7 2.293 1 1 2.374Z' fill='currentColor' stroke='currentColor' strokeWidth='.7'/>
            </svg>
        </div>
    )
}