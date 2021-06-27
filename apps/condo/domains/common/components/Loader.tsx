/** @jsx jsx */
import React from 'react'
import { Spin, SpinProps } from 'antd'
import { css, jsx } from '@emotion/core'
import { colors } from '../constants/style'

const DEFAULT_DELAY = 200 // milliseconds

interface ILoaderProps extends SpinProps {
    fill?: boolean
    color?: string
}

export const Loader: React.FC<ILoaderProps> = (props) => {

    const filledContainerStyles = css`
            display:'flex';
            justify-content: 'center';
            align-items: 'center';
            height: '100%';
            width: '100%';
        `

    const coloredSpinnerStyles = css`
        .ant-spin-dot-item {
            background-color: ${props.color};
        }
    `

    console.log(colors)

    const loaderStyles = [coloredSpinnerStyles]

    if (props.fill) {
        loaderStyles.push(filledContainerStyles)
    }

    return (
        <div css={loaderStyles}>
            <Spin {...props}/>
        </div>
    )
}

Loader.defaultProps = {
    fill: false,
    delay: DEFAULT_DELAY,
    color: colors?.sberDefault[5],
}