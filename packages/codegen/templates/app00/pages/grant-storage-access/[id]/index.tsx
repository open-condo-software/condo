import { Col, Layout, Row, Typography } from 'antd'
import React, { CSSProperties, useCallback, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'


const { Content } = Layout

const LAYOUT_STYLES: CSSProperties = {
    backgroundColor: 'white',
    width: '100%',
    height: '100%',
    paddingBottom: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}
const BACKGROUND_STYLE: CSSProperties = { backgroundColor: 'white' }
const CONTENT_STYLES: CSSProperties = {
    ...BACKGROUND_STYLE,
    marginTop: '48px',
    padding: '0 5px',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 1200,
}

const GrantStorageAccessPage = () => {
    const intl = useIntl()
    const AskForAccessButtonMessage = intl.formatMessage({ id: 'AskForAccessButton' })
    const GrantButtonPressedMessage = intl.formatMessage({ id: 'GrantButtonPressed' })
    const BeAbleToAskForStorageAccessMessage = intl.formatMessage({ id: 'BeAbleToAskForStorageAccess' })

    const [pressed, setPressed] = useState<boolean>(false)

    const clickHandler = useCallback(() => {
        setPressed(true)
    }, [])

    return (
        <Layout style={LAYOUT_STYLES}>
            <Content style={CONTENT_STYLES}>
                <Col span={24}>
                    <Row justify='center'>
                        {pressed
                            ? (
                                <Typography.Paragraph>
                                    {GrantButtonPressedMessage}
                                </Typography.Paragraph>
                            )
                            : (
                                <Typography.Paragraph>
                                    {BeAbleToAskForStorageAccessMessage}
                                </Typography.Paragraph>
                            )
                        }
                    </Row>
                    {
                        !pressed && (
                            <Row justify='center'>
                                <Button type='secondary' onClick={clickHandler}>
                                    {AskForAccessButtonMessage}
                                </Button>
                            </Row>
                        )
                    }
                </Col>
            </Content>
        </Layout>
    )
}

export default GrantStorageAccessPage
