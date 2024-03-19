import HCaptcha from '@hcaptcha/react-hcaptcha'
import get from 'lodash/get'
import getConfig from 'next/config'
import React, { createContext, FC, useCallback, useContext, useRef } from 'react'

import { useIntl } from '@open-condo/next/intl'


type IHCaptchaContext = {
    executeCaptcha: () => Promise<string>
}

const HCaptchaContext = createContext<IHCaptchaContext>({
    executeCaptcha: async () => '',
})

const useHCaptcha = (): IHCaptchaContext => useContext(HCaptchaContext)


const { publicRuntimeConfig: { hCaptcha } } = getConfig()

const HCaptchaProvider: FC = ({ children }) => {
    const intl = useIntl()

    const ref = useRef<HCaptcha>(null)

    const executeCaptcha: IHCaptchaContext['executeCaptcha'] = useCallback(async () => {
        if (!ref.current) return

        ref.current.resetCaptcha()

        const result = await ref.current.execute({ async: true })
        return get(result, 'response', '')
    }, [])

    return (
        <HCaptchaContext.Provider value={{
            executeCaptcha,
        }}>
            <HCaptcha
                sitekey={hCaptcha && hCaptcha.SITE_KEY}
                languageOverride={intl.locale}
                size='invisible'
                loadAsync={true}
                reCaptchaCompat={false}
                sentry={false}
                ref={ref}
            />
            {children}
        </HCaptchaContext.Provider>
    )
}

export {
    useHCaptcha,
    HCaptchaProvider,
}
