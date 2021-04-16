import styled from '@emotion/styled'
import { Empty, Space, Typography } from 'antd'
import { useRouter } from 'next/router'
import { Button } from './Button'
import { EmptyIcon } from './EmptyIcon'
import React from 'react'

const EmptyListViewContainer = styled.div`
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
`

export interface IEmptyListProps {
    label: string,
    message: string,
    createRoute: string,
    createLabel: string
}

export const EmptyListView: React.FC<IEmptyListProps> = ({ label, message, createRoute, createLabel }) => {
    const router = useRouter()
    return (
        <EmptyListViewContainer>
            <Empty
                image={<EmptyIcon />}
                imageStyle={{ height: '120px' }}
                description={
                    <Space direction={'vertical'} size={0}>
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
                    </Space>
                }
            />
        </EmptyListViewContainer>
    )
}