/* eslint-disable */
import getConfig from 'next/config'
import { v4 as uuidV4 } from 'uuid'

import { getClient } from '~/domains/common/utils/oidcHelper'
import { getSession } from '~/domains/common/utils/session'

import type { NextApiRequest, NextApiResponse } from 'next'

const { publicRuntimeConfig: { serviceUrl } } = getConfig()

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
    const session = await getSession(req, res)

    try {
        const idToken = session.idToken
        session.destroy()

        if (!idToken) {
            res.redirect(302, '/auth/signin')
            return
        }

        const client = await getClient()
        const endSessionUrl = client.endSessionUrl({
            id_token_hint: idToken,
            post_logout_redirect_uri: `${serviceUrl}/auth/signin`,
        })

        res.redirect(302, endSessionUrl)
    } catch (error) {
        const id = uuidV4()
        console.error(`OIDC logout error (id: ${id}):`, error)
        res.status(500).send(`OIDC logout failed (id: ${id})`)
    }
}
