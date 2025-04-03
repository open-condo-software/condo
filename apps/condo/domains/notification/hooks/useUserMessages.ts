import { ApolloError } from '@apollo/client'
import { useGetUserMessagesLazyQuery, useGetUserMessagesQuery } from '@app/condo/gql'
import throttle from 'lodash/throttle'
import uniqBy from 'lodash/uniqBy'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useAuth } from '@open-condo/next/auth'

import { useBroadcastChannel } from '@condo/domains/common/hooks/useBroadcastChannel'
import { useExecuteWithLock } from '@condo/domains/common/hooks/useExecuteWithLock'
import { UserMessageType } from '@condo/domains/notification/utils/client/constants'
import { MessageTypeAllowedToFilterType } from '@condo/domains/notification/utils/client/constants'


type UserPollUserMessagesArgsType = {
    isDropdownOpen: boolean
    messageTypesToFilter: Array<MessageTypeAllowedToFilterType>
    organizationIdsToFilter: Array<string>
    skipQueryMessagesCondition?: boolean
}
type UserPollUserMessagesReturnType = {
    userMessages: Array<UserMessageType>
    messagesListRef: ReturnType<typeof useRef<HTMLDivElement>>
    newMessagesLoading: boolean
    moreMessagesLoading: boolean
    clearLoadedMessages: () => void
}
type UsePollUserMessagesType = (args: UserPollUserMessagesArgsType) => UserPollUserMessagesReturnType
type UserMessagesBroadcastMessageType = {
    error?: ApolloError
    messages?: Array<UserMessageType>
    clear?: boolean
}

const USER_MESSAGES_LIST_POLL_LOCK_NAME = 'user-messages-list'
const USER_MESSAGES_LIST_POLL_CHANNEL_NAME = 'user-messages-list'
const USER_MESSAGES_LIST_POLL_INTERVAL_IN_MS = 60 * 1000


export const useUserMessages: UsePollUserMessagesType = ({
    isDropdownOpen,
    messageTypesToFilter,
    organizationIdsToFilter,
    skipQueryMessagesCondition,
}) => {
    const { user } = useAuth()
    const { persistor } = useCachePersistor()

    const messagesListRef = useRef<HTMLDivElement>()
    const userId = useMemo(() => user?.id, [user?.id])
    const queryVariables = useMemo(() => ({
        userId,
        organizationIds: organizationIdsToFilter,
        types: messageTypesToFilter,
    }), [messageTypesToFilter, organizationIdsToFilter, userId])

    const [isPollingTab, setIsPollingTab] = useState<boolean>(false)
    const [userMessages, setUserMessages] = useState<UserMessageType[] | undefined>()
    const [isAllMessagesLoaded, setIsAllMessagesLoaded] = useState<boolean>(false)
    const [moreMessagesLoading, setMoreMessagesLoading] = useState<boolean>(false)

    const {
        data: newMessagesData,
        error,
        startPolling,
        stopPolling,
        loading: newMessagesLoading,
    } = useGetUserMessagesQuery({
        variables: queryVariables,
        skip: !persistor || skipQueryMessagesCondition,
    })

    const clearLoadedMessages = useCallback(() => {
        const messages = newMessagesData?.messages?.filter(Boolean) as Array<UserMessageType>

        setUserMessages(messages)
        setIsAllMessagesLoaded(false)
        setMoreMessagesLoading(false)
    }, [newMessagesData?.messages])

    useEffect(() => {
        clearLoadedMessages()
    }, [clearLoadedMessages])

    // New messages polling in one tab logic
    useExecuteWithLock(USER_MESSAGES_LIST_POLL_LOCK_NAME, () => setIsPollingTab(true))

    const handleBroadcastMessage = useCallback(({ error, messages }) => {
        if (error) {
            console.error(error)
            return
        }

        setUserMessages(previousMessagesState => {
            return uniqBy([...(previousMessagesState || []), ...messages], 'id')
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
        const messages = newMessagesData?.messages?.filter(Boolean) as Array<UserMessageType>

        if (messages || error) {
            sendMessageToBroadcastChannel({ error, messages })
        }
    }, [newMessagesData?.messages, error])


    // Infinity scroll logic
    const [fetchMoreUserMessages] = useGetUserMessagesLazyQuery({
        variables: queryVariables,
    })

    const fetchMoreMessages = useCallback(async () => {
        const fetchMoreResult = await fetchMoreUserMessages({
            variables: {
                skip: userMessages?.length || 0,
            },
            fetchPolicy: 'network-only',
        })

        const messages = (fetchMoreResult?.data?.messages?.filter(Boolean) || []) as Array<UserMessageType>
        const allMessagesLoaded = messages.length === 0

        setUserMessages(previousMessagesState => {
            return uniqBy([...(previousMessagesState || []), ...messages], 'id')
                .sort((firstMessage, secondMessage) => {
                    return new Date(secondMessage.createdAt).getTime() - new Date(firstMessage.createdAt).getTime()
                })
        })

        if (allMessagesLoaded) {
            setIsAllMessagesLoaded(true)
        }
    }, [fetchMoreUserMessages, userMessages?.length])

    const throttledFetchMore = useMemo( () => throttle(fetchMoreMessages, 500), [fetchMoreMessages])

    const handleScroll = useCallback(async () => {
        const list = messagesListRef.current
        const isScrolledToBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 100

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

    return { userMessages, messagesListRef, moreMessagesLoading, newMessagesLoading, clearLoadedMessages }
}