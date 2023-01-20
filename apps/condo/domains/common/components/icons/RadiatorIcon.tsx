import Icon from '@ant-design/icons'
import React from 'react'

const RadiatorIconSVG = ({ width = 20, height = 20 }) => (
    <svg width={width} height={height} viewBox='0 0 24 22' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M8.263 1L6.429 5.583h1.975L10.237 1H8.263zM12.846 1l-1.833 4.583h1.975L14.82 1h-1.975zM17.43 1l-1.834 4.583h1.975L19.404 1H17.43zM23 11.083V9.25h-1.604v-.917a1.833 1.833 0 10-3.667 0v.917h-1.375v-.917a1.833 1.833 0 10-3.666 0v.917h-1.376v-.917a1.833 1.833 0 00-3.666 0v.917H6.27v-.917a1.833 1.833 0 00-3.667 0v.917H1v1.833h1.604v7.334H1v1.833h1.604v.917a1.833 1.833 0 003.667 0v-.917h1.375v.917a1.833 1.833 0 003.667 0v-.917h1.375v.917a1.833 1.833 0 003.666 0v-.917h1.375v.917a1.833 1.833 0 003.667 0v-.917H23v-1.833h-1.604v-7.334H23zM6.27 18.417v-7.334h1.376v7.334H6.27zm5.043 0v-7.334h1.374v7.334h-1.374zm6.416 0h-1.375v-7.334h1.375v7.334z' fill='currentColor'/>
    </svg>
)

export const RadiatorIcon: React.FC = (props) => {
    return (
        <Icon component={RadiatorIconSVG} {...props}/>
    )
}