import { ApolloError } from '@apollo/client'
import { useGetUserMessagesLazyQuery, useGetUserMessagesQuery } from '@app/condo/gql'
import throttle from 'lodash/throttle'
import uniqBy from 'lodash/uniqBy'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

import { useBroadcastChannel } from '@condo/domains/common/hooks/useBroadcastChannel'
import { useExecuteWithLock } from '@condo/domains/common/hooks/useExecuteWithLock'
import { UserMessageType } from '@condo/domains/notification/utils/client/constants'
import { MessageTypesAllowedToFilterType } from '@condo/domains/notification/utils/client/constants'


type UserPollUserMessagesArgsType = {
    isDropdownOpen: boolean
    messageTypesToFilter: MessageTypesAllowedToFilterType
    skipQueryMessagesCondition?: boolean
}
type UserPollUserMessagesReturnType = {
    userMessages: UserMessageType[]
    messagesListRef: ReturnType<typeof useRef<HTMLDivElement>>
    newMessagesLoading: boolean
    moreMessagesLoading: boolean
    clearLoadedMessages: () => void
}
type UsePollUserMessagesType = (args: UserPollUserMessagesArgsType) => UserPollUserMessagesReturnType
type UserMessagesBroadcastMessageType = {
    error?: ApolloError
    messages?: UserMessageType[]
    clear?: boolean
}

const USER_MESSAGES_LIST_POLL_LOCK_NAME = 'user-messages-list'
const USER_MESSAGES_LIST_POLL_CHANNEL_NAME = 'user-messages-list'
const USER_MESSAGES_LIST_POLL_INTERVAL_IN_MS = 15 * 1000


export const useUserMessages: UsePollUserMessagesType = ({ isDropdownOpen, messageTypesToFilter, skipQueryMessagesCondition }) => {
    const { user } = useAuth()
    const { organization } = useOrganization()

    const messagesListRef = useRef<HTMLDivElement>()
    const userId = useMemo(() => user?.id, [user?.id])
    const organizationId = useMemo(() => organization?.id, [organization?.id])
    const queryVariables = useMemo(() => ({
        userId,
        organizationId,
        types: messageTypesToFilter,
    }), [messageTypesToFilter, organizationId, userId])

    const [isPollingTab, setIsPollingTab] = useState<boolean>(false)
    const [userMessages, setUserMessages] = useState<UserMessageType[]>([])
    const [isAllMessagesLoaded, setIsAllMessagesLoaded] = useState<boolean>(false)
    const [moreMessagesLoading, setMoreMessagesLoading] = useState<boolean>(false)

    useEffect(() => {
        setUserMessages([])
        setIsAllMessagesLoaded(false)
        setMoreMessagesLoading(false)
    }, [userId, organizationId])

    const {
        data: newMessagesData,
        error,
        startPolling,
        stopPolling,
        loading: newMessagesLoading,
    } = useGetUserMessagesQuery({
        variables: queryVariables,
        skip: skipQueryMessagesCondition,
    })

    // New messages polling in one tab logic
    useExecuteWithLock(USER_MESSAGES_LIST_POLL_LOCK_NAME, () => setIsPollingTab(true))

    const handleBroadcastMessage = useCallback(({ error, messages }) => {
        if (error) {
            console.error(error)
            return
        }

        setUserMessages(previousMessagesState => {
            return uniqBy([...previousMessagesState, ...messages], 'id')
                .sort((firstMessage, secondMessage) => {
                    return new Date(secondMessage.createdAt).getTime() - new Date(firstMessage.createdAt).getTime()
                })
        })
    }, [])

    const { sendMessageToBroadcastChannel } = useBroadcastChannel<UserMessagesBroadcastMessageType>(
        USER_MESSAGES_LIST_POLL_CHANNEL_NAME,
        handleBroadcastMessage
    )

    useEffect(() => {
        if (isPollingTab) {
            startPolling(USER_MESSAGES_LIST_POLL_INTERVAL_IN_MS)
        } else {
            stopPolling()
        }
    }, [isPollingTab, startPolling, stopPolling])

    // Send new messages to all tabs
    useDeepCompareEffect(() => {
        const messages = (newMessagesData?.messages || []) as UserMessageType[]
        sendMessageToBroadcastChannel({ error, messages })
    }, [newMessagesData?.messages, error])


    // Infinity scroll logic
    const [fetchMoreUserMessages] = useGetUserMessagesLazyQuery({
        variables: queryVariables,
    })

    const fetchMoreMessages = useCallback(async () => {
        const fetchMoreResult = await fetchMoreUserMessages({
            variables: {
                skip: userMessages.length || 0,
            },
            fetchPolicy: 'network-only',
        })

        const messages = (fetchMoreResult?.data?.messages || []) as UserMessageType[]
        const allMessagesLoaded = messages.length === 0

        setUserMessages(previousMessagesState => {
            return uniqBy([...previousMessagesState, ...messages], 'id')
                .sort((firstMessage, secondMessage) => {
                    return new Date(secondMessage.createdAt).getTime() - new Date(firstMessage.createdAt).getTime()
                })
        })

        if (allMessagesLoaded) {
            setIsAllMessagesLoaded(true)
        }
    }, [fetchMoreUserMessages, userMessages.length])

    const throttledFetchMore = useMemo( () => throttle(fetchMoreMessages, 500), [fetchMoreMessages])

    const handleScroll = useCallback(async () => {
        const list = messagesListRef.current
        const isScrolledToBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 50

        if (list && isScrolledToBottom && !isAllMessagesLoaded && !moreMessagesLoading) {
            setMoreMessagesLoading(true)
            await throttledFetchMore()
            setMoreMessagesLoading(false)
        }
    }, [isAllMessagesLoaded, moreMessagesLoading, throttledFetchMore])

    useEffect(() => {
        const list = messagesListRef.current

        if (list) {
            list.addEventListener('scroll', handleScroll)
            return () => {
                list.removeEventListener('scroll', handleScroll)
            }
        }
    }, [handleScroll, isDropdownOpen])

    // Clear all scrolled messages after close dropdown
    const clearLoadedMessages = useCallback(() => {
        const messages = (newMessagesData?.messages || []) as UserMessageType[]

        setUserMessages(messages)
        setIsAllMessagesLoaded(false)
    }, [newMessagesData?.messages])

    return { userMessages, messagesListRef, moreMessagesLoading, newMessagesLoading, clearLoadedMessages }
}