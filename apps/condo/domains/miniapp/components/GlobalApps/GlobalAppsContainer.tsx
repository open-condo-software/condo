import React, { useRef, useEffect, useState, useCallback, useContext } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import get from 'lodash/get'
import isObject from 'lodash/isObject'
import isNull from 'lodash/isNull'
import { v4 as uuidV4 } from 'uuid'
import dayjs from 'dayjs'
import { useAuth } from '@open-condo/next/auth'
import { SortB2BAppsBy } from '@app/condo/schema'
import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { extractOrigin } from '@condo/domains/common/utils/url.utils'
import {
    TASK_MESSAGE_TYPE,
    sendMessage,
    parseMessage,
} from '@condo/domains/common/utils/iframe.utils'
import { B2BApp } from '@condo/domains/miniapp/utils/clientSchema'
import { TasksContext } from '@condo/domains/common/components/tasks/'
import { useMiniappTaskUIInterface } from '@condo/domains/common/hooks/useMiniappTaskUIInterface'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'
import {
    useGlobalAppsFeaturesContext,
    IRequestFeatureHandler,
} from './GlobalAppsFeaturesContext'

const REQUEST_FEATURE_MESSAGE_NAME = 'CondoWebFeatureRequest'
const TASK_GET_PROCESSING_STATUS = 'CondoWebGetProcessingTasks'

export const GlobalAppsContainer: React.FC = () => {
    const { user } = useAuth()
    const { objs, refetch, loading } = B2BApp.useObjects({
        where: {
            isGlobal: true,
            isHidden: false,
        },
        sortBy: [SortB2BAppsBy.CreatedAtAsc],
    })

    const appUrls = objs.map(app => app.appUrl)
    const appOrigins = appUrls.map(extractOrigin)


    const iframeRefs = useRef<Array<HTMLIFrameElement>>([])
    const isGlobalAppsFetched = useRef(false)
    const [isDebug, setIsDebug] = useState(false)
    const { registerFeatures, addFeatureHandler, removeFeatureHandler, features } = useGlobalAppsFeaturesContext()

    const { addTask, updateTask, tasks } = useContext(TasksContext)
    const { MiniAppTask: miniAppTaskUIInterface } = useMiniappTaskUIInterface()


    useHotkeys('d+e+b+u+g', () => setIsDebug(!isDebug), {}, [isDebug])

    useEffect(() => {
        iframeRefs.current = iframeRefs.current.slice(0, appUrls.length)
    }, [appUrls])

    useDeepCompareEffect(() => {
        const globalFeatures = objs.reduce((registeredFeatures, app) => {
            const appOrigin = extractOrigin(app.appUrl)
            const availableFeatures = (app.features || []).filter(featureName => !(featureName in registeredFeatures))
            const appFeatures = Object.assign({}, ...availableFeatures.map(featureName => ({ [featureName]: appOrigin })))

            return {
                ...registeredFeatures,
                ...appFeatures,
            }
        }, {})
        registerFeatures(globalFeatures)
    }, [registerFeatures, objs])

    const handleTask = useCallback((message, event) => {
        const taskRecord = {
            id: get(message, 'id'),
            taskId: message.taskId,
            title: message.taskTitle,
            progress: message.taskProgress,
            description: message.taskDescription,
            status: message.taskStatus,
            sender: event.origin,
            user,
            __typename: 'MiniAppTask',
            createdAt: dayjs().toISOString(),
        }

        if (message.taskOperation === 'create') {
            taskRecord.id = uuidV4()
            const createMiniAppTask = miniAppTaskUIInterface.storage.useCreateTask({}, () => {
                addTask({
                    ...miniAppTaskUIInterface,
                    record: taskRecord,
                })
            })
            createMiniAppTask(taskRecord)

            for (const iframe of iframeRefs.current) {
                const targetOrigin = extractOrigin(iframe.src)
                if (targetOrigin !== taskRecord.sender) continue

                const targetWindow = get(iframe, 'contentWindow', null)
                if (targetWindow) {

                    sendMessage({
                        type: TASK_GET_PROCESSING_STATUS,
                        data: { tasks: [taskRecord] },
                    }, targetWindow, targetOrigin)
                }
            }

        } else if (message.taskOperation === 'update') {
            const updateMiniAppTask = miniAppTaskUIInterface.storage.useUpdateTask({}, () => {
                updateTask(taskRecord)
            })

            updateMiniAppTask(taskRecord, { id: taskRecord.id })
        }
    }, [miniAppTaskUIInterface, addTask, updateTask])

    const handleGetTasks = useCallback((message, event) => {
        const senderTasks = tasks.map(task => task.record)
            .filter((task) => task.sender === event.origin && task.user && get(task, 'user.id') === user.id)

        event.source.postMessage({
            type: TASK_GET_PROCESSING_STATUS,
            data: { tasks: senderTasks },
        }, event.origin)
    }, [tasks])

    const handleMessage = useCallback((event: MessageEvent) => {
        if (!appOrigins.includes(event.origin)) return
        if (!event.data || !isObject(event.data)) return
        const parsedMessage = parseMessage(event.data)
        if (!parsedMessage) return
        const { type, message } = parsedMessage
        if (type === 'system') {
            if (message.type !== TASK_MESSAGE_TYPE) {
                return
            }
            if (message.taskOperation === 'create' || message.taskOperation === 'update') {
                return handleTask(message, event)
            } else if (message.taskOperation === 'get') {
                return handleGetTasks(message, event)
            }
        }
    }, [
        appOrigins,
        handleTask,
        handleGetTasks,
    ])

    const handleFeatureRequest: IRequestFeatureHandler = useCallback((context) => {
        const receiverOrigin = get(features, context.feature)
        if (receiverOrigin) {
            for (const iframe of iframeRefs.current) {
                if (iframe) {
                    const origin = extractOrigin(iframe.src)
                    if (receiverOrigin === origin) {
                        const targetWindow = get(iframe, 'contentWindow', null)
                        if (origin && targetWindow) {
                            sendMessage({
                                type: REQUEST_FEATURE_MESSAGE_NAME,
                                data: context,
                            }, targetWindow, origin)
                        }
                    }
                }
            }
        }
    }, [features])

    useEffect(() => {
        addFeatureHandler(handleFeatureRequest)

        return () => {
            removeFeatureHandler(handleFeatureRequest)
        }
    }, [
        handleFeatureRequest,
        addFeatureHandler,
        removeFeatureHandler,
    ])

    useEffect(() => {
        window.addEventListener('message', handleMessage)

        return () => {
            window.removeEventListener('message', handleMessage)
        }
    }, [handleMessage])

    useEffect(() => {
        if (!isGlobalAppsFetched.current && !loading && !isNull(user)) {
            refetch()
            isGlobalAppsFetched.current = true
        }
    }, [user, loading])

    // Global miniapps allowed only for authenticated users
    if (!user) {
        return null
    }

    return (
        <>
            {appUrls.map((url, index) => (
                <IFrame
                    key={url}
                    src={url}
                    reloadScope='user'
                    ref={el => iframeRefs[index] = el}
                    hidden={!isDebug}
                />
            ))}
        </>
    )
}
