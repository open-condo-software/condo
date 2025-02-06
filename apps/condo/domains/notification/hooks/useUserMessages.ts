import { ApolloError } from '@apollo/client'
import { GetUserMessagesQueryVariables, useGetUserMessagesLazyQuery, useGetUserMessagesQuery } from '@app/condo/gql'
import throttle from 'lodash/throttle'
import uniqBy from 'lodash/uniqBy'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'

import { useBroadcastChannel } from '@condo/domains/common/hooks/useBroadcastChannel'
import { useExecuteWithLock } from '@condo/domains/common/hooks/useExecuteWithLock'
import { UserMessageType } from '@condo/domains/notification/utils/client/constants'


type UserPollUserMessagesArgsType = {
    isDropdownOpen: boolean
    queryMessagesVariables: GetUserMessagesQueryVariables
    skipQueryMessagesCondition?: boolean
}
type UserPollUserMessagesReturnType = {
    userMessages: UserMessageType[]
    messagesListRef: ReturnType<typeof useRef<HTMLDivElement>>
    moreMessagesLoading: boolean
}
type UsePollUserMessagesType = (args: UserPollUserMessagesArgsType) => UserPollUserMessagesReturnType
type UserMessagesBroadcastMessageType = {
    error?: ApolloError
    messages: UserMessageType[]
    allMessagesLoaded?: boolean
}

const USER_MESSAGES_LIST_POLL_LOCK_NAME = 'user-messages-list'
const USER_MESSAGES_LIST_POLL_CHANNEL_NAME = 'user-messages-list'
const USER_MESSAGES_LIST_POLL_INTERVAL_IN_MS = 5 * 1000


export const useUserMessages: UsePollUserMessagesType = ({ isDropdownOpen, queryMessagesVariables, skipQueryMessagesCondition }) => {
    const [isPollingTab, setIsPollingTab] = useState<boolean>(false)
    const [userMessages, setUserMessages] = useState<UserMessageType[]>([])
    const [isAllMessagesLoaded, setIsAllMessagesLoaded] = useState<boolean>(false)
    const [moreMessagesLoading, setMoreMessagesLoading] = useState<boolean>(false)

    const messagesListRef = useRef<HTMLDivElement>()

    const {
        data: newMessagesData,
        error,
        startPolling,
        stopPolling,
    } = useGetUserMessagesQuery({
        variables: queryMessagesVariables,
        skip: skipQueryMessagesCondition,
    })

    // New messages polling in one tab logic

    useExecuteWithLock(USER_MESSAGES_LIST_POLL_LOCK_NAME, () => setIsPollingTab(true))

    const handleBroadcastMessage = useCallback(({ error, messages, allMessagesLoaded }) => {
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

        if (allMessagesLoaded) {
            setIsAllMessagesLoaded(true)
        }
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

    useDeepCompareEffect(() => {
        const messages = (newMessagesData?.messages || []) as UserMessageType[]
        sendMessageToBroadcastChannel({ error, messages })
    }, [newMessagesData?.messages, isPollingTab, error])


    // Inifinity scroll logic

    const [fetchMoreUserMessages] = useGetUserMessagesLazyQuery({
        variables: queryMessagesVariables,
    })

    const fetchMoreMessages = useCallback(async () => {
        const fetchMoreResult = await fetchMoreUserMessages({
            variables: {
                skip: userMessages.length || 0,
            },
            fetchPolicy: 'network-only',
        })

        const messages = (fetchMoreResult?.data?.messages || []) as UserMessageType[]
        const error = fetchMoreResult?.error
        const allMessagesLoaded = messages.length === 0

        sendMessageToBroadcastChannel({ error, messages, allMessagesLoaded })
    }, [fetchMoreUserMessages, sendMessageToBroadcastChannel, userMessages.length])

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

    return { userMessages, messagesListRef, moreMessagesLoading }
}