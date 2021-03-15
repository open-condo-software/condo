import Head from 'next/head'
import React from 'react'
import styled from '@emotion/styled'
import { useIntl } from '@core/next/intl'
import { PageContent, PageHeader, PageWrapper } from '../../containers/BaseLayout'
import { OrganizationRequired } from '../../containers/OrganizationRequired'
import { TicketForm } from '../../containers/TicketForm'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { Typography, Space } from 'antd'
import { Button } from '../../components/Button'
import { colors } from '../../constants/style'
import { useRouter } from 'next/router'

const CreateTicketPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id:'pages.condo.ticket.index.CreateTicketModalTitle' })

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={PageTitleMsg}/>
                <PageContent>
                    <OrganizationRequired>
                        <TicketForm/>
                    </OrganizationRequired>
                </PageContent>
            </PageWrapper>
        </>
    )
}

const IconContainer = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${colors.lightGrey[5]};
  border-radius: 8px;
`

const StyledButton = styled(Button)`
  padding: 0;
  height: 24px;
  
  &:hover {
    .icon {
      border: 1px solid ${colors.lightGrey[6]};
      background-color: ${colors.lightGrey[6]};
    }
  }
`

const HeaderAction = () => {
    const intl = useIntl()
    const router = useRouter()

    return (
        <StyledButton type='link' onClick={() => router.push('/ticket/')}>
            <Space size={16}>
                <IconContainer className='icon'>
                    <ArrowLeftOutlined style={{ color: colors.white }}/>
                </IconContainer>
                <Typography.Text className='text' style={{ fontSize: '12px' }}>
                    {intl.formatMessage({ id: 'menu.AllTickets' })}
                </Typography.Text>
            </Space>
        </StyledButton>
    )
}

CreateTicketPage.headerAction = <HeaderAction/>

export default CreateTicketPage
