import Head from 'next/head'
import React from 'react'
import get from 'lodash/get'
import { useAuth } from '@core/next/auth'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { UserProfileForm } from '@condo/domains/user/components/UserProfileForm'
import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'

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
                    <UserProfileForm/>
                </PageContent>
            </PageWrapper>
        </>
    )
}

UserInfoPage.requiredAccess = AuthRequired

export default UserInfoPage
