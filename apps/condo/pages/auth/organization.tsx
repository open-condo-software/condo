import { Col, Row } from 'antd'
import Head from 'next/head'
import React, { CSSProperties } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageComponentType } from '@condo/domains/common/types'
import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import { CreateOrganizationPageContent } from '@condo/domains/organization/components/CreateOrganizationPageContent'
import AuthLayout from '@condo/domains/user/components/containers/AuthLayout'
import { WelcomeHeaderTitle } from '@condo/domains/user/components/UserWelcomeTitle'


const ORGANIZATION_FORM_WRAPPER_STYLES: CSSProperties = { maxWidth: '350px' }

const CreateOrganizationPage: PageComponentType = () => {
    const intl = useIntl()
    const CreateOrganizationTitle = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationModalTitle' })

    return (
        <>
            <Head><title>{CreateOrganizationTitle}</title></Head>
            <Row>
                <Col style={ORGANIZATION_FORM_WRAPPER_STYLES}>
                    <CreateOrganizationPageContent />
                </Col>
            </Row>
        </>
    )
}
CreateOrganizationPage.container = AuthLayout
CreateOrganizationPage.headerAction = <WelcomeHeaderTitle userType='staff'/>
CreateOrganizationPage.getPrefetchedData = async ({ context, activeEmployee }) => {
    const next = context?.query?.next
    const redirectUrl = (next && !Array.isArray(next) && isSafeUrl(next)) ? next : '/'

    if (activeEmployee) {
        return {
            redirect: {
                destination: redirectUrl,
                permanent: false,
            },
        }
    }

    return {
        props: {},
    }
}

export default CreateOrganizationPage