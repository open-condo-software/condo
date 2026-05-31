import { generators } from 'openid-client'
import { v4 as uuidV4 } from 'uuid'

import { getClient } from '~/domains/common/utils/oidcHelper'
import { getSession } from '~/domains/common/utils/session'
import { isSafeUrl } from '~/domains/common/utils/url'

import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
    const session = await getSession(req, res)

    try {
        const { next } = req.query

        if (next && typeof next === 'string' && isSafeUrl(next)) {
            session.nextUrl = next
        } else {
            delete session.nextUrl
        }

        const client = await getClient()
        const checks = { nonce: generators.nonce(), state: generators.state() }
        session.oidcChecks = { ...checks }

        await session.save()

        const redirectUrl = client.authorizationUrl({
            response_type: 'code',
            ...checks,
        })

        res.redirect(302, redirectUrl)
    } catch (error) {
        delete session.oidcChecks
        delete session.accessToken
        delete session.idToken
        delete session.nextUrl
        await session.save()

        const id = uuidV4()
        console.error(`OIDC auth error (id: ${id}):`, error)
        res.status(500).send(`OIDC auth failed (id: ${id})`)
    }
}
