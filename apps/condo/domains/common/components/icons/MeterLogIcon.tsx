import Icon from '@ant-design/icons'
import React from 'react'

const MeterLogSVG = ({ width = 20, height = 20 }) => {
    return (
        <svg width={width} height={height} viewBox='0 0 22 13' xmlns='http://www.w3.org/2000/svg'>
            <path d='M21.313.25h-1.22a.188.188 0 0 0-.187.188V6.25H17.75V2.125a.188.188 0 0 0-.188-.188H9.5v10.126h8.063a.188.188 0 0 0 .187-.188V7.844h2.156v5.718c0 .104.085.188.188.188h1.218a.188.188 0 0 0 .188-.188V.438a.188.188 0 0 0-.188-.188ZM4.25 2.125V6.25H2.094V.437A.188.188 0 0 0 1.906.25H.688A.188.188 0 0 0 .5.438v13.124c0 .104.084.188.188.188h1.218a.188.188 0 0 0 .188-.188V7.845H4.25v4.031c0 .103.084.188.188.188H8V1.937H4.437a.188.188 0 0 0-.187.188Z' fill='currentColor'/>
        </svg>
    )
}

export const MeterLog: React.FC = (props) => {
    return (
        <Icon component={MeterLogSVG} {...props}/>
    )
}
