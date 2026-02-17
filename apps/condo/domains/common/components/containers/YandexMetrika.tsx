import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import ym, { YMInitializer } from 'react-yandex-metrika'


import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'


const YandexMetrika = () => {
    const { publicRuntimeConfig } = getConfig()
    const { yandexMetrikaID } = publicRuntimeConfig

    const { user } = useAuth()
    const { organization, link } = useOrganization()
    const userId = user?.id
    const organizationId = organization?.id
    const role = link?.role

    const router = useRouter()

    useEffect(() => {
        if (!yandexMetrikaID) return

        const userParams = omitBy({
            UserID: userId,
            organizationId,
            roleName: role?.name,
            roleNameNonLocalized: role?.nameNonLocalized,
        }, isNil)
        ym('userParams', userParams)
    }, [organizationId, role, userId, yandexMetrikaID])

    useEffect(() => {
        if (!yandexMetrikaID) return
    
        ym('hit', window.location.href)
    
        const routeChangeComplete = () => {
            ym('hit', window.location.pathname)
        }
    
        router.events.on('routeChangeComplete', routeChangeComplete)
    
        return () => {
            router.events.off('routeChangeComplete', routeChangeComplete)
        }
    }, [router.events, yandexMetrikaID])

    return yandexMetrikaID ? (
        <YMInitializer
            accounts={[yandexMetrikaID]}
            options={{
                defer: true,
                clickmap: true,
                trackLinks: true,
                accurateTrackBounce: true,
                webvisor: false,
            }}
        />
    ) : null
}

export default YandexMetrika
