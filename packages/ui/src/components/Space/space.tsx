import { Space as DefaultSpace } from 'antd'
import React from 'react'

import type { SpaceProps as DefaultSpaceProps } from 'antd'

declare const SpaceSize: [8, 12, 16, 20, 24, 40, 52, 60]

export type SpaceProps = {
    size: typeof SpaceSize[number] | [typeof SpaceSize[number], typeof SpaceSize[number]]
    width?: React.CSSProperties['width']
} & Pick<DefaultSpaceProps, 'direction' | 'align' | 'wrap'>

const SPACE_CLASS_PREFIX = 'condo-space'

const Space: React.FC<SpaceProps> = (props) => {
    const { width } = props
    return <DefaultSpace prefixCls={SPACE_CLASS_PREFIX} {...props} style={{ width }} />
}

export { Space }
