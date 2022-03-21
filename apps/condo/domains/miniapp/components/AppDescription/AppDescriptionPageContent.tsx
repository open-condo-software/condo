import React from 'react'
import { Col, Row } from 'antd'
import { TopCard } from './TopCard'
import { AboutCard } from './AboutCard'
import dayjs from 'dayjs'

export const AppDescriptionPageContent: React.FC = () => {
    return (
        <Row gutter={[0, 60]}>
            <Col span={24}>
                <TopCard
                    developer={'SBERlonglonglonglonglonglonglong'}
                    published={dayjs().toISOString()}
                    // description={'123'}
                    description={'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci autem blanditiis consectetur ea eaque ipsum, magnam minus, modi molestias nisi nobis numquam perferendis quos recusandae ut velit voluptas voluptatem! Quos.'}
                    // title={'asd'}
                    title={'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci autem blanditiis consectetur ea eaque ipsum, magnam minus, modi molestias nisi nobis numquam perferendis quos recusandae ut velit voluptas voluptatem! Quos.'}
                    setupUrl={'https://spotify.com'}
                    partnerUrl={'https://spotify.com'}
                    // logoSrc={'https://github.com/SavelevMatthew/SavelevMatthew/blob/main/media/github.jpg'}
                    tag={'Биллинг'}
                />
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