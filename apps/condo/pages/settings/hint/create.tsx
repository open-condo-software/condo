import { Row, Col } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { PageComponentType } from '@condo/domains/common/types'
import { SettingsReadPermissionRequired } from '@condo/domains/settings/components/PageAccess'
import { TicketPropertyHintForm } from '@condo/domains/ticket/components/TicketPropertyHint/TicketPropertyHintForm'


const BIG_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 60]

const CreateTicketPropertyHintPage: PageComponentType = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.settings.hint.newTicketPropertyHint' })

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={BIG_VERTICAL_GUTTER}>
                        <Col span={24}>
                            <Typography.Title level={1}>{PageTitleMsg}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <TicketPropertyHintForm/>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

CreateTicketPropertyHintPage.requiredAccess = SettingsReadPermissionRequired

export default CreateTicketPropertyHintPage
