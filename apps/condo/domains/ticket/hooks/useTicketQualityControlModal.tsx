import { Ticket as TicketType, TicketQualityControlValueType } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Row, Form, FormInstance, RowProps } from 'antd'
import isFunction from 'lodash/isFunction'
import React, { useCallback, useMemo, useRef, useState } from 'react'

import { Smile, Frown, FileEdit } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, ButtonProps, Checkbox as CondoCheckbox, CheckboxProps, Modal, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import Input from '@condo/domains/common/components/antd/Input'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { useInputWithCounter } from '@condo/domains/common/hooks/useInputWithCounter'
import { EMOJI } from '@condo/domains/ticket/constants/emoji'
import { QUALITY_CONTROL_BAD_OPTIONS, QUALITY_CONTROL_GOOD_OPTIONS } from '@condo/domains/ticket/constants/qualityControl'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'


export type QualityControlDataType = Pick<TicketType, 'qualityControlValue' | 'qualityControlAdditionalOptions' | 'qualityControlComment'>

interface IUseTicketQualityControlModalProps {
    ticket: TicketType
    afterUpdate?: (values: QualityControlDataType) => void
}

export interface IUseTicketQualityControlModalReturn {
    EditButton: React.FC<Pick<ButtonProps, 'disabled'>>
    QualityControlModals: React.ReactNode
    GoodButton: React.ReactNode
    BadButton: React.ReactNode
}

export type UseTicketQualityControlModalType = (props: IUseTicketQualityControlModalProps) => IUseTicketQualityControlModalReturn

type BigCheckboxProps = Omit<CheckboxProps, 'label'> & {
    emoji: string
    label: string
}


const Emoji = styled.span`
  @media (max-width: 767px) {
    font-size: 24px;
    line-height: 24px;
  }
  font-weight: 400;
  font-size: 32px;
  line-height: 32px;
`

// todo(DOMA-5320): move to ui kit later
const CustomCheckbox = styled(CondoCheckbox)`
  @media (max-width: 767px) {
    height: 64px;
  }  
  width: 100%;
  height: 131px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  &::after {
    display: none;
  }
  
  .condo-checkbox {
    height: 100%;
    width: 100%;
    position: absolute;
    border-radius: 12px;
    
    &::after {
      display: none;
    }
  }

  & > .condo-checkbox-checked > .condo-checkbox-inner::before {
    background: ${colors.green[1]} !important;    
  }

  .condo-checkbox-checked > .condo-checkbox-inner {
    background: linear-gradient(90deg, #4cd174 0%, #6db8f2 100%) border-box;
  }
  
  &:hover {
    .condo-checkbox-checked > .condo-checkbox-inner {
      background: linear-gradient(90deg, #4cd174 0%, #6db8f2 100%) border-box;
    }

    &.condo-checkbox-wrapper > .condo-checkbox:not(.condo-checkbox-checked) > .condo-checkbox-inner {
      border-color: ${colors.white};
      box-shadow: 0 4px 14px rgba(178, 185, 217, 0.4);
    }
  }

  &.condo-checkbox-wrapper > .condo-checkbox:not(.condo-checkbox-checked) > .condo-checkbox-inner {
    border-color: ${colors.gray[3]};
  }
  
  .condo-checkbox-inner {
    height: calc(100% - 2px);
    width: calc(100% - 2px);
    border-radius: 12px;
    transition: all .15s;
    
    &::before {
      border-radius: 11px !important;
    }
    
    &::after {
      display: none;
    }
  }
`

const BIG_VERTICAL_GUTTER: RowProps['gutter'] = [0, 40]
const MEDIUM_VERTICAL_GUTTER: RowProps['gutter'] = [0, 24]
const CUSTOM_CHECKBOX_CONTENT_GUTTER: RowProps['gutter'] = [0, 12]
const CUSTOM_CHECKBOXES_DESKTOP_WRAPPER_GUTTER: RowProps['gutter'] = [24, 0]
const CUSTOM_CHECKBOXES_MOBILE_WRAPPER_GUTTER: RowProps['gutter'] = [0, 16]
const COMMENT_WRAPPER_GUTTER: RowProps['gutter'] = [0, 8]

