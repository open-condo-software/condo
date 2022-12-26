type FillTemplateArgs = {
    componentName: string
    jsx: string
}

export const fillTemplate = (args: FillTemplateArgs): string => `/** This file is auto-generated, do not edit it manually **/
import React from 'react'
import { IconWrapper, IconProps } from '../wrappers'

export const ${args.componentName}: React.FC<IconProps> = ({ svgProps: props, ...restProps }) => {
    return (
        <IconWrapper
            icon={
                ${args.jsx}
            }
            {...restProps}
        />
    )
}
`

