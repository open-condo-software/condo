import { Card as AntdCard, CardProps as DefaultCardProps } from 'antd'
import React from 'react'

import { CardWrapper, CardWrapperProps } from './CardWrapper'

type CardProps = CardWrapperProps & DefaultCardProps

export const Card: React.FC<CardProps> = ({ disabled, children, ...otherCardProps }) => {
    return (
        <CardWrapper disabled={disabled}>
            <AntdCard {...otherCardProps}>
                {children}
            </AntdCard>
        </CardWrapper>
    )
}