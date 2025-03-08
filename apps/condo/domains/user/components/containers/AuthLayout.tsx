import React from 'react'

import { LayoutWithPoster } from '@condo/domains/common/components/containers/LayoutWithPoster'
import { HCaptchaProvider } from '@condo/domains/common/components/HCaptcha'

import { AuthPoster } from './AuthPoster'


export type AuthLayoutProps = {
    headerAction: React.ReactElement
    children: JSX.Element
}


const AuthLayout: React.FC<AuthLayoutProps> = ({ children, headerAction }) => {
    return (
        <HCaptchaProvider>
            <LayoutWithPoster
                children={children}
                headerAction={headerAction}
                Poster={AuthPoster}
            />
        </HCaptchaProvider>
    )
}

export default AuthLayout
