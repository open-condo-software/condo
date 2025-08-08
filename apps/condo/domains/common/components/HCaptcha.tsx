import HCaptcha from '@hcaptcha/react-hcaptcha'
import { notification } from 'antd'
import get from 'lodash/get'
import getConfig from 'next/config'
import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'

import { makeId } from '@condo/domains/common/utils/makeid.utils'


type IHCaptchaContext = {
    executeCaptcha: () => Promise<string>
}

const HCaptchaContext = createContext<IHCaptchaContext>({
    executeCaptcha: async () => '',
})

const useHCaptcha = (): IHCaptchaContext => useContext(HCaptchaContext)

const HCaptchaProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const intl = useIntl()
    const requestFailedMessage = intl.formatMessage({ id: 'global.errors.requestFailed.title' })
    const OkMessage = intl.formatMessage({ id: 'OK' })

    const { publicRuntimeConfig: { hCaptcha: hCaptchaConfig, disableCaptcha } } = getConfig()
    const siteKey = useMemo(() => get(hCaptchaConfig, 'SITE_KEY'), [])

    const ref = useRef<HCaptcha>(null)

    const executeCaptcha: IHCaptchaContext['executeCaptcha'] = useCallback(async () => {
        // NOTE: We cannot not send anything when the captcha is turned off, since the captcha field is required
        if (!hCaptchaConfig || !siteKey || disableCaptcha) return makeId(48)
        if (!ref.current) return

        ref.current.resetCaptcha()

        try {
            const result = await ref.current.execute({ async: true })
            return get(result, 'response', '')
        } catch (error) {
            console.error({ msg: 'failed to get captcha token', error })
            notification.error({
                message: requestFailedMessage,
                description: (
                    <Button
                        type='primary'
                        onClick={() => {
                            notification.destroy()
                        }}>
                        {OkMessage}
                    </Button>
                ),
            })
            throw error
        }
    }, [])

    return (
        <HCaptchaContext.Provider value={{
            executeCaptcha,
        }}>
            {
                siteKey && !disableCaptcha && (
                    <HCaptcha
                        sitekey={siteKey}
                        languageOverride={intl.locale}
                        size='invisible'
                        loadAsync={true}
                        reCaptchaCompat={false}
                        sentry={false}
                        ref={ref}
                    />
                )
            }
            {children}
        </HCaptchaContext.Provider>
    )
}

export {
    useHCaptcha,
    HCaptchaProvider,
}
