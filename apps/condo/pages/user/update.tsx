import Head from 'next/head'
import React from 'react'
import get from 'lodash/get'
import { useAuth } from '@core/next/auth'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { UserProfileForm } from '@condo/domains/user/components/UserProfileForm'
import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { ReturnBackHeaderAction } from '@condo/domains/common/components/HeaderActions'

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
                    <UserProfileForm />
                </PageContent>
            </PageWrapper>
        </>
    )
}

UserInfoPage.headerAction = <ReturnBackHeaderAction descriptor={{ id: 'Back' }} path={'/user/'} />
UserInfoPage.requiredAccess = AuthRequired

export default UserInfoPage
