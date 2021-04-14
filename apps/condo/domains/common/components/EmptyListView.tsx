import styled from '@emotion/styled'
import { Empty, Space, Typography } from 'antd'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
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
    title: string,
    text: string,
    createRoute: string,
    createLabel: string
}

export const EmptyListView: React.FC<IEmptyListProps> = ({ title, text, createRoute, createLabel }) => {
    const intl = useIntl()
    const router = useRouter()

    const EmptyListHeader = intl.formatMessage({ id: title })
    const EmptyListTitle = intl.formatMessage({ id: text })
    const CreateLabel = intl.formatMessage({ id: createLabel })

    return (
        <EmptyListViewContainer>
            <Empty
                image={<EmptyIcon />}
                imageStyle={{ height: '120px' }}
                description={
                    <Space direction={'vertical'} size={0}>
                        <Typography.Title level={3}>
                            {EmptyListHeader}
                        </Typography.Title>
                        <Typography.Text style={{ fontSize: '16px' }}>
                            {EmptyListTitle}
                        </Typography.Text>
                        <Button
                            type='sberPrimary'
                            style={{ marginTop: '16px' }}
                            onClick={() => router.push(createRoute)}
                        >
                            {CreateLabel}
                        </Button>
                    </Space>
                }
            />
        </EmptyListViewContainer>
    )
}