import { useRouter } from 'next/router'
import { useEffect } from 'react'
import getConfig from 'next/config'

import { YMInitializer } from 'react-yandex-metrika'
import ym from 'react-yandex-metrika'

const YandexMetrika = () => {
    const { publicRuntimeConfig } = getConfig()
    const { yandexMetrikaID } = publicRuntimeConfig

    const router = useRouter()

    useEffect(() => {
        if (yandexMetrikaID) {
            router.events.on('routeChangeComplete', () => {
                ym('hit', window.location.pathname)
            })
        }
    }, [])

    return yandexMetrikaID ? (
        <YMInitializer
            accounts={[yandexMetrikaID]}
            options={{
                defer: true,
                clickmap:true,
                trackLinks:true,
                accurateTrackBounce:true,
                webvisor:true,
            }}
        />

    ) : null
}

export default YandexMetrika
