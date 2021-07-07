/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { Col, Row, Modal, Collapse, notification } from 'antd'
import React, { useState } from 'react'
import { ShareAltOutlined, RightOutlined } from '@ant-design/icons'
import { Button } from '@condo/domains/common/components/Button'
import { green } from '@ant-design/colors'
import Link from 'next/link'
import { useIntl } from '@core/next/intl'
import { useMutation } from '@core/next/apollo'
import { TICKET_SHARE_MUTATION } from '@condo/domains/ticket/gql'
import { useOrganization } from '@core/next/organization'
import { searchEmployee } from '@condo/domains/ticket/utils/clientSchema/search'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import styled from '@emotion/styled'
import { colors } from '@condo/domains/common/constants/style'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { useRouter } from 'next/router'

const collapse = css`
    border-radius: 8px;
    background: ${colors.white};

    & .ant-collapse-content {
        border-top: none;

    }

    & .ant-collapse-item:last-child,
    & .ant-collapse-item:last-child > .ant-collapse-header {
        border-radius: 8px;
        line-height: 24px
    }

    & > .ant-collapse-item > .ant-collapse-header .ant-collapse-arrow {
        right: 20px;
        font-size: 14px;
    }
    & > .ant-collapse-item > .ant-collapse-header {
        color: ${green[6]};
        padding: 17px 20px;
        font-size: 16px;

        &:hover, &:focus {
            color: ${green[5]};
        }
    }
    & .ant-collapse-item:last-child > .ant-collapse-content {
        border-radius: 8px;
    }
    & .ant-collapse-content > .ant-collapse-content-box {
        padding: 0px 19px 22px;
    }

    & .ant-select-multiple .ant-select-selection-item {
        background: ${colors.white};
        font-size: 12px;
    }

    & .ant-select-multiple.ant-select-lg .ant-select-selection-item {
        line-height: 20px;
        height: 20px;
        border: none;
    }

    & .ant-select-item-option-content,
    & .ant-select-item,
    & .ant-select-show-search.ant-select:not(.ant-select-customize-input) .ant-select-selector input {
        font-size: 12px;
    }

`

const search = css`
    width: 100%;
`

const ModalHeader = styled.span`
    fontWeight: 700;
    line-height: 32px;
    font-size: 24px;
`

const ShareButton = styled.span`
  border: 1px solid ${colors.lightGrey[5]};
  border-radius: 8px;
  display: inline-block;
  width: 100%;
  color: ${green[6]};
  cursor: pointer;
  height: 60px;
  line-height: 60px;
  position: relative;
  padding-left: 20px;
  font-size: 16px;

  &:hover, &:focus {
      color: ${green[5]};
  }

  & .anticon {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 14px;
    margin-top: 1px;
  }
`

interface ITicketShareModalProps {
    description: string,
}

export const TicketShareModal: React.FC<ITicketShareModalProps> = (props) => {
    const { description } = props
    const intl = useIntl()
    const SendTicketToEmailMessage = intl.formatMessage({ id: 'SendTicketToEmail' })
    const ToEmployeesEmailMessage = intl.formatMessage({ id: 'ToEmployeesEmail' })
    const EmployeesNameMessage = intl.formatMessage({ id: 'EmployeesName' })
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })
    const WhatsappMessage = intl.formatMessage({ id: 'WhatsApp' })
    const TelegramMessage = intl.formatMessage({ id: 'Telegram' })
    const ShareMessage = intl.formatMessage({ id: 'Share' })
    const { query } = useRouter()
    const { organization } = useOrganization()
    const [ticketShare] = useMutation(TICKET_SHARE_MUTATION)

    let href = null
    if (typeof window !== 'undefined') {
        href = window.location.href
    }

    const [usersIds, setUsersIds] = useState([])
    const [loading, setLoading] = useState(false)
    const [visible, setVisible] = useState(false)

    function handleSelect (e) {
        setUsersIds(e)
    }

    async function handleClick () {
        setLoading(true)
        const sender = getClientSideSenderInfo()

        ticketShare({ variables: {
            data: {
                sender,
                users: usersIds,
                ticketId: query.id,
            } },
        })
            .then(
                (e) => {
                    setUsersIds([])
                },
                (e) => {
                    console.error(e)
                    notification.error({
                        message: ServerErrorMessage,
                        description: e.message,
                    })
                })
            .finally(() => setLoading(false))

    }

    function handleCancel () {
        setVisible(false)
    }

    function handleShow () {
        setVisible(true)
    }

    return (
        <>
            <Button
                type={'sberPrimary'}
                icon={<ShareAltOutlined />}
                secondary
                onClick={handleShow}
            >
                {ShareMessage}
            </Button>
            <Modal
                visible={visible}
                footer={null}
                onCancel={handleCancel}
                title={
                    <ModalHeader>
                        {ShareMessage}
                    </ModalHeader>
                }
            >
                <Row gutter={[0, 16]}>
                    <Col span={24}>
                        <Link
                            href={`whatsapp://send/?text=${encodeURI(description)}%20${href}`}
                        >
                            <ShareButton>
                                {WhatsappMessage}
                                <RightOutlined />
                            </ShareButton>
                        </Link>
                    </Col>
                    <Col span={24}>
                        <Link
                            href={`https://t.me/share/url?url=${href}&text=${description}`}
                        >
                            <ShareButton>
                                {TelegramMessage}
                                <RightOutlined />
                            </ShareButton>
                        </Link>
                    </Col>
                    <Col span={24}>
                        <Collapse expandIconPosition='right' css={collapse}>
                            <Collapse.Panel key='1' header={ToEmployeesEmailMessage}>
                                <GraphQlSearchInput
                                    search={searchEmployee(organization.id)}
                                    showArrow={false}
                                    mode='multiple'
                                    css={search}
                                    onChange={handleSelect}
                                    value={usersIds}
                                    placeholder={EmployeesNameMessage}
                                />
                                {usersIds.length ? <Button
                                    type='sberPrimary'
                                    size='large'
                                    onClick={handleClick}
                                    style={{ marginTop: '20px' }}
                                    disabled={loading}
                                >
                                    {SendTicketToEmailMessage}
                                </Button> : null}
                            </Collapse.Panel>
                        </Collapse>
                    </Col>
                </Row>
            </Modal>
        </>
    )
}
