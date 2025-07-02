import getConfig from 'next/config'
import { DefaultSeo } from 'next-seo'
import React from 'react'
import { useIntl } from 'react-intl'

const { publicRuntimeConfig: { serviceUrl } } = getConfig()

export const SeoProvider: React.FC = () => {
    const intl = useIntl()
    const ServiceName = intl.formatMessage({ id: 'global.service.name' })

    return (
        <DefaultSeo
            description={ServiceName}
            openGraph={{
                type: 'website',
                locale: intl.locale,
                description: ServiceName,
                url: serviceUrl,
                siteName: ServiceName,
                images: [
                    {
                        url: `${serviceUrl}/og.jpg`,
                        width: 1146,
                        height: 600,
                        alt: 'Og Image Alt',
                        type: 'image/jpeg',
                    },
                ],
            }}
        />
    )
}