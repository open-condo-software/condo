import React from 'react'
import { Col, Row, Typography } from 'antd'
import { TopCard } from './TopCard'
import { AboutCard } from './AboutCard'
import dayjs from 'dayjs'
import { useIntl } from '@core/next/intl'
import { MarkDown } from '@condo/domains/common/components/MarkDown'

const markdown = `A paragraph with *emphasis* and **strong importance**.
# Заголовок 1
## Заголовок 2
### Заголовок 3
#### Заголовок 4
##### Заголовок 5
> Цитата ~зачеркнуто~ и [ссылка](https://reactjs.org).

* список
* [ ] todo
* [x] done
\`\`\`
Блок кода
\`\`\`
A table:

**Жирный** и *курсив*

Список:
1. First item
2. Second item
3. Third item
4. Fourth item

`

export const AppDescriptionPageContent: React.FC = () => {
    const intl = useIntl()
    const HowToSetupMessage = intl.formatMessage({ id: 'services.HowToSetup' })
    return (
        <Row gutter={[0, 60]}>
            <Col span={24}>
                <TopCard
                    developer={'SBERlonglonglonglonglonglonglong'}
                    published={dayjs().toISOString()}
                    description={'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci autem blanditiis consectetur ea eaque ipsum, magnam minus, modi molestias nisi nobis numquam perferendis quos recusandae ut velit voluptas voluptatem! Quos.'}
                    title={'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci autem blanditiis consectetur ea eaque ipsum, magnam minus, modi molestias nisi nobis numquam perferendis quos recusandae ut velit voluptas voluptatem! Quos.'}
                    partnerUrl={'https://spotify.com'}
                    // logoSrc={'https://github.com/SavelevMatthew/SavelevMatthew/blob/main/media/github.jpg'}
                    tag={'Биллинг'}
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
                        <MarkDown text={markdown}/>
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