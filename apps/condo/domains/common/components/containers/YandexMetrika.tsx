import getConfig from 'next/config'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import ym, { YMInitializer } from 'react-yandex-metrika'

const YandexMetrika = () => {
    const { publicRuntimeConfig } = getConfig()
    const { yandexMetrikaID } = publicRuntimeConfig

    const router = useRouter()

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
                clickmap:true,
                trackLinks:true,
                accurateTrackBounce:true,
                webvisor:true,
            }}
        />

    ) : null
}

export default YandexMetrika
