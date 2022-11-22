import React, { useEffect } from 'react'
import get from 'lodash/get'
import cookie from 'js-cookie'
import getConfig from 'next/config'
import { useOrganization } from '@open-condo/next/organization'

const PopupSmart = (): React.ReactElement | null => {
    const { link } = useOrganization()
    const role = get(link, 'role.nameNonLocalized')

    const { publicRuntimeConfig: { popupSmartUrl } } = getConfig()

    // watch for user role update. This is the way to tell popupsmart local user context
    useEffect(() => {
        if (role) {
            cookie.set('roleName', role)
        } else {
            cookie.remove('roleName')
        }
    }, [role])

    return popupSmartUrl
        ? <script type='text/javascript' src={popupSmartUrl} async></script>
        : null
}

export default PopupSmart
