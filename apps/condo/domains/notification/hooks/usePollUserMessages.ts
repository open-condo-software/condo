import { ApolloError } from '@apollo/client'
import { GetUserMessagesQueryVariables, useGetUserMessagesQuery } from '@app/condo/gql'
import { useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'

import { useBroadcastChannel } from '@condo/domains/common/hooks/useBroadcastChannel'
import { useExecuteWithLock } from '@condo/domains/common/hooks/useExecuteWithLock'
import { USER_MESSAGE_LIST_POLL_INTERVAL_IN_MS, UserMessageType } from '@condo/domains/notification/utils/client/constants'


type UserPollUserMessagesArgsType = {
    queryMessagesVariables: GetUserMessagesQueryVariables
    skipQueryMessagesCondition?: boolean
}
type UserPollUserMessagesReturnType = {
    userMessages: UserMessageType[]
}
type UsePollUserMessagesType = (args: UserPollUserMessagesArgsType) => UserPollUserMessagesReturnType
type UserMessagesBroadcastMessageType = { error?: ApolloError, messages: UserMessageType[] }

const USER_MESSAGES_POLL_LOCK_NAME = 'user-messages-list'
const USER_MESSAGES_POLL_CHANNEL_NAME = 'user-messages-list'

export const usePollUserMessages: UsePollUserMessagesType = ({ queryMessagesVariables, skipQueryMessagesCondition }) => {
    const [isPollingTab, setIsPollingTab] = useState<boolean>(false)
    const [userMessages, setUserMessages] = useState<UserMessageType[]>([])

    useExecuteWithLock(USER_MESSAGES_POLL_LOCK_NAME, () => {
        setIsPollingTab(true)
    })
    const {
        sendMessageToBroadcastChannel,
    } = useBroadcastChannel<UserMessagesBroadcastMessageType>(USER_MESSAGES_POLL_CHANNEL_NAME, ({ error, messages }) => {
        if (error) {
            console.error(error)
            return
        }

        setUserMessages(messages)
    })

    const { data, error } = useGetUserMessagesQuery({
        variables: queryMessagesVariables,
        pollInterval: USER_MESSAGE_LIST_POLL_INTERVAL_IN_MS,
        skip: !isPollingTab || skipQueryMessagesCondition,
    })

    useDeepCompareEffect(() => {
        if (!isPollingTab) return

        const messages = (data?.messages || []) as UserMessageType[]
        sendMessageToBroadcastChannel({ error, messages })
    }, [data?.messages, error])

    return { userMessages }
}