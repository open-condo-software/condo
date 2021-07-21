import React from 'react'
import Head from 'next/head'
import { useIntl } from '@core/next/intl'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { EditContactForm } from '@condo/domains/contact/components/EditContactForm'
import { useRouter } from 'next/router'
import { LinkWithIcon } from '@condo/domains/common/components/LinkWithIcon'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { colors } from '@condo/domains/common/constants/style'
import get from 'lodash/get'

const ContactUpdatePage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'EditingContact' })

    return (
        <>
            <Head>
                <title>
                    {PageTitle}
                </title>
            </Head>
            <PageWrapper>
                <OrganizationRequired>
                    <PageContent>
                        <EditContactForm/>
                    </PageContent>
                </OrganizationRequired>
            </PageWrapper>
        </>
    )
}

const HeaderAction = () => {
    const intl = useIntl()
    const BackButtonLabel = intl.formatMessage({ id: 'Back' })
    const { query } = useRouter()

    return (
        <LinkWithIcon
            icon={<ArrowLeftOutlined style={{ color: colors.white }}/>}
            path={`/contact/${get(query, 'id')}/`}
        >
            {BackButtonLabel}
        </LinkWithIcon>
    )
}

ContactUpdatePage.headerAction = <HeaderAction/>

export default ContactUpdatePage