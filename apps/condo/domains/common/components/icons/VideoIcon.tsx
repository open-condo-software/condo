import Icon from '@ant-design/icons'
import React from 'react'

const VideoIconSVG = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <g clipPath='url(#clip0_16087_112421)'>
            <rect width='24' height='24' fill='#F2F3F7'/>
            <path d='M11.641 5.56703L17.6424 9.48863C19.4543 10.6726 19.4543 13.3273 17.6424 14.5113L11.641 18.433C9.64567 19.7368 6.99997 18.3052 6.99997 15.9216V8.07838C6.99997 5.69479 9.64567 4.26315 11.641 5.56703Z' stroke='black' strokeWidth='2'/>
        </g>
        <defs>
            <clipPath id='clip0_16087_112421'>
                <rect width='24' height='24' fill='white'/>
            </clipPath>
        </defs>
    </svg>
)

export const VideoIcon: React.FC = (props) => {
    return (
        <Icon component={VideoIconSVG} {...props}/>
    )
}