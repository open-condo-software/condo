import { Card as DefaultCard, CardProps as DefaultCardProps } from 'antd'
import { CardWrapper, CardWrapperProps } from './CardWrapper'
import React from 'react'

type CardProps = CardWrapperProps & DefaultCardProps

export const Card: React.FC<CardProps> = ({ disabled, children, ...otherCardProps }) => {
    return (
        <CardWrapper disabled={disabled}>
            <DefaultCard {...otherCardProps}>
                {children}
            </DefaultCard>
        </CardWrapper>
    )
}