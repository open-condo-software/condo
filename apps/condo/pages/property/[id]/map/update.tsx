/** @jsx jsx */
import React from 'react'
import Head from 'next/head'
import { useIntl } from '@core/next/intl'
import { useRouter } from 'next/router'
import { Row, Col, RowProps } from 'antd'
import { jsx } from '@emotion/react'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageWrapper, PageContent } from '@condo/domains/common/components/containers/BaseLayout'
import CreatePropertyMapForm from '@condo/domains/property/components/PropertyMapForm/CreatePropertyMapForm'
import { CustomScrollbarCss } from '@condo/domains/property/components/panels/Builder/BuildingPanelCommon'


const PAGE_ROW_GUTTER: RowProps['gutter'] = [0, 40]

const CreatePropertyMapPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyTitle' })
    const { query: { id } } = useRouter()

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={PAGE_ROW_GUTTER} css={CustomScrollbarCss}>
                        <Col span={24}>
                            <CreatePropertyMapForm id={id as string} />
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

CreatePropertyMapPage.requiredAccess = OrganizationRequired

export default CreatePropertyMapPage
