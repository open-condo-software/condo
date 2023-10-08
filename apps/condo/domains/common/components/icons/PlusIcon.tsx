import Icon from '@ant-design/icons'
import React from 'react'

const IconSVG = () => {
    return (
        <svg width='18' height='18' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path fillRule='evenodd' clipRule='evenodd' d='M10 3H8v5H3v2h5v5h2v-5h5V8h-5V3Z' fill='currentColor'/>
        </svg>
    )
}

export const PlusIcon: React.FC = (props) => {
    return (
        <Icon component={IconSVG} {...props}/>
    )
}
