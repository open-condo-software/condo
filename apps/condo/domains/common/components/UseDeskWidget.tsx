import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import getConfig from 'next/config'
import React, { useEffect } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

const { publicRuntimeConfig:{ UseDeskWidgetId } } = getConfig()
const useDeskFieldsIdsMap = {
    tin: 20560,
    role: 20574,
    organizationName: 20572,
}

const getUserIdentify = () => {
    if (typeof window === 'undefined') {
        return null
    }

    return get(window, ['usedeskMessenger', 'userIdentify'], null)
}

const UseDeskWidget: React.FC = () => {
    const { link } = useOrganization()
    const { user } = useAuth()

    const userIdentify = getUserIdentify()

    useEffect(() => {
        try {
            if (UseDeskWidgetId && isFunction(userIdentify)) {
                const name = get(link, 'name')
                const email = get(user, 'email')
                const phone = get(user, 'phone')
                userIdentify({
                    name,
                    email,
                    phone: typeof phone === 'string' ? phone.slice(1) : phone,
                    additional_fields:
                        [
                            {
                                id: useDeskFieldsIdsMap.tin, value: get(link, ['organization', 'tin'], null),
                            },
                            {
                                id: useDeskFieldsIdsMap.organizationName, value: get(link, ['organization', 'name'], null),
                            },
                            {
                                id: useDeskFieldsIdsMap.role, value: get(link, ['role', 'name'], null),
                            },
                        ],
                })
            }
        } catch (e) {
            console.error('Failed to load widget "UseDesk"', e)
        }
    }, [link, userIdentify, user])

    return UseDeskWidgetId ?
        <script async src={`//lib.usedesk.ru/secure.usedesk.ru/${UseDeskWidgetId}.js`}></script> : null
}
export default UseDeskWidget
