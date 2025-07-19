import get from 'lodash/get'
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
    const userId = get(user, 'id')
    const organizationId = get(organization, 'id')
    const role = get(link, 'role')

    const router = useRouter()

    useEffect(() => {
        if (!yandexMetrikaID) return

        const userParams = omitBy({
            UserID: userId,
            organizationId,
            roleName: get(role, 'name'),
            roleNameNonLocalized: get(role, 'nameNonLocalized'),
        }, isNil)
        ym('userParams', userParams)
    }, [organizationId, role, userId, yandexMetrikaID])

    const routeChangeComplete = () => {
        ym('hit', window.location.pathname)
    }

    useEffect(() => {
        if (yandexMetrikaID) {
            router.events.on('routeChangeComplete', routeChangeComplete)
        }

        return () => {
            router.events.off('routeChangeComplete', routeChangeComplete)
        }
    }, [yandexMetrikaID])

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
