import { Typography, Row, Col } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { useRouter } from 'next/router'
import React, { CSSProperties } from 'react'
import Head from 'next/head'
import { useIntl } from '@core/next/intl'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { ContactRoleForm } from '@condo/domains/contact/components/contactRoles/ContactRoleForm'

const ROW_STYLES: CSSProperties = { height: '100%' }
const TITLE_STYLES: CSSProperties = { margin: 0 }
const BIG_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 60]

const UpdateContactRolePage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'ContactRoles.editing' })
    const { query } = useRouter()

    if (Array.isArray(query.id)) {
        return null
    }

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
                            <ContactRoleForm id={query.id as string}/>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

UpdateContactRolePage.requiredAccess = OrganizationRequired

export default UpdateContactRolePage
