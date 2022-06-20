/** @jsx jsx */
import { css, jsx } from '@emotion/react'
import { EN_LOCALE } from '@condo/domains/common/constants/locale'
import { Col, Collapse, Modal, notification, Row, Typography } from 'antd'
import React, { useState } from 'react'
import { CloseCircleFilled, RightOutlined, ShareAltOutlined } from '@ant-design/icons'
import { Button, ButtonGradientBorderWrapper } from '@condo/domains/common/components/Button'
import { green } from '@ant-design/colors'
import Link from 'next/link'
import { useIntl } from '@core/next/intl'
import { useMutation } from '@core/next/apollo'
import { SHARE_TICKET_MUTATION } from '@condo/domains/ticket/gql'
import { getEmployeeWithEmail } from '@condo/domains/ticket/utils/clientSchema/search'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import styled from '@emotion/styled'
import { colors } from '@condo/domains/common/constants/style'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { useRouter } from 'next/router'
import crypto from 'crypto'
import getConfig from 'next/config'
import { ALGORITHM, CRYPTOENCODING, SALT } from '@condo/domains/ticket/constants/crypto'
import { Organization } from '@core/keystone/schema'
import { get, isEmpty } from 'lodash'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

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
    const EmployeesMessage = intl.formatMessage({ id: 'menu.Employees' })
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
    const SendTicketToEmailMessage = intl.formatMessage({ id: 'SendTicketToEmail' })
    const ToEmployeesEmailMessage = intl.formatMessage({ id: 'ToEmployeesEmail' })
    const EmployeesNameMessage = intl.formatMessage({ id: 'EmployeesName' })
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })
    const WhatsappMessage = intl.formatMessage({ id: 'WhatsApp' })
    const TelegramMessage = intl.formatMessage({ id: 'Telegram' })
    const ShareHeaderMessage = intl.formatMessage({ id: 'ticket.shareHeader' })
    const ShareButtonMessage = intl.formatMessage({ id: 'ticket.shareButton' })
    const OKMessage = intl.formatMessage({ id: 'OK' })
    const ShareSentMessage = intl.formatMessage({ id: 'ticket.shareSent' })
    const ShareSentToEmailMessage = intl.formatMessage({ id: 'ticket.shareSentToEmail' })
    const { isSmall } = useLayoutContext()

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
    }

    function handleShow () {
        setShareVisible(true)
    }

    function handleClickSecond () {
        setOkVisible(false)
    }

    return (
        <>
            <ButtonGradientBorderWrapper>
                <Button
                    type={'sberDefaultGradient'}
                    icon={<ShareAltOutlined />}
                    secondary
                    onClick={handleShow}
                    css={sendButton}
                >
                    {ShareButtonMessage}
                </Button>
            </ButtonGradientBorderWrapper>
            <Modal
                style={{ top: 30 }}
                visible={okVisible}
                footer={<Button
                    type='sberPrimary'
                    size='large'
                    onClick={handleClickSecond}
                >
                    {OKMessage}
                </Button>}
                onCancel={handleCancel}
                title={ShareSentMessage}
            >
                {ShareSentToEmailMessage}
            </Modal>
            <Modal
                style={{ top: 30 }}
                visible={shareVisible}
                footer={null}
                onCancel={handleCancel}
                title={<Typography.Title level={isSmall ? 5 : 3}>{ShareHeaderMessage}</Typography.Title>}
            >
                <Row gutter={[0, 16]}>
                    <Col span={24}>
                        <a
                            target='_blank'
                            rel='noreferrer'
                            href={`https://wa.me/?text=${encodeURIComponent(`${origin}/share?q=${encryptedText}&locale=${locale || EN_LOCALE}`)}`}
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
                                    <Button
                                        type='sberPrimary'
                                        size='large'
                                        onClick={handleClick}
                                        style={{ marginTop: '20px' }}
                                        disabled={loading}
                                    >
                                        {SendTicketToEmailMessage}
                                    </Button>
                                }
                            </Collapse.Panel>
                        </Collapse>
                    </Col>
                </Row>
            </Modal>
        </>
    )
}
