import { useOrganization } from '@open-condo/next/organization'
import React, { useEffect } from 'react'
import getConfig from 'next/config'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import { useAuth } from '@open-condo/next/auth'

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
        if (UseDeskWidgetId && isFunction(userIdentify)) userIdentify(
            {
                name: get(link, 'name', undefined),
                email: get(user, 'email', undefined),
                phone: get(user, 'phone', '').slice(1),
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
    }, [link, userIdentify, user])

    return UseDeskWidgetId ?
        <script async src={`//lib.usedesk.ru/secure.usedesk.ru/${UseDeskWidgetId}.js`}></script> : null
}
export default UseDeskWidget
