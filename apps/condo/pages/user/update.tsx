import { ArrowLeftOutlined } from '@ant-design/icons'
import Head from 'next/head'
import React from 'react'
import get from 'lodash/get'
import { useIntl } from '@core/next/intl'
import { useAuth } from '@core/next/auth'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { LinkWithIcon } from '@condo/domains/common/components/LinkWithIcon'
import { colors } from '@condo/domains/common/constants/style'
import { UserProfileForm } from '@condo/domains/user/components/UserProfileForm'

export const UserInfoPage = () => {
    const { user } = useAuth()
    const name = get(user, 'name')

    return (
        <>
            <Head>
                <title>{name}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <OrganizationRequired>
                        <UserProfileForm/>
                    </OrganizationRequired>
                </PageContent>
            </PageWrapper>
        </>
    )
}

const HeaderAction = () => {
    const intl = useIntl()
    const AllTicketsMessage = intl.formatMessage({ id: 'Back' })

    return (
        <LinkWithIcon
            icon={<ArrowLeftOutlined style={{ color: colors.white }}/>}
            path={'/user/'}
        >
            {AllTicketsMessage}
        </LinkWithIcon>
    )
}

UserInfoPage.headerAction = <HeaderAction/>

export default UserInfoPage
