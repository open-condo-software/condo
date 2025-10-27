import { Row, Col } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { PageComponentType } from '@condo/domains/common/types'
import { ContactRoleForm } from '@condo/domains/contact/components/contactRoles/ContactRoleForm'
import { SettingsReadPermissionRequired } from '@condo/domains/settings/components/PageAccess'


const BIG_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 60]

const UpdateContactRolePage: PageComponentType = () => {
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
                    <Row gutter={BIG_VERTICAL_GUTTER}>
                        <Col span={24}>
                            <Typography.Title level={1}>{PageTitleMsg}</Typography.Title>
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

UpdateContactRolePage.requiredAccess = SettingsReadPermissionRequired

export default UpdateContactRolePage
