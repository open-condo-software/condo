import { Empty, Space, Typography } from 'antd'
import { useRouter } from 'next/router'
import { Button } from './Button'
import { EmptyIcon } from './EmptyIcon'
import React from 'react'
export interface IEmptyListProps {
    label: string,
    message: string,
    createRoute: string,
    createLabel: string
}

export interface IBasicEmptyListProps {
    image?: string
    children?: React.ReactNode
}

export const BasicEmptyListView: React.FC<IBasicEmptyListProps> = ({ image, children } ) => {
    const style = { 
        display:'flex', 
        width: '100%', 
        height: '100%', 
        justifyContent: 'center', 
        alignItems: 'center',
    }
    return (
        <div style={style}>
            <Empty
                image={ image ? image : <EmptyIcon />}
                imageStyle={{ height: '120px' }}
                description={
                    <Space direction={'vertical'} size={0}>
                        { children }
                    </Space>
                }
            />
        </div>
    )
}


export const EmptyListView: React.FC<IEmptyListProps> = ({ label, message, createRoute, createLabel }) => {
    const router = useRouter()
    return (
        <BasicEmptyListView>
            <Typography.Title level={3}>
                {label}
            </Typography.Title>
            <Typography.Text style={{ fontSize: '16px' }}>
                {message}
            </Typography.Text>
            <Button
                type='sberPrimary'
                style={{ marginTop: '16px' }}
                onClick={() => router.push(createRoute)}
            >
                {createLabel}
            </Button>
        </BasicEmptyListView>
    )
}

export default EmptyListView
