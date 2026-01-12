import {
    UpdateTicketCommentMutationHookResult,
} from '@app/condo/gql'
import { UserTypeType } from '@app/condo/schema'
import { Empty } from 'antd'
import cookie from 'js-cookie'
import React, { MouseEventHandler, UIEventHandler, useCallback, useEffect, useMemo } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils'
import { useIntl } from '@open-condo/next/intl'
import { Tooltip, Tour, Typography } from '@open-condo/ui'

import { AIFlowButton } from '@condo/domains/ai/components/AIFlowButton'
import { Loader } from '@condo/domains/common/components/Loader'
import { NoSubscriptionTooltip } from '@condo/domains/subscription/components'
import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'
import { GENERATE_COMMENT_TOUR_STEP_CLOSED_COOKIE } from '@condo/domains/ticket/constants/common'

import { Comment } from './Comment'
import styles from './Comments.module.css'

import { CommentWithFiles } from '.'

const EmptyCommentsContainer = ({ PromptTitleMessage, PromptDescriptionMessage, AiButton }) => (
    <div className={styles.emptyContainer}>
        <Empty
            image={null}
            description={
                <>
                    <Typography.Paragraph strong>
                        {PromptTitleMessage}
                    </Typography.Paragraph>
                    <Typography.Paragraph size='medium' type='secondary'>
                        {PromptDescriptionMessage}
                    </Typography.Paragraph>
                    {AiButton}
                </>
            }
        />
    </div>
)

type CommentsTabContentProps = {
    comments: CommentWithFiles[]
    updateAction: UpdateTicketCommentMutationHookResult[0]
    PromptTitleMessage: string
    PromptDescriptionMessage: string
    editableComment: CommentWithFiles
    setEditableComment: (value: CommentWithFiles) => void
    handleBodyScroll: UIEventHandler<HTMLDivElement>
    bodyRef: React.RefObject<HTMLDivElement>
    sending: boolean
    generateCommentEnabled: boolean
    generateCommentOnClickHandler: MouseEventHandler<HTMLElement>
    generateCommentLoading: boolean
    showGenerateCommentWithoutComments: boolean
    commentType: string
}

