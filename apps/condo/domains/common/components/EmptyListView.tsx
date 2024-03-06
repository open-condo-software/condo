import { Empty, EmptyProps, Space } from 'antd'
import React, { CSSProperties } from 'react'

import { EmptyIcon } from './EmptyIcon'


export interface IBasicEmptyListProps extends EmptyProps {
    image?: string
    children?: React.ReactNode
    containerStyle?: CSSProperties,
    imageStyle?: CSSProperties,
    spaceSize?: number,
}

export const DEFAULT_CONTAINER_STYLE: CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
}

// TODO(DOMA-8502): rename component and file to EmptyView
export const BasicEmptyListView: React.FC<IBasicEmptyListProps> = ({
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
                style={{ maxWidth: '350px' }}
                image={image ? image : <EmptyIcon/>}
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