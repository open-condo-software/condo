import { Image } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'
import { useAuth } from '@core/next/auth'
import { Logo } from '@condo/domains/common/components/Logo'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { colors } from '@condo/domains/common/constants/style'
import { Header, MobileHeader } from './styles'


export const AuthHeader: React.FC = () => {
    const { isSmall } = useLayoutContext()
    const router = useRouter()
    const { isAuthenticated } = useAuth()

    const handleLogoClick = useCallback(() => {
        if (isAuthenticated) {
            router.push('/')
        } else {
            router.push('/auth/signin')
        }
    }, [isAuthenticated, router])

    return (
        isSmall
            ? (
                <>
                    <MobileHeader>
                        <Logo fillColor={colors.backgroundLightGrey} onClick={handleLogoClick}/>
                        <Image style={{ maxWidth: '15%' }} src={'/miniPoster.png'}/>
                    </MobileHeader>
                </>
            )
            : (
                <Header
                    title={<Logo fillColor={colors.scampi} onClick={handleLogoClick}/>}
                />
            )
    )
}
