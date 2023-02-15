import { Space as DefaultSpace } from 'antd'
import React, { CSSProperties } from 'react'

import type { SpaceProps as DefaultSpaceProps } from 'antd'

export declare const SpaceSize: [8, 12, 16, 20, 24, 40, 52, 60]

export type SpaceProps = {
    width?: CSSProperties['width']
    height?: CSSProperties['height']
    size: typeof SpaceSize[number] | [typeof SpaceSize[number], typeof SpaceSize[number]]
} & Pick<DefaultSpaceProps, 'direction' | 'align' | 'wrap' | 'children'>

const SPACE_CLASS_PREFIX = 'condo-space'

const Space: React.FC<SpaceProps> = ({ width, height, ...restProps }) => {
    return <DefaultSpace prefixCls={SPACE_CLASS_PREFIX} {...restProps} style={{ width, height }}/>
}

export { Space }
