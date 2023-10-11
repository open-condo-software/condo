import { Typography, Row, Col } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { CSSProperties } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { SettingsReadPermissionRequired } from '@condo/domains/settings/components/PageAccess'
import { TicketPropertyHintForm } from '@condo/domains/ticket/components/TicketPropertyHint/TicketPropertyHintForm'

const ROW_STYLES: CSSProperties = { height: '100%' }
const TITLE_STYLES: CSSProperties = { margin: 0 }
const BIG_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 60]

const UpdateTicketPropertyHintPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id:'pages.condo.settings.hint.editTicketPropertyHint' })
    const { query } = useRouter()

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={BIG_VERTICAL_GUTTER} style={ROW_STYLES}>
                        <Col span={24}>
                            <Typography.Title level={1} style={TITLE_STYLES}>{PageTitleMsg}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <TicketPropertyHintForm id={query.id as string}/>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

UpdateTicketPropertyHintPage.requiredAccess = SettingsReadPermissionRequired

export default UpdateTicketPropertyHintPage
