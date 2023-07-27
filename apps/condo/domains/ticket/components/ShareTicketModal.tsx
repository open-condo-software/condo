/** @jsx jsx */
import crypto from 'crypto'

import { green } from '@ant-design/colors'
import { CloseCircleFilled, RightOutlined } from '@ant-design/icons'
import { css, jsx } from '@emotion/react'
import styled from '@emotion/styled'
import { Col, Collapse, notification, Row } from 'antd'
import { get, isEmpty } from 'lodash'
import getConfig from 'next/config'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useState } from 'react'

import { Send } from '@open-condo/icons'
import { Organization } from '@open-condo/keystone/schema'
import { useMutation } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { Button, Modal, Typography } from '@open-condo/ui'

import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { useTracking, TrackingEventType } from '@condo/domains/common/components/TrackingContext'
import { EN_LOCALE } from '@condo/domains/common/constants/locale'
import { colors } from '@condo/domains/common/constants/style'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { ALGORITHM, CRYPTOENCODING, SALT } from '@condo/domains/ticket/constants/crypto'
import { SHARE_TICKET_MUTATION } from '@condo/domains/ticket/gql'
import { getEmployeeWithEmail } from '@condo/domains/ticket/utils/clientSchema/search'


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
    padding: 0 19px 22px;
  }
`

const search = css`
  width: 100%;
`

const sendButton = css`
  &, &:focus {
    background-color: ${colors.white};
  }
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

const Warning = (props) => {
    const intl = useIntl()
    const EmployeesMessage = intl.formatMessage({ id: 'global.section.employees' })
    const ShareWarningEmailMessage = intl.formatMessage({ id: 'ticket.shareWarningEmail' }, {
        link: <Link href='/employee'>{EmployeesMessage}</Link>,
        employees: `${props.children[0]} ${props.children[1] ? (`\n${props.children[1]}`) : ''}`,
    })
    const length = props.children.length - 2

    const ShareWarningEmailAndMoreMessage = intl.formatMessage({ id: 'ticket.shareWarningEmailAndMore' }, {
        length,
    })

    const WarningContainer = styled.div`
      background: ${colors.lightRed};
      border-radius: 2px;
      padding: 9px 16px 11px 42px;
      position: relative;
      margin-top: 8px;
      white-space: pre-wrap;
      font-size: 14px;
      line-height: 22px;

      & a {
        color: ${green[6]};
        &:hover,
        &:focus,
        &:active {
          color: ${green[5]};
        }
      }
    `
    return (
        <WarningContainer>
            <CloseCircleFilled css={css`
              border-radius: 7px;
              color: ${colors.brightRed};
              background: ${colors.white};
              position: absolute;
              left: 17px;
              top: 14px;
              height: 14px;
              width: 14px;
            `} />

            {ShareWarningEmailMessage}
            {length > 0 ? ShareWarningEmailAndMoreMessage : ''}
        </WarningContainer>
    )
}

interface IShareTicketModalProps {
    date: string
    number: number
    details: string
    id: string
    locale?: string
    organization: Organization
}

