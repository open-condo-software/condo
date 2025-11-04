import { QuestionCircleOutlined } from '@ant-design/icons'
import {
    SortTicketCommentsBy,
    SortTicketsBy,
    TicketComment as TicketCommentType,
    TicketWhereInput,
    User as IUser,
    TicketExportTaskCreateInput,
    TicketExportTaskFormatType,
} from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Row, Typography } from 'antd'
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox'
import { Gutter } from 'antd/lib/grid/row'
import isEmpty from 'lodash/isEmpty'
import React, { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'
import { ResolvedIntlConfig } from 'react-intl'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { Button, Modal, Checkbox } from '@open-condo/ui'

import { ButtonWithDisabledTooltip } from '@condo/domains/common/components/ButtonWithDisabledTooltip'
import { CommentPreview } from '@condo/domains/common/components/Comments/Comment'
import { ChevronIcon as ChevronIconBase } from '@condo/domains/common/components/icons/ChevronIcon'
import { useTaskLauncher } from '@condo/domains/common/components/tasks/TaskLauncher'
import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { analytics, EventsData } from '@condo/domains/common/utils/analytics'
import { TicketComment } from '@condo/domains/ticket/utils/clientSchema'

import { useTicketExportTaskUIInterface } from './useTicketExportTaskUIInterface'


type TicketCommentWithChecked = TicketCommentType & { checked: boolean }
type CheckListCommentsPropsType = {
    ticketId: string
    checkedCommentIds: string[]
    setCheckedCommentIds: Dispatch<SetStateAction<string[]>>
    setHaveAllComments: Dispatch<SetStateAction<boolean>>
}

type CommentPreviewWithCheckboxPropsType = {
    onChange: (e: CheckboxChangeEvent) => void
    comment: TicketCommentWithChecked
}

const COMMENT_PREVIEW_WRAPPER_STYLE: React.CSSProperties = { width: '100%', display: 'flex' }
const CHECKBOX_WRAPPER_STYLE: React.CSSProperties = { marginRight: 8 }
const CURSOR_POINTER_STYLE: React.CSSProperties = { cursor: 'pointer' }
const SHOW_ALL_COMMENTS_LABEL_STYLE: React.CSSProperties = { marginRight: 8 }

const CHECKBOXES_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 24]
const COMMENT_PREVIEWS_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 8]

const CommentPreviewWithCheckbox: React.FC<CommentPreviewWithCheckboxPropsType> = ({ onChange, comment }) => {
    return (
        <div style={COMMENT_PREVIEW_WRAPPER_STYLE}>
            <div style={CHECKBOX_WRAPPER_STYLE}>
                <Checkbox
                    checked={comment.checked}
                    onChange={onChange}
                />
            </div>
            <CommentPreview comment={comment} />
        </div>
    )
}

const prepareComments = (comments?: TicketCommentType[]): TicketCommentWithChecked[] => {
    if (!comments) return []
    return comments.map(el => ({ ...el, checked: false }))
}

const ChevronIcon = styled(ChevronIconBase)<{ showAllComments?: boolean }>`
  transform: ${({ showAllComments }) => showAllComments ? 'rotate(180deg)' : 'none'};
  transition: transform .15s;
`