const Checkbox: React.FC<BigCheckboxProps> = ({ emoji, label, ...restProps }) => {
    const { breakpoints } = useLayoutContext()

    return (
        <CustomCheckbox
            children={
                breakpoints.TABLET_LARGE
                    ? (
                        <Row gutter={CUSTOM_CHECKBOX_CONTENT_GUTTER} justify='center'>
                            <Col span={24}>
                                <Row justify='center'>
                                    <Col>
                                        <Emoji>{emoji}</Emoji>
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
                                <Typography.Text>{emoji} {label}</Typography.Text>
                            </Col>
                        </Row>
                    )
            }
            {...restProps} />
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

export const useTicketQualityControlModal: UseTicketQualityControlModalType = ({ ticket, afterUpdate }) => {
    const intl = useIntl()
    const EditMessage = intl.formatMessage({ id: 'ticket.modalQualityControl.edit' })
    const SaveMessage = intl.formatMessage({ id: 'ticket.modalQualityControl.save' })
    const TitleBadMessage = intl.formatMessage({ id: 'ticket.modalQualityControl.bad.title' })
    const TitleGoodMessage = intl.formatMessage({ id: 'ticket.modalQualityControl.good.title' })
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

    const update = Ticket.useUpdate({})

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
        await update(updatedValues, ticket)

        setLoading(false)
        handleCloseModal()
        if (isFunction(afterUpdate)) {
            await afterUpdate(updatedValues)
        }
    }, [afterUpdate, handleCloseModal, ticket, type, update])

    const handleToggleContentVisibility: CheckboxProps['onChange'] = useCallback((event) => {
        setOpenComment(event.target.checked)
        setTextLength(0)
        if (!event.target.checked) {
            formRef.current.resetFields(['qualityControlComment'])
        }
    }, [setTextLength])

    const EditButton: IUseTicketQualityControlModalReturn['EditButton'] = useCallback(({ disabled }) => (
        <Button icon={<FileEdit size='medium' />} type='secondary' onClick={handleOpenChangeModal} children={EditMessage} disabled={disabled || isLoading} />
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
                        title={isBad ? TitleBadMessage : TitleGoodMessage}
                    >
                        <Row gutter={BIG_VERTICAL_GUTTER}>
                            <Col span={24}>
                                <Row gutter={breakpoints.TABLET_LARGE ? CUSTOM_CHECKBOXES_DESKTOP_WRAPPER_GUTTER : CUSTOM_CHECKBOXES_MOBILE_WRAPPER_GUTTER}>
                                    <Col span={breakpoints.TABLET_LARGE ? 12 : 24}>
                                        <Form.Item name={isBad ? 'lowQuality' : 'highQuality'} valuePropName='checked'>
                                            <Checkbox
                                                emoji={isBad ? EMOJI.BROKEN_HEART : EMOJI.TROPHY}
                                                label={isBad ? LowQualityMessage : HighQualityMessage}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={breakpoints.TABLET_LARGE ? 12 : 24}>
                                        <Form.Item name={isBad ? 'slowly' : 'quickly'} valuePropName='checked'>
                                            <Checkbox
                                                emoji={isBad ? EMOJI.SNAIL : EMOJI.ROCKET}
                                                label={isBad ? SlowlyMessage : QuicklyMessage}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={24}>
                                <Row gutter={MEDIUM_VERTICAL_GUTTER}>
                                    <Col span={24}>
                                        <CondoCheckbox label={LeaveCommentMessage} checked={openComment} onChange={handleToggleContentVisibility} />
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
    ), [CommentMessage, CommentPlaceholderMessage, Counter, HighQualityMessage, InputWithCounter, LeaveCommentMessage, LowQualityMessage, QuicklyMessage, SaveMessage, SlowlyMessage, TitleBadMessage, TitleGoodMessage, breakpoints.TABLET_LARGE, handleCloseModal, handleToggleContentVisibility, handleUpdate, isBad, isLoading, open, openComment])

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
