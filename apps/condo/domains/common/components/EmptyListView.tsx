import styled from '@emotion/styled'
import { Empty, Space, Typography } from 'antd'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import { Button } from './Button'
import { EmptyIcon } from './EmptyIcon'

const EmptyListViewContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
`
export const EmptyListView = () => {
    const intl = useIntl()
    const router = useRouter()

    return (
        <EmptyListViewContainer>
            <Empty
                image={<EmptyIcon/>}
                imageStyle={{ height: '120px' }}
                description={
                    <Space direction={'vertical'} size={0}>
                        <Typography.Title level={3}>
                            {intl.formatMessage({ id: 'ticket.EmptyList.header' })}
                        </Typography.Title>
                        <Typography.Text style={{ fontSize: '16px' }}>
                            {intl.formatMessage({ id: 'ticket.EmptyList.title' })}
                        </Typography.Text>
                        <Button
                            type='sberPrimary'
                            style={{ marginTop: '16px' }}
                            onClick={() => router.push('/ticket/create')}
                        >
                            {intl.formatMessage({ id: 'CreateTicket' })}
                        </Button>
                    </Space>
                }
            />
        </EmptyListViewContainer>
    )
}