const CheckListComments: React.FC<CheckListCommentsPropsType> = (props) => {
    const { ticketId, setCheckedCommentIds, checkedCommentIds, setHaveAllComments } = props

    const intl = useIntl()
    const HaveAllCommentsLabel = intl.formatMessage({ id: 'pages.condo.ticket.exportBlank.HaveAllComments.label' })
    const ShowAllCommentsLabel = intl.formatMessage({ id: 'pages.condo.ticket.exportBlank.ShowAllComments.label' })
    const HideAllCommentsLabel = intl.formatMessage({ id: 'pages.condo.ticket.exportBlank.HideAllComments.label' })

    const [showAllComments, setShowAllComments] = useState<boolean>(false)
    const [comments, setComments] = useState<TicketCommentWithChecked[]>([])

    const { loading } = TicketComment.useObjects({
        where: { ticket: { id: ticketId } },
        sortBy: [SortTicketCommentsBy.CreatedAtDesc],
    }, {
        onCompleted: (data) => {
            setComments(prepareComments(data.objs))
        },
    })

    const isIndeterminate = useMemo(() => {
        const selected = comments.reduce((sum, comment) => comment.checked ? sum + 1 : sum, 0)
        return comments.length > 0 && selected > 0 && selected < comments.length
    }, [comments])

    const isAllChecked = useMemo(() => {
        return checkedCommentIds.length > 0 && checkedCommentIds.length === comments.length
    }, [checkedCommentIds.length, comments.length])

    const handleSelectAllComments = useCallback((e: CheckboxChangeEvent) => {
        const checked = e.target.checked
        setComments(prevState => prevState.map(comment => ({ ...comment, checked })))
    }, [])

    const handleShowAllComments = useCallback(() => {
        if (loading) return
        setShowAllComments(prevState => !prevState)
    }, [loading])

    const handleSelectComment = useCallback((commentId: string) => (e: CheckboxChangeEvent) => {
        const checked = e.target.checked
        setComments((prevState) =>
            prevState.map((comment) => ({
                ...comment,
                checked: commentId === comment.id ? checked : comment.checked,
            }))
        )
    }, [])

    const CommentPreviews = useMemo(() => {
        return comments.map((comment) => (
            <Col key={comment.id} span={24}>
                <CommentPreviewWithCheckbox
                    onChange={handleSelectComment(comment.id)}
                    comment={comment}
                />
            </Col>
        ))
    }, [comments, handleSelectComment])

    useEffect(() => {
        setCheckedCommentIds(comments
            .filter((comment) => comment.checked)
            .map((comment) => comment.id)
        )
    }, [comments, setCheckedCommentIds])

    useEffect(() => {
        setHaveAllComments(isAllChecked)
    }, [isAllChecked, setHaveAllComments])

    if (!loading && isEmpty(comments)) {
        return null
    }

    return (
        <Col span={24}>
            <Row gutter={CHECKBOXES_VERTICAL_GUTTER} align='middle' justify='space-between'>
                <Col span={24}>
                    <Row align='middle' justify='space-between'>
                        <Checkbox
                            disabled={comments.length < 1 || loading}
                            indeterminate={isIndeterminate}
                            checked={isAllChecked}
                            children={<b>{HaveAllCommentsLabel}</b>}
                            onChange={handleSelectAllComments}
                        />
                        {comments.length > 0 && <Col>
                            <Row
                                align='middle'
                                onClick={handleShowAllComments}
                                style={CURSOR_POINTER_STYLE}
                            >
                                <Typography.Text style={SHOW_ALL_COMMENTS_LABEL_STYLE}>
                                    {showAllComments ? HideAllCommentsLabel : ShowAllCommentsLabel}
                                </Typography.Text>
                                <ChevronIcon showAllComments={showAllComments} />
                            </Row>
                        </Col>}
                    </Row>
                </Col>
                {showAllComments && (
                    <Col span={24}>
                        <Row gutter={COMMENT_PREVIEWS_VERTICAL_GUTTER}>
                            {CommentPreviews}
                        </Row>
                    </Col>
                )}
            </Row>
        </Col>
    )
}


type ExportToPdfButtonType = (props: { disabled?: boolean }) => JSX.Element

type UseTicketExportToPdfTaskInputType = {
    user: IUser
    ticketId?: string
    where: TicketWhereInput
    sortBy: SortTicketsBy[]
    locale: ResolvedIntlConfig['locale']
    timeZone: string
}

type UseTicketExportToPdfTaskType = (props: UseTicketExportToPdfTaskInputType) => {
    TicketBlanksExportToPdfButton: ExportToPdfButtonType
    TicketBlanksExportToPdfModal: JSX.Element
}

