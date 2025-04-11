import { Row } from 'antd'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageComponentType } from '@condo/domains/common/types'
import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import { CreateOrganizationPageContent } from '@condo/domains/organization/components/CreateOrganizationPageContent'
import AuthLayout from '@condo/domains/user/components/containers/AuthLayout'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'


const CreateOrganizationPage: PageComponentType = () => {
    const intl = useIntl()
    const CreateOrganizationTitle = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationModalTitle' })

    return (
        <>
            <Head><title>{CreateOrganizationTitle}</title></Head>
            <Row>
                <ResponsiveCol desktopWidth='350px'>
                    <CreateOrganizationPageContent />
                </ResponsiveCol>
            </Row>
        </>
    )
}
CreateOrganizationPage.container = AuthLayout
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