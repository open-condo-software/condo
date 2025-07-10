import { Row, Col } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { PageComponentType } from '@condo/domains/common/types'
import { TicketReadAndManagePermissionRequired } from '@condo/domains/ticket/components/PageAccess'
import { TicketForm } from '@condo/domains/ticket/components/TicketForm'


const WRAPPER_GUTTER: Gutter | [Gutter, Gutter] = [0, 60]

const CreateTicketPage: PageComponentType = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id:'pages.condo.ticket.index.CreateTicketModalTitle' })

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={WRAPPER_GUTTER}>
                        <Col span={24}>
                            <Typography.Title level={1}>{PageTitleMsg}</Typography.Title>
                        </Col>
                        <TicketForm/>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

CreateTicketPage.requiredAccess = TicketReadAndManagePermissionRequired

export default CreateTicketPage
