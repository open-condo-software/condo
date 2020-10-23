import React, { Fragment } from 'react'
import { Button, Card, Descriptions, Result, Steps } from 'antd'
import { FormattedMessage, useIntl } from 'react-intl'
import { DingdingOutlined } from '@ant-design/icons'

import { GridContent } from '../../layout/BasicLayout'

import './success.less'

const { Step } = Steps
const desc1 = (
    <div className="title">
        <div
            style={{
                margin: '8px 0 4px',
            }}
        >
            <FormattedMessage id="resultandsuccess.success.step1-operator" defaultMessage="Qu Lili"/>
            <DingdingOutlined
                style={{
                    marginLeft: 8,
                    color: '#00A0E9',
                }}
            />
        </div>
        <div>2016-12-12 12:32</div>
    </div>
)
const desc2 = (
    <div
        style={{
            fontSize: 12,
        }}
        className="title"
    >
        <div
            style={{
                margin: '8px 0 4px',
            }}
        >
            <FormattedMessage id="resultandsuccess.success.step2-operator" defaultMessage="Zhou Maomao"/>
            <a href="">
                <DingdingOutlined
                    style={{
                        color: '#00A0E9',
                        marginLeft: 8,
                    }}
                />
                <FormattedMessage id="resultandsuccess.success.step2-extra" defaultMessage="Urge"/>
            </a>
        </div>
    </div>
)
const content = (
    <>
        <Descriptions
            title={
                <FormattedMessage
                    id='resultandsuccess.success.operate-title'
                    defaultMessage='Project Name'
                />
            }
        >
            <Descriptions.Item
                label={
                    <FormattedMessage
                        id="resultandsuccess.success.operate-id"
                        defaultMessage="Project ID："
                    />
                }
            >
                23421
            </Descriptions.Item>
            <Descriptions.Item
                label={
                    <FormattedMessage id="resultandsuccess.success.principal" defaultMessage="Principal："/>
                }
            >
                <FormattedMessage id="resultandsuccess.success.step1-operator" defaultMessage="Qu Lili"/>
            </Descriptions.Item>
            <Descriptions.Item
                label={
                    <FormattedMessage
                        id="resultandsuccess.success.operate-time"
                        defaultMessage="Effective time："
                    />
                }
            >
                2016-12-12 ~ 2017-12-12
            </Descriptions.Item>
        </Descriptions>
        <br/>
        <Steps progressDot current={1}>
            <Step
                title={
                    <span
                        style={{
                            fontSize: 14,
                        }}
                    >
            <FormattedMessage
                id="resultandsuccess.success.step1-title"
                defaultMessage="Create project"
            />
          </span>
                }
                description={desc1}
            />
            <Step
                title={
                    <span
                        style={{
                            fontSize: 14,
                        }}
                    >
            <FormattedMessage
                id="resultandsuccess.success.step2-title"
                defaultMessage="Departmental preliminary review"
            />
          </span>
                }
                description={desc2}
            />
            <Step
                title={
                    <span
                        style={{
                            fontSize: 14,
                        }}
                    >
            <FormattedMessage
                id="resultandsuccess.success.step3-title"
                defaultMessage="Financial review"
            />
          </span>
                }
            />
            <Step
                title={
                    <span
                        style={{
                            fontSize: 14,
                        }}
                    >
            <FormattedMessage id="resultandsuccess.success.step4-title" defaultMessage="Finish"/>
          </span>
                }
            />
        </Steps>
    </>
)
const extra = (
    <Fragment>
        <Button type="primary">
            <FormattedMessage id="resultandsuccess.success.btn-return" defaultMessage="Back to list"/>
        </Button>
        <Button>
            <FormattedMessage id="resultandsuccess.success.btn-project" defaultMessage="View project"/>
        </Button>
        <Button>
            <FormattedMessage id="resultandsuccess.success.btn-print" defaultMessage="Print"/>
        </Button>
    </Fragment>
)
export default () => {
    const intl = useIntl()

    return (<GridContent>
        <Card bordered={false}>
            <Result
                status="success"
                title={intl.formatMessage({
                    id: 'resultandsuccess.success.title',
                })}
                subTitle={intl.formatMessage({
                    id: 'resultandsuccess.success.description',
                })}
                extra={extra}
                style={{
                    marginBottom: 16,
                }}
            >
                {content}
            </Result>
        </Card>
    </GridContent>)
};
