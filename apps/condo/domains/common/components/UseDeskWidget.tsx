import cookie from 'js-cookie'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import set from 'lodash/set'
import getConfig from 'next/config'
import React, { useEffect, useMemo } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'


const { publicRuntimeConfig:{ UseDeskWidgetId } } = getConfig()
const useDeskFieldsIdsMap = {
    tin: 20560,
    role: 20574,
    organizationName: 20572,
}

const getUsedeskMessenger = () => {
    if (typeof window === 'undefined') {
        return null
    }

    return get(window, 'usedeskMessenger', null)
}

const UseDeskWidget: React.FC = () => {
    const { link } = useOrganization()
    const { user } = useAuth()

    const messenger = useMemo(() => getUsedeskMessenger(), [])
    const userIdentify = useMemo(() => get(messenger, 'userIdentify', null), [messenger])

    useEffect(() => {
        try {
            if (UseDeskWidgetId && isFunction(userIdentify) && typeof window !== 'undefined') {
                const name = get(link, 'name')
                const email = get(user, 'email')
                const phone = get(user, 'phone')

                set(window, '__widgetInitCallback', (widget) => {
                    const token = cookie.get('usedeskChatToken')

                    const baseData = {
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
                    }

                    widget.userIdentify(token ? { ...baseData, token } : baseData)
                })

                set(window, '__usedeskWidgetFirstClientMessageCallback', () => {
                    const token = messenger.getChatToken()

                    cookie.set('usedeskChatToken', token, { expires: 2 })
                })
            }
        } catch (e) {
            console.error('Failed to load widget "UseDesk"', e)
        }
    }, [link, userIdentify, user, messenger])

    return UseDeskWidgetId ?
        <script async src={`//lib.usedesk.ru/secure.usedesk.ru/${UseDeskWidgetId}.js`}></script> : null
}
export default UseDeskWidget
