/** @jsx jsx */
import React from 'react'
import { Spin, SpinProps } from 'antd'
import { css, jsx } from '@emotion/core'
import { colors } from '../constants/style'
import styled from '@emotion/styled'

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
    color?: string
}

export const Loader: React.FC<ILoaderProps> = (props) => {

    // We need this to recolor antd spinner. It's not easily configurable from theme
    const coloredSpinnerStyles = css`
        .ant-spin-dot-item {
            background-color: ${props.color};
        }
    `

    if (props.fill) {
        return (
            <FilledLoaderContainer css={coloredSpinnerStyles}>
                <Spin {...props}/>
            </FilledLoaderContainer>
        )
    }

    return (
        <section css={coloredSpinnerStyles}>
            <Spin {...props}/>
        </section>
    )
}

Loader.defaultProps = {
    fill: false,
    delay: DEFAULT_DELAY,
    color: colors.sberDefault[5],
}