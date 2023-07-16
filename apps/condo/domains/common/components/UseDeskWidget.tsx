import cookie from 'js-cookie'
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

const CHAT_ID_COOKIE_NAME = 'use-desk-chat-id'

function getChatIdFromCookies () {
    console.log('>> getChatIdFromCookies', cookie.get(CHAT_ID_COOKIE_NAME))
    return cookie.get(CHAT_ID_COOKIE_NAME) || null
}

function setChatIdToCookies (token) {
    console.log('<< setChatIdToCookies', token)

    cookie.set(CHAT_ID_COOKIE_NAME, token, { expires: 30 })
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
        if (typeof window !== 'undefined') {
            console.log('INIT INIT, __usedeskWidgetInitedCallback')
            // @ts-ignore
            window.__usedeskWidgetInitedCallback = function () {
                console.log('МУМУ 2')
            }
            window['__usedeskWidgetInitedCallback'] = function () {
                console.log('INIT HAPPENS!')
                console.log('INIT NEW CHAT')
                try {
                    const token = window['usedeskMessenger'].getChatToken()
                    setChatIdToCookies(token)
                } catch {
                    console.log('Failed to save current chatId to cookies')
                }
            }
        }
    }, [])
    useEffect(() => {
        try {
            if (UseDeskWidgetId && isFunction(userIdentify)) {
                const token = getChatIdFromCookies()
                const name = get(link, 'name')
                const email = get(user, 'email')
                const phone = get(user, 'phone')
                console.log('OPEN CHAT WITH TOKEN: ', token, token ? 'YES': 'NO')
                userIdentify({
                    name,
                    email,
                    phone: typeof phone === 'string' ? phone.slice(1) : phone,
                    ...token ? { token } : {},
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
        <script async src={`//lib.usedesk.ru/secure.usedesk.ru/${UseDeskWidgetId}.js`} ></script> : null
}
export default UseDeskWidget