export const CommentsTabContent: React.FC<CommentsTabContentProps> = ({
    sending,
    handleBodyScroll,
    bodyRef,
    comments,
    updateAction,
    PromptTitleMessage,
    PromptDescriptionMessage,
    editableComment,
    setEditableComment,
    generateCommentEnabled,
    generateCommentOnClickHandler,
    generateCommentLoading,
    showGenerateCommentWithoutComments,
    commentType,
}) => {
    const intl = useIntl()
    const GenerateResponseMessage = intl.formatMessage({ id: 'ai.generateResponse' })
    const GenerateResponseTooltipMessage = intl.formatMessage({ id: 'ai.generateResponseWithAI' })
    const GenerateCommentMessage = intl.formatMessage({ id: 'ai.generateComment' })
    const GenerateCommentTourStepTitle = intl.formatMessage({ id: 'ai.generateComment.tourStepTitle' })
    const GenerateCommentTourStepDescription = intl.formatMessage({ id: 'ai.generateComment.tourStepDescription' })

    const { isFeatureAvailable } = useOrganizationSubscription()
    const hasAiFeature = isFeatureAvailable('ai')

    const lastComment = useMemo(() => comments?.[0], [comments])
    const showGenerateAnswerButton = useMemo(() =>
        generateCommentEnabled && lastComment?.user?.type === UserTypeType.Resident,
    [generateCommentEnabled, lastComment?.user?.type])

    const commentsToRender = useMemo(() =>
        comments
            .map(comment => {
                const deleteAction = async ({ id }) => {
                    await updateAction({
                        variables: {
                            id,
                            data: {
                                deletedAt: new Date().toISOString(),
                                dv: 1,
                                sender: getClientSideSenderInfo(),
                            },
                        },
                    })
                }

                return (
                    <React.Fragment key={comment.id}>
                        <Comment
                            comment={comment}
                            deleteAction={deleteAction}
                            setEditableComment={setEditableComment}
                            hasInteractiveLinks={comment.user?.type === UserTypeType.Staff}
                        />
                        {
                            showGenerateAnswerButton && lastComment?.id === comment.id && (
                                hasAiFeature ? (
                                    <Tooltip placement='left' mouseEnterDelay={1.5} title={GenerateResponseTooltipMessage}>
                                        <div className={styles.generateAnswerButtonWrapper}>
                                            <AIFlowButton
                                                loading={generateCommentLoading}
                                                onClick={generateCommentOnClickHandler}
                                            >
                                                {GenerateResponseMessage}
                                            </AIFlowButton>
                                        </div>
                                    </Tooltip>
                                ) : (
                                    <NoSubscriptionTooltip>
                                        <div className={styles.generateAnswerButtonWrapper}>
                                            <AIFlowButton disabled>
                                                {GenerateResponseMessage}
                                            </AIFlowButton>
                                        </div>
                                    </NoSubscriptionTooltip>
                                )
                            )
                        }
                    </React.Fragment>
                )
            }), [
        GenerateResponseMessage, GenerateResponseTooltipMessage, comments, editableComment,
        generateCommentLoading, generateCommentOnClickHandler, lastComment?.id, setEditableComment,
        showGenerateAnswerButton, updateAction, hasAiFeature,
    ])

    const { currentStep, setCurrentStep } = Tour.useTourContext()

    useEffect(() => {
        const isTipHidden = cookie.get(GENERATE_COMMENT_TOUR_STEP_CLOSED_COOKIE) || false
        setCurrentStep(isTipHidden ? 0 : 1)
    }, [setCurrentStep, commentType])

    const closeTourStep = useCallback(() => {
        if (currentStep === 1) {
            cookie.set(GENERATE_COMMENT_TOUR_STEP_CLOSED_COOKIE, true)
            setCurrentStep(0)
        }
    }, [currentStep, setCurrentStep])

    const handleClickGenerateCommentButton = useCallback(async (event) => {
        closeTourStep()
        await generateCommentOnClickHandler(event)
    }, [closeTourStep, generateCommentOnClickHandler])

    return (
        <>
            {comments.length === 0 ? (
                <div className={styles.commentBody}>
                    <EmptyCommentsContainer
                        PromptTitleMessage={PromptTitleMessage}
                        PromptDescriptionMessage={PromptDescriptionMessage}
                        AiButton={<div className={styles.generateCommentButtonWrapper}>
                            {showGenerateCommentWithoutComments && (
                                hasAiFeature ? (
                                    <Tour.TourStep
                                        step={1}
                                        title={GenerateCommentTourStepTitle}
                                        message={GenerateCommentTourStepDescription}
                                        onClose={closeTourStep}
                                    >
                                        <div className={styles.generateCommentInnerButtonWrapper}>
                                            <AIFlowButton
                                                loading={generateCommentLoading}
                                                onClick={handleClickGenerateCommentButton}
                                            >
                                                {GenerateCommentMessage}
                                            </AIFlowButton>
                                        </div>
                                    </Tour.TourStep>
                                ) : (
                                    <NoSubscriptionTooltip>
                                        <div className={styles.generateCommentInnerButtonWrapper}>
                                            <AIFlowButton disabled>
                                                {GenerateCommentMessage}
                                            </AIFlowButton>
                                        </div>
                                    </NoSubscriptionTooltip>
                                )
                            )}
                        </div> }
                    />
                </div>
            ) : (
                <div className={styles.commentBody} ref={bodyRef} onScroll={handleBodyScroll}>
                    {sending && <Loader className={styles.loader}/>}
                    {commentsToRender}
                </div>
            )}
        </>
    )
}
