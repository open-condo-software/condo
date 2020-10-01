import React from 'react'
import { Alert, Card, Typography } from 'antd'
import { HeartTwoTone, SmileTwoTone } from '@ant-design/icons'
import { FormattedMessage } from 'react-intl'

import { PageHeaderWrapper } from '../layout/BasicLayout'

const HomePage = () => (
    <PageHeaderWrapper content="Hello admin title">
        <Card>
            <Alert
                message="run `yarn workspace @app/_example04antpro dev`"
                type="success"
                showIcon
                banner
                style={{
                    margin: -12,
                    marginBottom: 48,
                }}
            />
            <Typography.Title level={2} style={{ textAlign: 'center' }}>
                <SmileTwoTone/> Ant Design Pro <HeartTwoTone twoToneColor="#eb2f96"/> You
            </Typography.Title>
            <Typography.Title level={2} style={{ textAlign: 'center' }}>
                <FormattedMessage id="pages.index.greeting" defaultMessage="Hello, {name}!"
                                  values={{ name: '🧑USER' }}
                />
            </Typography.Title>
        </Card>
        <p style={{ textAlign: 'center', marginTop: 24 }}>
            Want to add more pages? Please refer to{' '}
            <a href="https://pro.ant.design/docs/block-cn" target="_blank" rel="noopener noreferrer">
                use block
            </a>
            。
        </p>
    </PageHeaderWrapper>
)

export default HomePage
