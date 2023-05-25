import Icon from '@ant-design/icons'
import React from 'react'

interface DownloadProps {
    width?: number | string
    height?: number | string
}

export const DownloadIconSvg: React.FC<DownloadProps> = ({ width = 12, height = 8 }) => {
    return (
        <svg width='17' height='16' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path fillRule='evenodd' clipRule='evenodd' stroke='currentColor' fill='currentColor' d='M9.17 2a.67.67 0 0 0-1.34 0v6.39l-2.2-2.2a.67.67 0 1 0-.94.95l3.34 3.33a.66.66 0 0 0 .94 0l3.33-3.33a.67.67 0 1 0-.94-.94l-2.2 2.19V2ZM2.5 9.33c.37 0 .67.3.67.67v2.67a.67.67 0 0 0 .66.66h9.34a.67.67 0 0 0 .66-.66V10a.67.67 0 0 1 1.34 0v2.67a2 2 0 0 1-2 2H3.83a2 2 0 0 1-2-2V10c0-.37.3-.67.67-.67Z'/>
        </svg>
    )
}

export const DownloadIcon: React.FC<DownloadProps> = (props) => {
    return (
        <Icon component={DownloadIconSvg} {...props}/>
    )
}