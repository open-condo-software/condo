import classNames from 'classnames'
import React from 'react'

import { ChevronRight } from '@open-condo/icons'

type ArrowControlProps = React.HtmlHTMLAttributes<HTMLDivElement> & {
    type: 'next' | 'prev'
    size?: 'large' | 'small'
}

const CONTROL_PREFIX = 'condo-control'

export const ArrowControl: React.FC<ArrowControlProps> = (props) => {
    const { className: originalClassName, size = 'large', type, ...restProps } = props
    const className = classNames(originalClassName, {
        [CONTROL_PREFIX]: true,
        [`${CONTROL_PREFIX}-${type}`]: type,
        [`${CONTROL_PREFIX}-${size}`]: size,
    })
    const iconSize = size === 'large' ? 'medium' : 'small'

    return (
        <div {...restProps} className={className}>
            <ChevronRight size={iconSize}/>
        </div>
    )
}