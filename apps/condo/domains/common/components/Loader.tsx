import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { Spin, SpinProps } from 'antd'
import React from 'react'

import { colors } from '../constants/style'

const DEFAULT_DELAY = 200 // milliseconds

const FilledLoaderContainer = styled.section`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
`

interface ILoaderProps extends SpinProps {
    fill?: boolean
}

export const Loader: React.FC<ILoaderProps> = (props) => {
    const { fill, ...other } = props
    // We need this to recolor antd spinner. It's not easily configurable from theme
    const coloredSpinnerStyles = css`
        .ant-spin-dot-item {
            background-color: ${colors.sberDefault[5]};
        }
    `

    if (fill) {
        return (
            <FilledLoaderContainer css={coloredSpinnerStyles}>
                <Spin {...other} />
            </FilledLoaderContainer>
        )
    }

    return (
        <section css={coloredSpinnerStyles}>
            <Spin {...other}/>
        </section>
    )
}

Loader.defaultProps = {
    fill: false,
    delay: DEFAULT_DELAY,
}