/** @jsx jsx */
import { get } from 'lodash'
import React from 'react'
import { useIntl } from '@core/next/intl'
import { useRouter } from 'next/router'
import { jsx } from '@emotion/core'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import Head from 'next/head'
import { useObject } from '../../../domains/property/utils/clientSchema/Property'
import { TicketHint } from '../../../domains/ticket/utils/clientSchema'
import { Col, Row, Typography } from 'antd'

const PropertyHintPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.property.id.PageTitle' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })

    const router = useRouter()
    const propertyId = get(router, ['query', 'id'], null)

    const { loading: propertyLoading, obj: property, error } = useObject({ where: { id: propertyId } })
    const { loading: ticketHintLoading, obj: ticketHint } = TicketHint.useObject({
        where: {
            properties_some: { id: propertyId },
        },
    })

    if (error || propertyLoading || ticketHintLoading) {
        return <LoadingOrErrorPage title={PageTitleMsg} loading={propertyLoading} error={error ? ServerErrorMsg : null}/>
    }

    return <>
        <Head>
            <title>{PageTitleMsg}</title>
        </Head>
        <PageWrapper>
            <PageContent>
                <Row gutter={[0, 40]}>
                    <Col span={24}>
                        <Typography.Title>Справка по дому {`${property.address}`}</Typography.Title>
                    </Col>
                    <Col span={24}>
                        <div dangerouslySetInnerHTML={{
                            __html: ticketHint.content,
                        }}/>
                    </Col>
                </Row>
            </PageContent>
        </PageWrapper>
    </>
}

PropertyHintPage.requiredAccess = OrganizationRequired

export default PropertyHintPage
