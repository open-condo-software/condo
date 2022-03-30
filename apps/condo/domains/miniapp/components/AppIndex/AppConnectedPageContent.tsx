import React, { CSSProperties } from 'react'
import { Typography } from 'antd'
import { TopCard } from '../AppDescription'
import { useIntl } from '@core/next/intl'
import { MarkDown } from '@condo/domains/common/components/MarkDown'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'

interface AppConnectedPageContentProps {
    title: string,
    description: string,
    published: string,
    logoSrc?: string,
    tag?: string,
    developer: string,
    partnerUrl?: string,
    message: string,
}

const CONTAINER_STYLE: CSSProperties = {
    maxHeight: 500,
}

const IMAGE_STYLE: CSSProperties = {
    height: 160,
}

export const AppConnectedPageContent: React.FC<AppConnectedPageContentProps> = ({
    title,
    description,
    published,
    logoSrc,
    tag,
    developer,
    partnerUrl,
    message,
}) => {
    const intl = useIntl()
    const ConnectedMessage = intl.formatMessage({ id: 'Connected' })


    return (
        <>
            <TopCard
                title={title}
                description={description}
                published={published}
                developer={developer}
                partnerUrl={partnerUrl}
                logoSrc={logoSrc}
                tag={tag}
            />
            <BasicEmptyListView
                containerStyle={CONTAINER_STYLE}
                image={'/dino/dino-success.png'}
                imageStyle={IMAGE_STYLE}
            >
                <Typography.Title level={2}>
                    {ConnectedMessage}
                </Typography.Title>
                <MarkDown text={message} fontSize={16}/>
            </BasicEmptyListView>
        </>
    )
}