import conf from '@open-condo/config'

import type { NextApiRequest, NextApiResponse } from 'next'

const RESIDENT_APP_DOMAIN = conf['RESIDENT_APP_DOMAIN']

export default function handler (req: NextApiRequest, res: NextApiResponse): void {
    if (!RESIDENT_APP_DOMAIN) {
        res.status(500).json({ error: 'RESIDENT_APP_DOMAIN is not configured' })
        return
    }

    res.status(200).json({ residentAppDomain: RESIDENT_APP_DOMAIN })
}
