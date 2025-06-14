import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { get } from 'lodash'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { PageComponentType } from '@condo/domains/common/types'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { TicketPropertyHintContent } from '@condo/domains/ticket/components/TicketPropertyHint/TicketPropertyHintContent'
import { TicketPropertyHint, TicketPropertyHintProperty } from '@condo/domains/ticket/utils/clientSchema'


const BIG_HORIZONTAL_GUTTER: [Gutter, Gutter] = [0, 40]

const PropertyHintPage: PageComponentType = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.property.id.PageTitle' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const PropertyHintMessage = intl.formatMessage({ id: 'pages.condo.settings.hint.ticketPropertyHint' })

    const router = useRouter()
    const propertyId = get(router, ['query', 'id'], null)

    const { loading: propertyLoading, obj: property, error } = Property.useObject({ where: { id: propertyId } })
    const { obj: ticketPropertyHintProperty } = TicketPropertyHintProperty.useObject({
        where: {
            property: { id: propertyId },
            deletedAt: null,
        },
    })
    const ticketPropertyHintId = useMemo(() => get(ticketPropertyHintProperty, ['ticketPropertyHint', 'id'], null), [ticketPropertyHintProperty])

    const { obj: ticketPropertyHint, loading: ticketPropertyHintLoading } = TicketPropertyHint.useObject({
        where: {
            id: ticketPropertyHintId,
        },
    })

    const htmlContent = useMemo(() => get(ticketPropertyHint, 'content'), [ticketPropertyHint])

    if (error || propertyLoading || ticketPropertyHintLoading) {
        return <LoadingOrErrorPage title={PageTitleMsg} loading={propertyLoading} error={error ? ServerErrorMsg : null}/>
    }

    return <>
        <Head>
            <title>{PageTitleMsg}</title>
        </Head>
        <PageWrapper>
            <PageContent>
                <Row>
                    <Col span={18}>
                        <Row gutter={BIG_HORIZONTAL_GUTTER}>
                            <Col span={24}>
                                <Typography.Title>
                                    {PropertyHintMessage} {`${property.address}`}
                                </Typography.Title>
                            </Col>
                            <Col span={24}>
                                <TicketPropertyHintContent
                                    html={htmlContent}
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </PageContent>
        </PageWrapper>
    </>
}

PropertyHintPage.requiredAccess = OrganizationRequired

export default PropertyHintPage
