import React, { CSSProperties } from 'react'
import {
    Tag as DefaultTag,
} from 'antd'
import { colors } from '@open-condo/ui/src/colors'

const TAG_CLASS_PREFIX = 'condo-tag'

export type TagProps = React.HTMLAttributes<HTMLSpanElement> & {
    children: string
    textColor?: CSSProperties['color']
    bgColor?: CSSProperties['backgroundColor']
}

const Tag = React.forwardRef<HTMLSpanElement, TagProps>((props, ref) => {
    const {
        children,
        textColor = colors.gray['7'],
        bgColor = colors.gray['1'],
    } = props

    return (
        <DefaultTag
            children={children}
            prefixCls={TAG_CLASS_PREFIX}
            ref={ref}
            style={{
                color: textColor,
                backgroundColor: bgColor,
            }}
        />
    )
})

Tag.displayName = 'Tag'

export {
    Tag,
}