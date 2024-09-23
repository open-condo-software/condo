import get from 'lodash/get'
import Head from 'next/head'
import React from 'react'

import { useAuth } from '@open-condo/next/auth'

import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { UserProfileForm } from '@condo/domains/user/components/UserProfileForm'

import type { GetServerSideProps } from 'next'

import { initializeApollo, prepareSSRContext } from '@/lib/apollo'
import { prefetchAuth } from '@/lib/auth'
import { extractSSRState } from '@/lib/ssr'

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

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
    // @ts-ignore In Next 9 the types (only!) do not match the expected types
    const { headers } = prepareSSRContext(req, res)
    const client = initializeApollo({ headers })

    const user = await prefetchAuth(client)

    if (!user) {
        return {
            unstable_redirect: {
                destination: '/auth/signin',
                permanent: false,
            },
        }
    }

    return extractSSRState(client, req, res, {
        props: {},
    })
}
