import { useUpdateTicketMutation } from '@app/condo/gql'
import { Ticket as TicketType, TicketQualityControlValueType } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Row, Form, FormInstance, RowProps } from 'antd'
import isFunction from 'lodash/isFunction'
import React, { useCallback, useMemo, useRef, useState } from 'react'

import { Smile, Frown } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { Button, ButtonProps, Card, Checkbox, CheckboxProps, Modal, Typography } from '@open-condo/ui'

import Input from '@condo/domains/common/components/antd/Input'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { EMOJI_IMAGES } from '@condo/domains/common/constants/emoji'
import { useInputWithCounter } from '@condo/domains/common/hooks/useInputWithCounter'
import { QUALITY_CONTROL_BAD_OPTIONS, QUALITY_CONTROL_GOOD_OPTIONS } from '@condo/domains/ticket/constants/qualityControl'


export type QualityControlDataType = Pick<TicketType, 'qualityControlValue' | 'qualityControlAdditionalOptions' | 'qualityControlComment'>

interface IUseTicketQualityControlModalProps {
    ticketId: string
    afterUpdate?: (values: QualityControlDataType) => void
}

export interface IUseTicketQualityControlModalReturn {
    EditButton: React.FC<Pick<ButtonProps, 'disabled'>>
    QualityControlModals: React.ReactNode
    GoodButton: React.ReactNode
    BadButton: React.ReactNode
}

export type UseTicketQualityControlModalType = (props: IUseTicketQualityControlModalProps) => IUseTicketQualityControlModalReturn

type AdditionalOptionProps = {
    emoji: string
    label: string
    form: FormInstance | null
    name: string
}


const Emoji = styled.img`
  @media (max-width: 767px) {
    width: 24px;
    height: 24px;
  }
  width: 32px;
  height: 32px;
`

const BIG_VERTICAL_GUTTER: RowProps['gutter'] = [0, 40]
const MEDIUM_VERTICAL_GUTTER: RowProps['gutter'] = [0, 24]
const CUSTOM_CHECKBOX_CONTENT_GUTTER: RowProps['gutter'] = [0, 12]
const CUSTOM_CHECKBOXES_DESKTOP_WRAPPER_GUTTER: RowProps['gutter'] = [24, 0]
const CUSTOM_CHECKBOXES_MOBILE_WRAPPER_GUTTER: RowProps['gutter'] = [0, 16]
const COMMENT_WRAPPER_GUTTER: RowProps['gutter'] = [0, 8]
const ADDITIONAL_OPTION_CONTENT_MOBILE_GUTTER: RowProps['gutter'] = [8, 0]

const AdditionalOption: React.FC<AdditionalOptionProps> = ({ emoji, label, form, name }) => {
    const [isChecked, setIsChecked] = useState<boolean>(false)
    const { breakpoints } = useLayoutContext()

    const handleClick = useCallback(() => {
        if (!form) return

        const prev = Boolean(form.getFieldValue(name))
        setIsChecked(!prev)
        form.setFieldValue(name, !prev)
    }, [form, name])

    return (
        <Card
            hoverable
            bodyPadding={breakpoints.TABLET_LARGE ? '32px 8px' : 19}
            active={isChecked}
            onClick={handleClick}
        >
            {
                breakpoints.TABLET_LARGE
                    ? (
                        <Row gutter={CUSTOM_CHECKBOX_CONTENT_GUTTER} justify='center'>
                            <Col span={24}>
                                <Row justify='center'>
                                    <Col>
                                        <Emoji src={emoji} />
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={24}>
                                <Row justify='center'>
                                    <Col>
                                        <Typography.Paragraph>
                                            {label}
                                        </Typography.Paragraph>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    )
                    : (
                        <Row>
                            <Col span={24}>
                                <Row justify='center' align='middle' gutter={ADDITIONAL_OPTION_CONTENT_MOBILE_GUTTER}>
                                    <Col>
                                        <Emoji src={emoji} />
                                    </Col>
                                    <Col>
                                        <Typography.Text>
                                            {label}
                                        </Typography.Text>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    )
            }
        </Card>
    )
}

const formValuesToMutationDataPreprocessor = (values): QualityControlDataType => {
    const { qualityControlComment = '', qualityControlValue, ...additionalOptions } = values

    if (!qualityControlValue) return

    const isBad = qualityControlValue === TicketQualityControlValueType.Bad
    const targetOptions = isBad ? QUALITY_CONTROL_BAD_OPTIONS : QUALITY_CONTROL_GOOD_OPTIONS
    const qualityControlAdditionalOptions = Object.entries(additionalOptions)
        .filter(([key, value]) => value === true && targetOptions.includes(key))
        .map(([key]) => key) as TicketType['qualityControlAdditionalOptions']

    return {
        qualityControlValue,
        qualityControlComment: qualityControlComment?.trim() || null,
        qualityControlAdditionalOptions: qualityControlAdditionalOptions,
    }
}

