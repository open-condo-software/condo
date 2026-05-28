import { Empty, EmptyProps, Space } from 'antd'
import React, { CSSProperties } from 'react'

import { EmptyIcon } from '~/domains/common/components/containers/EmptyIcon'

export interface IEmptyProps extends EmptyProps {
    image?: string
    children?: React.ReactNode
    containerStyle?: CSSProperties
    imageStyle?: CSSProperties
    spaceSize?: number
}

export const DEFAULT_CONTAINER_STYLE: CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
}

// TODO(DOMA-8502): rename component and file to EmptyView
export const EmptyView: React.FC<IEmptyProps> = ({
    image,
    children,
    containerStyle,
    spaceSize,
    imageStyle,
    ...other
}) => {
    return (
        <div style={{ ...DEFAULT_CONTAINER_STYLE, ...containerStyle }}>
            <Empty
                style={{ maxWidth: '390px' }}
                image={image ? image : <EmptyIcon />}
                imageStyle={{ height: '200px', ...imageStyle }}
                description={
                    <Space direction='vertical' size={spaceSize || 0}>
                        {children}
                    </Space>
                }
                {...other}
            />
        </div>
    )
}
