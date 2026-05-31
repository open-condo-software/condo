import getConfig from 'next/config'
import { v4 as uuidV4 } from 'uuid'

import { getClient } from '~/domains/common/utils/oidcHelper'
import { getSession } from '~/domains/common/utils/session'

import type { NextApiRequest, NextApiResponse } from 'next'

const { publicRuntimeConfig: { serviceUrl } } = getConfig()

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
    const session = await getSession(req, res)

    try {
        const client = await getClient()
        const params = client.callbackParams(req)
        const checks = { ...session?.oidcChecks }

        delete session.oidcChecks

        const redirectUrl = `${serviceUrl}/api/oidc/callback`
        const tokenSet = await client.callback(redirectUrl, params, checks)

        const accessToken = tokenSet.access_token
        const idToken = tokenSet.id_token

        if (!accessToken || !idToken) {
            throw new Error('No OIDC tokens in callback response!')
        }

        session.accessToken = accessToken
        session.idToken = idToken

        const nextUrl = session?.nextUrl || '/'
        if (session?.nextUrl) delete session.nextUrl

        await session.save()
        res.redirect(302, nextUrl)
    } catch (error) {
        delete session.oidcChecks
        delete session.accessToken
        delete session.idToken
        delete session.nextUrl
        await session.save()

        const id = uuidV4()
        console.error(`OIDC callback error (id: ${id}):`, error)
        res.status(500).send(`OIDC callback failed (id: ${id})`)
    }
}
