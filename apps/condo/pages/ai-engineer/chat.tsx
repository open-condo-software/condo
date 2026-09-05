import { B2BAppContextStatusType } from '@app/condo/schema'
import { Popover } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Check, Edit, Plus, Share, Star, StarFilled, Trash } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Input, Modal, Space, Tag, Tooltip } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { AIChat } from '@condo/domains/ai/components/AIChat'
import { CoworkLayout, DomaWatermark, LogoCowork } from '@condo/domains/ai/components/Cowork'
import coworkStyles from '@condo/domains/ai/components/Cowork/Cowork.module.css'
import { useAiAssistantsChatStorage } from '@condo/domains/ai/components/Cowork/SavedChatsContext'
import { setSessionId } from '@condo/domains/ai/utils/aiChatStorage'
import { useObjects as useAISkillObjects } from '@condo/domains/ai/utils/clientSchema/AISkill'
import { PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { PageComponentType } from '@condo/domains/common/types'
import { SMART_HOME_CATEGORY } from '@condo/domains/miniapp/constants'
import { B2BAppContext } from '@condo/domains/miniapp/utils/clientSchema'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

const SHARE_COPIED_RESET_TIMEOUT_MS = 2000

const CoworkPage: PageComponentType = () => {
    const intl = useIntl()
    const { organization } = useOrganization()
    const router = useRouter()
    const queryChatId = router.query.chatId as string | undefined

    const placeholder = intl.formatMessage({ id: 'ai.chat.placeholder' })
    const newChatLabel = intl.formatMessage({ id: 'ai.cowork.newChat' })
    const welcomeSubtitle = intl.formatMessage({ id: 'ai.cowork.welcomeSubtitle' })
    const welcomeTitle = intl.formatMessage({ id: 'ai.cowork.title' })
    const welcomeCapabilitiesLabel = intl.formatMessage({ id: 'ai.cowork.welcomeCapabilities' })
    const welcomeNoIntegrationsLabel = intl.formatMessage({ id: 'ai.cowork.welcomeNoIntegrations' })
    const editChatNameLabel = intl.formatMessage({ id: 'ai.cowork.editChatName' })
    const shareLabel = intl.formatMessage({ id: 'ai.cowork.share' })
    const shareCopiedLabel = intl.formatMessage({ id: 'ai.cowork.shareCopied' })
    const deleteChatLabel = intl.formatMessage({ id: 'ai.cowork.deleteChat' })
    const deleteChatConfirmLabel = intl.formatMessage({ id: 'ai.cowork.deleteChatConfirm' })
    const deleteChatConfirmOkLabel = intl.formatMessage({ id: 'ai.cowork.deleteChatConfirmOk' })
    const deleteChatConfirmCancelLabel = intl.formatMessage({ id: 'ai.cowork.deleteChatConfirmCancel' })
    const pinChatLabel = intl.formatMessage({ id: 'ai.cowork.pinChat' })
    const unpinChatLabel = intl.formatMessage({ id: 'ai.cowork.unpinChat' })

    const organizationId = useMemo(() => organization?.id, [organization])

    const { chats, createChat, updateChat, deleteChat, copyChat } = useAiAssistantsChatStorage()

    const { objs: appContexts } = B2BAppContext.useObjects({
        where: {
            organization: { id: organizationId },
            status: B2BAppContextStatusType.Finished,
            deletedAt: null,
        },
    }, {
        skip: !organizationId,
    })

    const smartHomeIntegrations = useMemo(() => {
        if (!appContexts) return []
        return appContexts
            .filter((ctx) => ctx?.app?.category === SMART_HOME_CATEGORY)
            .map((ctx) => ({ id: ctx.app.id, name: ctx.app.name }))
    }, [appContexts])

    const { user } = useAuth()
    const userId = useMemo(() => user?.id, [user])

    const { objs: aiSkills } = useAISkillObjects({
        where: {
            OR: [
                { scope: 'global' },
                { scope: 'organization', organization: { id: organizationId } },
                { scope: 'personal', user: { id: userId } },
            ],
            deletedAt: null,
        },
    }, {
        skip: !organizationId,
    })

    const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null)

    const connectedAppIds = useMemo(() =>
        (appContexts || []).map(ctx => ctx.app?.id).filter(Boolean),
    [appContexts])

    const visibleSkills = useMemo(() => {
        return (aiSkills || []).filter(skill => {
            if (skill.scope === 'personal') return skill.user?.id === userId
            if (skill.scope === 'organization') return skill.organization?.id === organizationId
            if (skill.scope === 'global') return !skill.b2bApp || connectedAppIds.includes(skill.b2bApp.id)
            return false
        })
    }, [aiSkills, userId, organizationId, connectedAppIds])

    // Clear an invalid selected skill (e.g. an integration skill whose app is no longer connected)
    useEffect(() => {
        if (!selectedSkillId) return
        const isVisible = (visibleSkills || []).some(s => s.id === selectedSkillId)
        if (!isVisible) setSelectedSkillId(null)
    }, [selectedSkillId, visibleSkills])

    const suggestions = useMemo(() => {
        const skillExamples = (visibleSkills || []).flatMap((skill) =>
            Array.isArray(skill.examples) ? skill.examples : []
        )
        const staticSuggestions = [
            intl.formatMessage({ id: 'ai.cowork.suggestion.tickets' }),
            intl.formatMessage({ id: 'ai.cowork.suggestion.meters' }),
            intl.formatMessage({ id: 'ai.cowork.suggestion.residents' }),
        ]
        return [...skillExamples, ...staticSuggestions].slice(0, 12)
    }, [visibleSkills, intl])

    const [activeChatId, setActiveChatId] = useState<string | null>(null)
    const [initialMessage, setInitialMessage] = useState('')
    const [inputValue, setInputValue] = useState('')
    const [editingChatName, setEditingChatName] = useState(false)
    const [chatNameInput, setChatNameInput] = useState('')
    const [shareCopied, setShareCopied] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [skillPickerOpen, setSkillPickerOpen] = useState(false)
    const inputRef = useRef<any>(null)
    const chatNameInputRef = useRef<any>(null)

    // URL is the source of truth: ?chatId=xyz loads that chat, no chatId = new chat (welcome screen).
    // chats is read via a ref so that creating a chat (which updates chats) does not re-run this
    // effect before router.push has updated queryChatId — that race cleared activeChatId/initialMessage
    // and prevented the new chat's first message from being sent to the AI.
    const chatsRef = useRef(chats)
    chatsRef.current = chats

    useEffect(() => {
        if (!organizationId) return

        if (queryChatId) {
            const queryChat = chatsRef.current.find((c) => c.id === queryChatId)
            if (queryChat) {
                setActiveChatId(queryChat.id)
                setInitialMessage('')
                return
            }
        }

        setActiveChatId(null)
    }, [organizationId, queryChatId])

    // Pre-fill input from ?prompt= and pre-select skill from ?skillId= (used by Skills page "Run")
    // Both are one-shot: read once, then clean the URL in a single replace to avoid conflicts.
    useEffect(() => {
        if (activeChatId) return

        const prompt = router.query.prompt
        const skillId = router.query.skillId
        const hasPrompt = typeof prompt === 'string' && prompt.trim().length > 0
        const hasSkillId = typeof skillId === 'string' && skillId.trim().length > 0
        if (!hasPrompt && !hasSkillId) return

        if (hasPrompt) {
            setInputValue(prompt)
        }
        if (hasSkillId) {
            setSelectedSkillId(skillId as string)
        }
        void router.replace({ pathname: '/ai-engineer/chat', query: {} }, undefined, { shallow: true })
        if (hasPrompt) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [router, activeChatId])

    const saveSessionId = useCallback((sessionId: string) => {
        if (!organizationId) return
        setSessionId(organizationId, sessionId)
    }, [organizationId])

    const hasStarted = activeChatId !== null

    useEffect(() => {
        if (!hasStarted) {
            setTimeout(() => {
                inputRef.current?.focus()
            }, 100)
        }
    }, [hasStarted])

    const handleStartChat = useCallback(() => {
        if (!organizationId) return
        const trimmedInput = inputValue.trim()
        if (!trimmedInput) return

        const newChat = createChat(trimmedInput.slice(0, 50))
        saveSessionId(newChat.id)
        setInitialMessage(trimmedInput)
        setActiveChatId(newChat.id)
        setInputValue('')
        void router.push(`/ai-engineer/chat?chatId=${newChat.id}`, undefined, { shallow: true })
    }, [organizationId, inputValue, createChat, saveSessionId, router])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key !== 'Enter' || e.shiftKey) return
        e.preventDefault()
        handleStartChat()
    }, [handleStartChat])

    const activeChat = useMemo(() => chats.find((c) => c.id === activeChatId), [chats, activeChatId])

    const handleSaveChatName = useCallback(() => {
        if (!organizationId || !activeChatId) return
        const trimmedName = chatNameInput.trim()
        if (!trimmedName) {
            setEditingChatName(false)
            return
        }
        updateChat(activeChatId, { name: trimmedName.slice(0, 100) })
        setEditingChatName(false)
    }, [organizationId, activeChatId, chatNameInput, updateChat])

    const handleChatNameKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleSaveChatName()
        } else if (e.key === 'Escape') {
            e.preventDefault()
            setEditingChatName(false)
        }
    }, [handleSaveChatName])

    useEffect(() => {
        if (editingChatName) {
            setChatNameInput(activeChat?.name || '')
            setTimeout(() => {
                chatNameInputRef.current?.focus()
                chatNameInputRef.current?.select()
            }, 0)
        }
    }, [editingChatName, activeChat?.name])

    const handleShare = useCallback(async () => {
        if (!activeChatId) return
        const copied = await copyChat(activeChatId)
        if (copied) {
            setShareCopied(true)
            setTimeout(() => setShareCopied(false), SHARE_COPIED_RESET_TIMEOUT_MS)
        }
    }, [activeChatId, copyChat])

    const handleDeleteChat = useCallback(() => {
        if (!activeChatId) return
        deleteChat(activeChatId)
        setIsDeleteModalOpen(false)

        // Navigate to a fresh chat page (the layout's New chat logic will pick an empty one or create a new one)
        void router.push('/ai-engineer/chat')
    }, [activeChatId, deleteChat, router])

    const handleTogglePin = useCallback(() => {
        if (!activeChatId) return
        updateChat(activeChatId, { pinned: !activeChat?.pinned })
    }, [activeChatId, activeChat?.pinned, updateChat])

    const canSend = useMemo(() => Boolean(inputValue.trim()), [inputValue])

    const renderChatHeader = () => {
        if (!hasStarted) return null

        return (
            <div className={coworkStyles.chatHeader}>
                <div className={coworkStyles.chatHeaderLeft}>
                    {editingChatName ? (
                        <Input
                            ref={chatNameInputRef}
                            className={coworkStyles.chatNameInput}
                            value={chatNameInput}
                            onChange={(e) => setChatNameInput(e.target.value)}
                            onKeyDown={handleChatNameKeyDown}
                            onBlur={handleSaveChatName}
                        />
                    ) : (
                        <Tooltip title={editChatNameLabel}>
                            <button
                                type='button'
                                className={coworkStyles.chatNameButton}
                                onClick={() => setEditingChatName(true)}
                            >
                                <span className={coworkStyles.chatNameText}>{activeChat?.name || newChatLabel}</span>
                                <span className={coworkStyles.chatNameEditIcon}><Edit size='small' /></span>
                            </button>
                        </Tooltip>
                    )}
                </div>
                <div className={coworkStyles.chatHeaderRight}>
                    <Tooltip title={activeChat?.pinned ? unpinChatLabel : pinChatLabel}>
                        <Button
                            type='secondary'
                            size='medium'
                            compact
                            minimal
                            icon={activeChat?.pinned ? <StarFilled size='small' /> : <Star size='small' />}
                            onClick={handleTogglePin}
                            aria-label={activeChat?.pinned ? unpinChatLabel : pinChatLabel}
                        />
                    </Tooltip>
                    <Tooltip title={shareCopied ? shareCopiedLabel : shareLabel}>
                        <Button
                            type='secondary'
                            size='medium'
                            compact
                            minimal
                            icon={shareCopied ? <Check size='small' /> : <Share size='small' />}
                            onClick={handleShare}
                            disabled={shareCopied}
                            aria-label={shareLabel}
                        />
                    </Tooltip>
                    <Tooltip title={deleteChatLabel}>
                        <Button
                            type='secondary'
                            size='medium'
                            compact
                            minimal
                            icon={<Trash size='small' />}
                            onClick={() => setIsDeleteModalOpen(true)}
                            aria-label={deleteChatLabel}
                        />
                    </Tooltip>
                </div>
            </div>
        )
    }

    const renderMain = () => {
        if (!hasStarted) {
            return (
                <div className={coworkStyles.welcomeScreen}>
                    <DomaWatermark />
                    <div className={coworkStyles.welcomeHeroLogo}>
                        <LogoCowork title={welcomeTitle} />
                    </div>
                    <div className={coworkStyles.welcomeSubtitle}>
                        {welcomeSubtitle}
                    </div>
                    <div className={coworkStyles.welcomeCapabilities}>
                        {smartHomeIntegrations.length > 0 ? (
                            <>
                                <span className={coworkStyles.welcomeCapabilitiesLabel}>
                                    {welcomeCapabilitiesLabel}
                                </span>
                                {smartHomeIntegrations.map((integration) => (
                                    <Tag
                                        key={integration.id}
                                        icon={<span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.green['5'], display: 'inline-block' }} />}
                                        textColor={colors.gray['7']}
                                        bgColor={colors.gray['1']}
                                    >
                                        {integration.name}
                                    </Tag>
                                ))}
                            </>
                        ) : (
                            <Tag
                                textColor={colors.gray['5']}
                                bgColor='transparent'
                            >
                                {welcomeNoIntegrationsLabel}
                            </Tag>
                        )}
                    </div>
                    <div className={coworkStyles.welcomeInputWrapper}>
                        {selectedSkillId && (() => {
                            const skill = (visibleSkills || []).find(s => s.id === selectedSkillId)
                            if (!skill) return null
                            return (
                                <div style={{ marginBottom: 8 }}>
                                    <Space direction='horizontal' size={8} wrap>
                                        <Tag
                                            key={selectedSkillId}
                                            textColor={colors.gray['7']}
                                            bgColor={colors.gray['1']}
                                        >
                                            {skill.name}
                                        </Tag>
                                    </Space>
                                </div>
                            )
                        })()}
                        <Input.TextArea
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onSubmit={handleStartChat}
                            placeholder={placeholder}
                            autoSize={{ minRows: 1, maxRows: 4 }}
                            isSubmitDisabled={!canSend}
                            bottomPanelUtils={[
                                <Popover
                                    key='skill-picker'
                                    trigger='click'
                                    placement='topLeft'
                                    open={skillPickerOpen}
                                    onOpenChange={setSkillPickerOpen}
                                    content={
                                        <div style={{ maxWidth: 280 }}>
                                            <Space direction='vertical' size={4} width='100%'>
                                                {(visibleSkills || []).slice(0, 10).map((skill) => {
                                                    const isSelected = selectedSkillId === skill.id
                                                    return (
                                                        <Button
                                                            key={skill.id}
                                                            type='secondary'
                                                            size='small'
                                                            block
                                                            icon={isSelected ? <Check size='small' /> : undefined}
                                                            onClick={() => {
                                                                setSelectedSkillId(prev => prev === skill.id ? null : skill.id)
                                                            }}
                                                        >
                                                            {skill.name}
                                                        </Button>
                                                    )
                                                })}
                                            </Space>
                                        </div>
                                    }
                                >
                                    <Button
                                        type='secondary'
                                        size='medium'
                                        minimal
                                        compact
                                        icon={<Plus size='small' />}
                                    />
                                </Popover>,
                            ]}
                        />
                    </div>
                    {suggestions.length > 0 && (
                        <div className={coworkStyles.welcomeSuggestions}>
                            <Space direction='horizontal' size={8} wrap>
                                {suggestions.map((suggestion, idx) => (
                                    <Button
                                        key={idx}
                                        type='secondary'
                                        size='medium'
                                        className={coworkStyles.suggestionButton}
                                        onClick={() => setInputValue(suggestion)}
                                    >
                                        {suggestion}
                                    </Button>
                                ))}
                            </Space>
                        </div>
                    )}
                </div>
            )
        }

        const selectedSkillObjects = selectedSkillId
            ? (() => {
                const s = (visibleSkills || []).find(skill => skill.id === selectedSkillId)
                if (!s) return []
                return [{
                    id: s.id,
                    name: s.name,
                    description: s.description,
                    content: s.content,
                    allowedTools: s.allowedTools || undefined,
                    examples: Array.isArray(s.examples) ? s.examples : undefined,
                }]
            })()
            : []

        return (
            <div className={coworkStyles.chatContent}>
                {activeChatId && (
                    <div className={coworkStyles.chatContainer}>
                        <AIChat
                            key={activeChatId}
                            aiSessionId={activeChatId}
                            initialMessage={initialMessage || undefined}
                            showWelcomeMessage={false}
                            selectedSkills={selectedSkillObjects}
                            availableSkills={visibleSkills}
                            selectedSkillId={selectedSkillId}
                            onSkillSelect={setSelectedSkillId}
                        />
                    </div>
                )}
            </div>
        )
    }

    return (
        <PageWrapper className={coworkStyles.chatPageWrapper}>
            {renderChatHeader()}
            {renderMain()}
            <Modal
                open={isDeleteModalOpen}
                title={deleteChatConfirmLabel}
                onCancel={() => setIsDeleteModalOpen(false)}
                footer={
                    <div className={coworkStyles.modalFooter}>
                        <Button type='secondary' onClick={() => setIsDeleteModalOpen(false)}>
                            {deleteChatConfirmCancelLabel}
                        </Button>
                        <Button type='primary' onClick={handleDeleteChat}>
                            {deleteChatConfirmOkLabel}
                        </Button>
                    </div>
                }
            />
        </PageWrapper>
    )
}

CoworkPage.requiredAccess = OrganizationRequired
CoworkPage.container = CoworkLayout

export default CoworkPage