export const ShareTicketModal: React.FC<IShareTicketModalProps> = (props) => {
    const intl = useIntl()
    const SendTicketToEmailMessage = intl.formatMessage({ id: 'sendTicketToEmail' })
    const ToEmployeesEmailMessage = intl.formatMessage({ id: 'toEmployeesEmail' })
    const EmployeesNameMessage = intl.formatMessage({ id: 'employeesName' })
    const ServerErrorMessage = intl.formatMessage({ id: 'serverError' })
    const WhatsappMessage = intl.formatMessage({ id: 'whatsApp' })
    const TelegramMessage = intl.formatMessage({ id: 'telegram' })
    const ShareHeaderMessage = intl.formatMessage({ id: 'ticket.shareHeader' })
    const ShareButtonMessage = intl.formatMessage({ id: 'ticket.shareButton' })
    const OKMessage = intl.formatMessage({ id: 'OK' })
    const ShareSentMessage = intl.formatMessage({ id: 'ticket.shareSent' })
    const ShareSentToEmailMessage = intl.formatMessage({ id: 'ticket.shareSentToEmail' })

    const { logEvent, getEventName } = useTracking()

    const { date, number, details, id, locale, organization } = props
    const cipher = crypto.createCipher(ALGORITHM, SALT)

    let cutDetails = details || ''
    if (cutDetails.length >= 110) {
        cutDetails = `${cutDetails.substr(0, 100)}…`
    }
    const stringifiedParams = JSON.stringify({ date, number, details: cutDetails, id })
    const encryptedText = cipher.update(stringifiedParams, 'utf8', CRYPTOENCODING) + cipher.final(CRYPTOENCODING)

    const { query } = useRouter()
    const [shareTicket] = useMutation(SHARE_TICKET_MUTATION)

    const {
        publicRuntimeConfig: { serverUrl: origin },
    } = getConfig()

    const [chosenEmployees, setChosenEmployees] = useState([])
    const [loading, setLoading] = useState(false)
    const [shareVisible, setShareVisible] = useState(false)
    const [okVisible, setOkVisible] = useState(false)
    const [usersWithoutEmail, setUsersWithoutEmail] = useState([])

    const parseSelectValue = (selectedEmployees) => {
        try {
            return selectedEmployees.map(JSON.parse)
        } catch (error) {
            console.error('Invalid format for employees in multiple select', selectedEmployees)
        }
    }

    function handleSelect (value) {
        const withoutEmails = parseSelectValue(value).filter(item => !get(item, 'value.hasEmail')).map(item => item.text)
        setUsersWithoutEmail(withoutEmails)
        setChosenEmployees(value)
    }

    async function handleClick () {
        setLoading(true)
        const sender = getClientSideSenderInfo()
        const { data, error } = await shareTicket({
            variables: {
                data: {
                    sender,
                    employees: parseSelectValue(chosenEmployees).filter(employee => get(employee, 'value.hasEmail')).map(employee => employee.id),
                    ticketId: query.id,
                },
            },
        })
        if (data && data.obj) {
            setChosenEmployees([])
            setShareVisible(false)
            setOkVisible(true)
            setUsersWithoutEmail([])
        }
        if (error) {
            console.error(error)
            notification.error({
                message: ServerErrorMessage,
                description: error.message,
            })
        }
        setLoading(false)
    }

    function handleCancel () {
        setShareVisible(false)
        setOkVisible(false)
    }

    function handleShow () {
        setShareVisible(true)
    }

    function handleClickSecond () {
        setOkVisible(false)
    }

    const handleClickShareLink = (linkTitle: string) => () => {
        const eventName = getEventName(TrackingEventType.Click)

        if (eventName) {
            logEvent({ eventName, eventProperties: { component: { value: linkTitle } } })
        }
    }

    return (
        <>
            <Button
                type='secondary'
                icon={<Send size='medium' />}
                onClick={handleShow}
                css={sendButton}
            >
                {ShareButtonMessage}
            </Button>
            <Modal
                open={okVisible}
                footer={<Button
                    type='primary'
                    onClick={handleClickSecond}
                >
                    {OKMessage}
                </Button>}
                onCancel={handleCancel}
                title={ShareSentMessage}
            >
                <Typography.Paragraph type='secondary'>{ShareSentToEmailMessage}</Typography.Paragraph>
            </Modal>
            <Modal
                open={shareVisible}
                footer={null}
                onCancel={handleCancel}
                title={ShareHeaderMessage}
            >
                <Row gutter={[0, 16]}>
                    <Col span={24}>
                        <a
                            target='_blank'
                            rel='noreferrer'
                            href={`https://wa.me/?text=${encodeURIComponent(`${origin}/share?q=${encryptedText}&locale=${locale || EN_LOCALE}`)}`}
                            onClick={handleClickShareLink('whatsapp')}
                        >
                            <ShareButton>
                                {WhatsappMessage}
                                <RightOutlined />
                            </ShareButton>
                        </a>
                    </Col>
                    <Col span={24}>
                        <a
                            target='_blank'
                            rel='noreferrer'
                            href={`https://t.me/share/url?url=${encodeURIComponent(`${origin}/share?q=${encryptedText}&locale=${locale || EN_LOCALE}`)}`}
                            onClick={handleClickShareLink('telegram')}
                        >
                            <ShareButton>
                                {TelegramMessage}
                                <RightOutlined />
                            </ShareButton>
                        </a>
                    </Col>
                    <Col span={24}>
                        <Collapse expandIconPosition='right' css={collapse}>
                            <Collapse.Panel key='1' header={ToEmployeesEmailMessage}>
                                <GraphQlSearchInput
                                    id='send-employee-email'
                                    search={getEmployeeWithEmail(get(organization, 'id'))}
                                    showArrow={false}
                                    mode='multiple'
                                    css={search}
                                    onChange={handleSelect}
                                    value={chosenEmployees}
                                    placeholder={EmployeesNameMessage}
                                    autoClearSearchValue={true}
                                />
                                {
                                    !isEmpty(usersWithoutEmail) &&
                                    <Warning>
                                        {usersWithoutEmail}
                                    </Warning>
                                }
                                {
                                    !isEmpty(chosenEmployees) &&
                                    <div style={{ marginTop: '20px' }}>
                                        <Button
                                            type='primary'
                                            onClick={handleClick}
                                            disabled={loading}
                                        >
                                            {SendTicketToEmailMessage}
                                        </Button>
                                    </div>
                                }
                            </Collapse.Panel>
                        </Collapse>
                    </Col>
                </Row>
            </Modal>
        </>
    )
}
