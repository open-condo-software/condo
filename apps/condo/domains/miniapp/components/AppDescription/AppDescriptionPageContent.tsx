import React from 'react'
import { Col, Row, Typography } from 'antd'
import { TopCard } from './TopCard'
import { AboutCard } from './AboutCard'
import { useIntl } from '@core/next/intl'
import { MarkDown } from '@condo/domains/common/components/MarkDown'

interface AppDescriptionPageContentProps {
    title: string,
    description: string,
    published: string,
    logoSrc?: string,
    tag?: string,
}

export const AppDescriptionPageContent: React.FC<AppDescriptionPageContentProps> = ({
    title,
    description,
    published,
    logoSrc,
    tag,
}) => {
    const intl = useIntl()
    const HowToSetupMessage = intl.formatMessage({ id: 'services.HowToSetup' })
    return (
        <Row gutter={[0, 60]}>
            <Col span={24}>
                <TopCard
                    title={title}
                    description={description}
                    published={published}
                    developer={'SBERlonglonglonglonglonglonglong'}
                    partnerUrl={'https://spotify.com'}
                    logoSrc={logoSrc}
                    tag={tag}
                />
            </Col>
            <Col span={24}>
                <Row gutter={[0, 40]}>
                    <Col span={24}>
                        <Typography.Title level={4}>
                            {HowToSetupMessage}
                        </Typography.Title>
                    </Col>
                    <Col span={24}>
                        <MarkDown text={'markdown'}/>
                    </Col>
                </Row>
            </Col>
            <Col span={24}>
                <AboutCard
                    blocks={[
                        { title: 'Я очень большо большой большой заголовок', imageSrc: 'https://low-code-platforms.ru/wp-content/uploads/2021/05/product-bpm-desktop-screen-1-1.png', description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci autem blanditiis consectetur ea eaque ipsum, magnam minus, modi molestias nisi nobis numquam perferendis quos recusandae ut velit voluptas voluptatem! Quos.' },
                        { title: 'Я вертикальный', imageSrc: 'https://sun9-54.userapi.com/impf/pgXDVTFUkJ3cTdg5hu11n3LqMXAOHGJ0tgnI4Q/zuu0W_hRj1s.jpg?size=1369x2024&quality=96&sign=6841ec70d715e7087c85482ef4459e2d&type=album', description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci autem blanditiis consectetur ea eaque ipsum, magnam minus, modi molestias nisi nobis numquam perferendis quos recusandae ut velit voluptas voluptatem! Quos.' },
                        { title: 'Я очень большо большой большой заголовок', imageSrc: 'https://low-code-platforms.ru/wp-content/uploads/2021/05/product-bpm-desktop-screen-1-1.png', description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci autem blanditiis consectetur ea eaque ipsum, magnam minus, modi molestias nisi nobis numquam perferendis quos recusandae ut velit voluptas voluptatem! Quos.' },
                        { title: 'Я очень большо большой большой заголовок', imageSrc: 'https://low-code-platforms.ru/wp-content/uploads/2021/05/product-bpm-desktop-screen-1-1.png', description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci autem blanditiis consectetur ea eaque ipsum, magnam minus, modi molestias nisi nobis numquam perferendis quos recusandae ut velit voluptas voluptatem! Quos.' },
                    ]}
                />
            </Col>

        </Row>
    )
}