const INITIAL_STATE = {}

export const useTicketQualityControlModal: UseTicketQualityControlModalType = ({ ticketId, afterUpdate }) => {
    const intl = useIntl()
    const EditMessage = intl.formatMessage({ id: 'ticket.modalQualityControl.edit' })
    const SaveMessage = intl.formatMessage({ id: 'ticket.modalQualityControl.save' })
    const TitleMessage = intl.formatMessage({ id: 'ticket.modalQualityControl.title' })
    const LeaveCommentMessage = intl.formatMessage({ id: 'ticket.modalQualityControl.leaveComment' })
    const CommentMessage = intl.formatMessage({ id: 'ticket.modalQualityControl.comment' })
    const CommentPlaceholderMessage = intl.formatMessage({ id: 'ticket.modalQualityControl.comment.placeholder' })
    const ChangeTitleMessage = intl.formatMessage({ id: 'ticket.modalQualityControlChange.title' })
    const ChangeSubtitleMessage = intl.formatMessage({ id: 'ticket.modalQualityControlChange.subtitle' })
    const GoodMessage = intl.formatMessage({ id: 'ticket.qualityControl.good' })
    const BadMessage = intl.formatMessage({ id: 'ticket.qualityControl.bad' })
    const LowQualityMessage = intl.formatMessage({ id: 'ticket.qualityControl.options.lowQuality' })
    const SlowlyMessage = intl.formatMessage({ id: 'ticket.qualityControl.options.slowly' })
    const HighQualityMessage = intl.formatMessage({ id: 'ticket.qualityControl.options.highQuality' })
    const QuicklyMessage = intl.formatMessage({ id: 'ticket.qualityControl.options.quickly' })

    const [open, setOpen] = useState<boolean>(false)
    const [openChangeModal, setOpenChangeModalModal] = useState<boolean>(false)
    const [openComment, setOpenComment] = useState<boolean>(false)
    const [type, setType] = useState<TicketQualityControlValueType>(TicketQualityControlValueType.Bad)
    const [isLoading, setLoading] = useState<boolean>(false)

    const formRef = useRef<FormInstance>(null)

    const { breakpoints } = useLayoutContext()
    const { InputWithCounter, Counter, setTextLength } = useInputWithCounter(Input.TextArea, 500)

    const isBad = type === TicketQualityControlValueType.Bad

    const [updateTicket] = useUpdateTicketMutation()

    const handleOpenModal = useCallback(() => {
        formRef.current.setFieldValue('qualityControlValue', type)
        setOpen(true)
    }, [type])

    const handleCloseModal = useCallback(() => {
        formRef.current.resetFields()
        setOpen(false)
        setOpenComment(false)
        setTextLength(0)
    }, [setTextLength])

    const handleOpenChangeModal = useCallback(() => {
        setOpenChangeModalModal(true)
    }, [])

    const handleCloseChangeModal = useCallback(() => {
        setOpenChangeModalModal(false)
    }, [])

    const handleGoodClick = useCallback(() => {
        setType(TicketQualityControlValueType.Good)
        handleCloseChangeModal()
        handleOpenModal()
    }, [handleCloseChangeModal, handleOpenModal])

    const handleBadClick = useCallback(() => {
        setType(TicketQualityControlValueType.Bad)
        handleCloseChangeModal()
        handleOpenModal()
    }, [handleCloseChangeModal, handleOpenModal])

    const handleUpdate = useCallback(async (values) => {
        setLoading(true)

        const updatedValues = formValuesToMutationDataPreprocessor({ ...values, qualityControlValue: type })
        await updateTicket({
            variables: {
                id: ticketId,
                data: {
                    ...updatedValues,
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                },
            },
        })

        setLoading(false)
        handleCloseModal()
        if (isFunction(afterUpdate)) {
            await afterUpdate(updatedValues)
        }
    }, [afterUpdate, handleCloseModal, ticketId, type, updateTicket])

    const handleToggleContentVisibility: CheckboxProps['onChange'] = useCallback((event) => {
        setOpenComment(event.target.checked)
        setTextLength(0)
        if (!event.target.checked) {
            formRef.current.resetFields(['qualityControlComment'])
        }
    }, [setTextLength])

    const EditButton: IUseTicketQualityControlModalReturn['EditButton'] = useCallback(({ disabled }) => (
        <Button type='secondary' onClick={handleOpenChangeModal} children={EditMessage} disabled={disabled || isLoading} />
    ), [EditMessage, handleOpenChangeModal, isLoading])

    const GoodButton: IUseTicketQualityControlModalReturn['GoodButton'] = useMemo(() => (
        <Button icon={<Smile size='medium' />} type='secondary' onClick={handleGoodClick} children={GoodMessage} disabled={isLoading} />
    ), [GoodMessage, handleGoodClick, isLoading])

    const BadButton: IUseTicketQualityControlModalReturn['BadButton'] = useMemo(() => (
        <Button icon={<Frown size='medium' />} type='secondary' danger onClick={handleBadClick} children={BadMessage} disabled={isLoading} />
    ), [BadMessage, handleBadClick, isLoading])

    const QualityControlModal = useMemo(() => (
        <FormWithAction
            initialValues={INITIAL_STATE}
            action={handleUpdate}
        >
            {({ handleSave, form }) => {
                formRef.current = form
                return (
                    <Modal
                        open={open}
                        footer={<Button
                            type='primary'
                            children={SaveMessage}
                            onClick={handleSave}
                            disabled={isLoading}
                        />}
                        onCancel={handleCloseModal}
                        title={TitleMessage}
                    >
                        <Row gutter={BIG_VERTICAL_GUTTER}>
                            <Col span={24}>
                                <Row gutter={breakpoints.TABLET_LARGE ? CUSTOM_CHECKBOXES_DESKTOP_WRAPPER_GUTTER : CUSTOM_CHECKBOXES_MOBILE_WRAPPER_GUTTER}>
                                    <Col span={breakpoints.TABLET_LARGE ? 12 : 24}>
                                        <Form.Item name={isBad ? 'lowQuality' : 'highQuality'}>
                                            <AdditionalOption
                                                emoji={isBad ? EMOJI_IMAGES.BROKEN_HEART : EMOJI_IMAGES.TROPHY}
                                                label={isBad ? LowQualityMessage : HighQualityMessage}
                                                form={form}
                                                name={isBad ? 'lowQuality' : 'highQuality'}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={breakpoints.TABLET_LARGE ? 12 : 24}>
                                        <Form.Item name={isBad ? 'slowly' : 'quickly'}>
                                            <AdditionalOption
                                                emoji={isBad ? EMOJI_IMAGES.SNAIL : EMOJI_IMAGES.ROCKET}
                                                label={isBad ? SlowlyMessage : QuicklyMessage}
                                                form={form}
                                                name={isBad ? 'slowly' : 'quickly'}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={24}>
                                <Row gutter={MEDIUM_VERTICAL_GUTTER}>
                                    <Col span={24}>
                                        <Checkbox label={LeaveCommentMessage} checked={openComment} onChange={handleToggleContentVisibility} />
                                    </Col>
                                    {
                                        openComment && (
                                            <Col span={24}>
                                                <Row gutter={COMMENT_WRAPPER_GUTTER}>
                                                    <Col span={24}>
                                                        <Typography.Text type='secondary' size='medium'>{CommentMessage}</Typography.Text>
                                                    </Col>
                                                    <Col span={24}>
                                                        <Row justify='end'>
                                                            <Col span={24}>
                                                                <Form.Item name='qualityControlComment'>
                                                                    <InputWithCounter rows={4} placeholder={CommentPlaceholderMessage} />
                                                                </Form.Item>
                                                            </Col>
                                                            <Col>
                                                                <Counter />
                                                            </Col>
                                                        </Row>
                                                    </Col>
                                                </Row>
                                            </Col>
                                        )
                                    }
                                </Row>
                            </Col>
                        </Row>
                    </Modal>
                )
            }}
        </FormWithAction>
    ), [CommentMessage, CommentPlaceholderMessage, Counter, HighQualityMessage, InputWithCounter, LeaveCommentMessage, LowQualityMessage, QuicklyMessage, SaveMessage, SlowlyMessage, TitleMessage, breakpoints.TABLET_LARGE, handleCloseModal, handleToggleContentVisibility, handleUpdate, isBad, isLoading, open, openComment])

    const QualityControlChangeModal = useMemo(() => (
        <Modal
            open={openChangeModal}
            onCancel={handleCloseChangeModal}
            title={ChangeTitleMessage}
            footer={[BadButton, GoodButton]}
        >
            <Typography.Paragraph type='secondary'>
                {ChangeSubtitleMessage}
            </Typography.Paragraph>
        </Modal>
    ), [BadButton, ChangeSubtitleMessage, ChangeTitleMessage, GoodButton, handleCloseChangeModal, openChangeModal])

    const QualityControlModals = useMemo(() => (
        <>
            {QualityControlModal}
            {QualityControlChangeModal}
        </>
    ), [QualityControlChangeModal, QualityControlModal])

    return {
        EditButton,
        GoodButton,
        BadButton,
        QualityControlModals,
    }
}
