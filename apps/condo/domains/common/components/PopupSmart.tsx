import cookie from 'js-cookie'
import get from 'lodash/get'
import isNull from 'lodash/isNull'
import getConfig from 'next/config'
import { useEffect, useRef } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

const PopupSmart = (): null => {
    const { user } = useAuth()
    const { link } = useOrganization()

    const scriptRef = useRef<HTMLScriptElement | null>(null)

    const role = get(link, 'role.nameNonLocalized', false)
    const userIsNotStaff = !(get(user, 'isAdmin', false) || get(user, 'isSupport', false))

    const { publicRuntimeConfig: { popupSmartUrl } } = getConfig()

    // watch for user role update. This is the way to tell popupsmart local user context
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // We don't want to share support or admin user's
            if (role && userIsNotStaff && popupSmartUrl) {
                cookie.set('roleName', role)

                // If script is not loaded yet -> add it to the body section
                // Placing script in render section not fire it's loading. That was fixed at nextjs v11 with next/script
                if (isNull(scriptRef.current)) {
                    const scriptElement = document.createElement('script')
                    scriptElement.async = false
                    scriptElement.src = popupSmartUrl

                    document.querySelector('body').appendChild(scriptElement)

                    scriptRef.current = scriptElement
                }

            } else {
                cookie.remove('roleName')
            }
        }
    }, [role, userIsNotStaff, popupSmartUrl])

    return null
}

export default PopupSmart
