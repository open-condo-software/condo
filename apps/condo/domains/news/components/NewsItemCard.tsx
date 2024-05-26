import React from 'react'

import { Card, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

type NewsItemCardProps = {
    icon: string,
    appName: string,
    title: string,
    body: string,
}

export const NewsItemCard: React.FC<NewsItemCardProps> = ({ icon, appName, title, body }) => {

    return (
        <div style={{ marginRight: '25px', minHeight: '275px' }}>
            <Card
                title={(
                    <>
                        <img src={icon} style={{ marginBottom: '5px', width: '24px', height: '24px' }}  alt='App icon'/>
                        <Typography.Title level={3}>{ appName }</Typography.Title>
                    </>
                )}
                width={400}
            >
                <div style={{ color: colors.gray[7] }}>
                    <div style={{ marginBottom: '16px' }}>
                        <Typography.Paragraph>
                            <b>Заголовок</b><br/>
                            { title }
                        </Typography.Paragraph>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <Typography.Paragraph
                            ellipsis={{
                                rows: 6,
                            }}
                        >
                            <b>Текст новости</b><br/>
                            { body }
                        </Typography.Paragraph>
                    </div>
                </div>
            </Card>
        </div>
    )
}
