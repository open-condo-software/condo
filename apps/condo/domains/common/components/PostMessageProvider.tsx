import { useRouter } from 'next/router'
import React from 'react'

import { PostMessageProvider as DefaultProvider } from '@open-condo/miniapp-utils/helpers/messaging'

export const PostMessageProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const router = useRouter()

    return (
        <DefaultProvider
            router={router}
        >
            {children}
        </DefaultProvider>
    )
}