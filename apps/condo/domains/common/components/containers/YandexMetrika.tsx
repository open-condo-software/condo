import getConfig from 'next/config'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import ym, { YMInitializer } from 'react-yandex-metrika'


const YandexMetrika = () => {
    const { publicRuntimeConfig } = getConfig()
    const { yandexMetrikaID } = publicRuntimeConfig

    const router = useRouter()

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
