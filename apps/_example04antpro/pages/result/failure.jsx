import React, { Fragment } from 'react'
import { Button, Card, Result } from 'antd'
import { FormattedMessage, useIntl } from 'react-intl'
import { CloseCircleOutlined, RightOutlined } from '@ant-design/icons'

import { GridContent } from '../../layout/BasicLayout'

import './failure.less'

const Content = (
    <Fragment>
        <div className="title">
            <FormattedMessage
                id="resultandfail.error.hint-title"
                defaultMessage="The content you submitted has the following error:"
            />
        </div>
        <div
            style={{
                marginBottom: 16,
            }}
        >
            <CloseCircleOutlined
                style={{
                    marginRight: 8,
                }}
                className="error_icon"
            />
            <FormattedMessage
                id="resultandfail.error.hint-text1"
                defaultMessage="Your account has been frozen"
            />
            <a
                style={{
                    marginLeft: 16,
                }}
            >
                <FormattedMessage id="resultandfail.error.hint-btn1" defaultMessage="Thaw immediately"/>
                <RightOutlined/>
            </a>
        </div>
        <div>
            <CloseCircleOutlined
                style={{
                    marginRight: 8,
                }}
                className="error_icon"
            />
            <FormattedMessage
                id="resultandfail.error.hint-text2"
                defaultMessage="Your account is not yet eligible to apply"
            />
            <a
                style={{
                    marginLeft: 16,
                }}
            >
                <FormattedMessage id="resultandfail.error.hint-btn2" defaultMessage="Upgrade immediately"/>
                <RightOutlined/>
            </a>
        </div>
    </Fragment>
)
export default () => {
    const intl = useIntl()

    return (<GridContent>
        <Card bordered={false}>
            <Result
                status="error"
                title={intl.formatMessage({
                    id: 'resultandfail.error.title',
                })}
                subTitle={intl.formatMessage({
                    id: 'resultandfail.error.description',
                })}
                extra={
                    <Button type="primary">
                        <FormattedMessage id="resultandfail.error.btn-text" defaultMessage="Return to modify"/>
                    </Button>
                }
                style={{
                    marginTop: 48,
                    marginBottom: 16,
                }}
            >
                {Content}
            </Result>
        </Card>
    </GridContent>)
};
