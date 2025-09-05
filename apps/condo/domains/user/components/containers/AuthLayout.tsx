import React from 'react'

import { LayoutWithPoster } from '@condo/domains/common/components/containers/LayoutWithPoster'

import { AuthPoster } from './AuthPoster'


export type AuthLayoutProps = {
    headerAction: React.ReactElement
    children: JSX.Element
}


const AuthLayout: React.FC<AuthLayoutProps> = ({ children, headerAction }) => {
    return (
        <LayoutWithPoster
            children={children}
            headerAction={headerAction}
            Poster={AuthPoster}
        />
    )
}

export default AuthLayout
