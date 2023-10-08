import React from 'react'

export const Cross: React.FC<React.HtmlHTMLAttributes<HTMLDivElement>> = (props) => {
    return (
        <div {...props}>
            {/*TODO (DOMA-4666): Move to icons pack*/}
            <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'>
                <path d='M8 8L16 16' stroke='#222222' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/>
                <path d='M16 8L8 16' stroke='#222222' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/>
            </svg>
        </div>
    )
}