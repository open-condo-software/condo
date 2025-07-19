import Icon from '@ant-design/icons'
import React from 'react'

const StoveIconSVG = ({ width = 20, height = 20 }) => (
    <svg width={width} height={height} viewBox='0 0 24 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M18.994 20.61v-1.86H5.006v1.86H1V23h22v-2.39h-4.006zM9.8 15.08c0 1.335.987 2.42 2.2 2.42s2.2-1.085 2.2-2.42c0-.91-1.208-2.841-2.2-4.18-.991 1.339-2.2 3.27-2.2 4.18z' fill='currentColor'/>
        <path d='M7.448 14.94c0-.979.65-2.331 1.99-4.134.934-1.259 2.493-2.95 2.493-2.95s1.559 1.691 2.494 2.95c1.338 1.803 1.989 3.155 1.989 4.135a4.08 4.08 0 01-.27 1.459c1.497-1.155 2.456-2.92 2.456-4.895 0-1.43-1.033-3.545-3.07-6.288C14.057 3.233 12 1 12 1S9.943 3.233 8.47 5.217C6.433 7.96 5.4 10.076 5.4 11.505c0 1.889.877 3.585 2.262 4.74a4.078 4.078 0 01-.214-1.304z' fill='currentColor'/>
    </svg>
)

export const StoveIcon: React.FC = (props) => {
    return (
        <Icon component={StoveIconSVG} {...props}/>
    )
}
