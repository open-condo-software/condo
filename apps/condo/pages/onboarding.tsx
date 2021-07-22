import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { Col, Row, Space, Typography } from 'antd'
import Head from 'next/head'
import React from 'react'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { HouseIcon } from '@condo/domains/common/components/icons/HouseIcon'
import { UserIcon } from '@condo/domains/common/components/icons/UserIcon'
import { OnBoardingStep, OnBoardingStepType } from '@condo/domains/user/components/OnBoardingStep'
import { CheckOutlined, WechatFilled, ProfileFilled, CreditCardFilled } from '@ant-design/icons'
import { IPageInterface } from '../next-env'

const OnBoardingPage: IPageInterface = () => {
    const onBoardingSteps = [
        {
            title: 'Создание организации',
            type: OnBoardingStepType.COMPLETED,
            icon: CheckOutlined,
            description: 'ЗАЧЕМ этот шаг / а не ЧТО нужно сделать здесь (профит)',
        },
        {
            title: 'Добавление дома',
            type: OnBoardingStepType.DEFAULT,
            icon: HouseIcon,
            description: 'ЗАЧЕМ этот шаг / а не ЧТО нужно сделать здесь (профит)',
        },
        {
            title: 'Добавление сотрудника',
            type: OnBoardingStepType.DISABLED,
            icon: UserIcon,
            description: 'ЗАЧЕМ этот шаг / а не ЧТО нужно сделать здесь (профит)',
        },
        {
            title: 'Формирование команды',
            type: OnBoardingStepType.DISABLED,

            icon: WechatFilled,
            description: 'ЗАЧЕМ этот шаг / а не ЧТО нужно сделать здесь (профит)',
        },
        {
            title: 'Подключение биллинга',
            type: OnBoardingStepType.DISABLED,

            icon: ProfileFilled,
            description: 'ЗАЧЕМ этот шаг / а не ЧТО нужно сделать здесь (профит)',
        },
        {
            title: 'Подключение эквайринга',
            type: OnBoardingStepType.DISABLED,
            icon: CreditCardFilled,
            description: 'ЗАЧЕМ этот шаг / а не ЧТО нужно сделать здесь (профит)',
        },
    ]

    return (
        <>
            <Head>
                <title>С чего начать?</title>
            </Head>
            <PageWrapper>
                <AuthRequired>
                    <PageContent>
                        <Row gutter={[0, 40]}>
                            <Col span={24}>
                                <Space direction={'vertical'} size={24}>
                                    <Typography.Title level={1} style={{ margin: 0 }}>С чего начать?</Typography.Title>
                                    <Typography.Paragraph>Данные подсказки помогут вам быстрее познакомиться с продуктом</Typography.Paragraph>
                                </Space>
                            </Col>
                            <Col span={24}>
                                <Row gutter={[0, 0]}>
                                    {onBoardingSteps.map((step) => {
                                        return (
                                            <OnBoardingStep {...step} key={step.title}/>
                                        )
                                    })}
                                </Row>
                            </Col>
                        </Row>
                    </PageContent>
                </AuthRequired>
            </PageWrapper>
        </>
    )
}

export default OnBoardingPage
