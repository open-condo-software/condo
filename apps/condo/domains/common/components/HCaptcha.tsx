import HCaptcha from '@hcaptcha/react-hcaptcha'
import get from 'lodash/get'
import getConfig from 'next/config'
import React, { createContext, FC, useCallback, useContext, useMemo, useRef } from 'react'

import { useIntl } from '@open-condo/next/intl'


type IHCaptchaContext = {
    executeCaptcha: () => Promise<string>
}

const HCaptchaContext = createContext<IHCaptchaContext>({
    executeCaptcha: async () => '',
})

const useHCaptcha = (): IHCaptchaContext => useContext(HCaptchaContext)

const HCaptchaProvider: FC = ({ children }) => {
    const intl = useIntl()

    const { publicRuntimeConfig: { hCaptcha: hCaptchaConfig, disableCaptcha } } = getConfig()
    const siteKey = useMemo(() => get(hCaptchaConfig, 'SITE_KEY'), [])

    const ref = useRef<HCaptcha>(null)

    const executeCaptcha: IHCaptchaContext['executeCaptcha'] = useCallback(async () => {
        // NOTE: We cannot not send anything when the captcha is turned off, since the captcha field is required
        if (!hCaptchaConfig || !siteKey || disableCaptcha) return 'condo-captcha-disabled'
        if (!ref.current) return

        ref.current.resetCaptcha()

        const result = await ref.current.execute({ async: true })
        return get(result, 'response', '')
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