export const useTicketExportToPdfTask: UseTicketExportToPdfTaskType = (props)  => {
    const { ticketId, where, sortBy, locale, timeZone, user } = props

    const intl = useIntl()
    const SaveInPdfTitle = intl.formatMessage({ id: 'pages.condo.ticket.exportBlank.title' })
    const SaveInPdfLabel = intl.formatMessage({ id: 'pages.condo.ticket.exportBlank.SaveToPDF.label' })
    const SaveToPDFTooltipMessage = intl.formatMessage({ id: 'pages.condo.ticket.exportBlank.SaveToPDF.tooltip' })
    const HaveListCompletedWorksLabel = intl.formatMessage({ id: 'pages.condo.ticket.exportBlank.HaveListCompletedWorks.label' })
    const HaveConsumedMaterialsLabel = intl.formatMessage({ id: 'pages.condo.ticket.exportBlank.HaveConsumedMaterials.label' })
    const HaveTotalCostWorkLabel = intl.formatMessage({ id: 'pages.condo.ticket.exportBlank.HaveTotalCostWork.label' })
    const HaveAllCommentsLabel = intl.formatMessage({ id: 'pages.condo.ticket.exportBlank.HaveAllCommentsFromTickets.label' })
    const HaveAllCommentsTooltipMessage = intl.formatMessage({ id: 'pages.condo.ticket.exportBlank.HaveAllComments.tooltip' })

    const [visibleModal, setVisibleModal] = useState<boolean>(false)
    const [haveListCompletedWorks, setHaveListCompletedWorks] = useState<boolean>(false)
    const [haveConsumedMaterials, setHaveConsumedMaterials] = useState<boolean>(false)
    const [haveTotalCostWork, setHaveTotalCostWork] = useState<boolean>(false)
    const [haveAllComments, setHaveAllComments] = useState<boolean>(false)
    const [checkedCommentIds, setCheckedCommentIds] = useState<string[]>([])

    const { TicketExportTask: TaskUIInterface } = useTicketExportTaskUIInterface()

    const { loading, handleRunTask } = useTaskLauncher<TicketExportTaskCreateInput>(TaskUIInterface, {
        dv: 1,
        sender: getClientSideSenderInfo(),
        where,
        format: TicketExportTaskFormatType.Pdf,
        sortBy,
        locale,
        timeZone,
        user: { connect: { id: user?.id || null } },
        options: {
            commentIds: checkedCommentIds,
            haveAllComments,
            haveListCompletedWorks,
            haveConsumedMaterials,
            haveTotalCostWork,
        },
    })

    const resetModal = useCallback(() => {
        setVisibleModal(false)
        setHaveListCompletedWorks(false)
        setHaveConsumedMaterials(false)
        setHaveTotalCostWork(false)
        setHaveAllComments(false)
        setCheckedCommentIds([])
    }, [])

    const handleOpenModal = useCallback(() => {
        setVisibleModal(true)
    }, [])

    const handleCloseModal = useCallback(() => {
        setVisibleModal(false)
        resetModal()
    }, [resetModal])

    const handleChangeCheckbox = useCallback((setter: Dispatch<SetStateAction<boolean>>) => (e: CheckboxChangeEvent) => {
        const checked = e.target.checked
        setter(checked)
    }, [])

    const handleSaveToPdfTask = useCallback(() => {
        const selectedTicketsCount = ticketId ? 1 : where?.id_in?.length || null
        const eventProperties: EventsData['ticket_export_to_pdf_task_start'] = {
            selectedCommentCount: haveAllComments
                ? 'all'
                : (checkedCommentIds.length < 1 ? 'nothing' : 'some'),
            haveAllComments,
            haveListCompletedWorks,
            haveConsumedMaterials,
            haveTotalCostWork,
            selectedTicketsCount,
            mode: selectedTicketsCount === 1
                ? 'single'
                : (selectedTicketsCount > 1 ? 'multiple' : null),
        }

        handleRunTask()
        analytics.track('ticket_export_to_pdf_task_start', eventProperties)
        handleCloseModal()
    }, [checkedCommentIds.length, handleCloseModal, handleRunTask, haveAllComments, haveConsumedMaterials, haveListCompletedWorks, haveTotalCostWork, ticketId, where])

    const TicketBlanksExportToPdfButton = useCallback<ExportToPdfButtonType>(({ disabled }) => {
        return (
            <ButtonWithDisabledTooltip
                title={SaveToPDFTooltipMessage}
                type='secondary'
                loading={loading}
                disabled={disabled}
                onClick={handleOpenModal}
                id='export-tickets-to-pdf'
                children={SaveInPdfLabel}
            />
        )
    }, [SaveToPDFTooltipMessage, loading, handleOpenModal, SaveInPdfLabel])

    const TicketBlanksExportToPdfModal = (
        <Modal
            open={visibleModal}
            onCancel={handleCloseModal}
            title={`${SaveInPdfTitle}:`}
            footer={
                <Button
                    type='primary'
                    onClick={handleSaveToPdfTask}
                    children={SaveInPdfLabel}
                />
            }
            destroyOnClose
        >
            <Col span={24}>
                <Row gutter={CHECKBOXES_VERTICAL_GUTTER}>
                    <Col span={24}>
                        <Checkbox
                            checked={haveListCompletedWorks}
                            children={HaveListCompletedWorksLabel}
                            onChange={handleChangeCheckbox(setHaveListCompletedWorks)}
                        />
                    </Col>
                    <Col span={24}>
                        <Checkbox
                            checked={haveConsumedMaterials}
                            children={HaveConsumedMaterialsLabel}
                            onChange={handleChangeCheckbox(setHaveConsumedMaterials)}
                        />
                    </Col>
                    <Col span={24}>
                        <Checkbox
                            checked={haveTotalCostWork}
                            children={HaveTotalCostWorkLabel}
                            onChange={handleChangeCheckbox(setHaveTotalCostWork)}
                        />
                    </Col>
                    {ticketId && visibleModal
                        ? (
                            <CheckListComments
                                ticketId={String(ticketId)}
                                setCheckedCommentIds={setCheckedCommentIds}
                                checkedCommentIds={checkedCommentIds}
                                setHaveAllComments={setHaveAllComments}
                            />
                        )
                        : (
                            <Col span={24}>
                                <Row align='middle'>
                                    <Checkbox
                                        checked={haveAllComments}
                                        children={<b>{HaveAllCommentsLabel}</b>}
                                        onChange={handleChangeCheckbox(setHaveAllComments)}
                                    />
                                    <Tooltip
                                        title={HaveAllCommentsTooltipMessage}
                                        placement='right'
                                        children={<QuestionCircleOutlined/>}
                                    />
                                </Row>
                            </Col>
                        )}
                </Row>
            </Col>
        </Modal>
    )

    return {
        TicketBlanksExportToPdfButton,
        TicketBlanksExportToPdfModal,
    }
}
