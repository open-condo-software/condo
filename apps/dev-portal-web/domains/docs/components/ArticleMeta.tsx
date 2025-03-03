import { NextSeo } from 'next-seo'
import React from 'react'

type PageMetaProps = {
    title: string
}

export const ArticleMeta: React.FC<PageMetaProps> = ({ title }) => {
    return (
        <NextSeo
            openGraph={{
                title,
            }}
        />
    )
}

