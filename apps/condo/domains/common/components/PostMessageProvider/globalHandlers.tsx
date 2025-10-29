import { notification } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import omit from 'lodash/omit'
import pickBy from 'lodash/pickBy'
import { useRouter } from 'next/router'
import React, { useCallback, useState } from 'react'

import type { CondoBridgeResultResponseEvent } from '@open-condo/bridge'
import { generateUUIDv4 } from '@open-condo/miniapp-utils'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Modal } from '@open-condo/ui'
import type { ModalProps } from '@open-condo/ui'

import { useTasks } from '@condo/domains/common/components/tasks/TasksContextProvider'
import { TASK_PROCESSING_STATUS, TASK_COMPLETED_STATUS } from '@condo/domains/common/constants/tasks'
import { useMiniappTaskUIInterface } from '@condo/domains/common/hooks/useMiniappTaskUIInterface'
import { extractOrigin } from '@condo/domains/common/utils/url.utils'
import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'
import { STAFF } from '@condo/domains/user/constants/common'

import type { RequestHandler } from './types'


type OpenModalRecord = {
    destroy: () => void
    update: (opts: ModalProps) => void
}

export const handleNotification: RequestHandler<'CondoWebAppShowNotification'> = (params) => {
    const { type, ...restParams } = params
    notification[type](restParams)
    return { success: true }
}


export const useModalHandler: () => [
    RequestHandler<'CondoWebAppShowModalWindow'>,
    RequestHandler<'CondoWebAppUpdateModalWindow'>,
    RequestHandler<'CondoWebAppCloseModalWindow'>,
    React.ReactElement,
] = () => {
    const [openModals, setOpenModals] = useState<{ [id: string]: OpenModalRecord }>({})
    const [show, ContextHandler] = Modal.useModal()

    const handleShowModal = useCallback<RequestHandler<'CondoWebAppShowModalWindow'>>((params, origin, source) => {
        const { title, url, size = 'small' } = params

        // Throw error if:
        // 1. Origin does not match with event origin AND
        // 2. (its SSR OR sender is not condo itself)
        if (extractOrigin(url) !== origin && (typeof window === 'undefined' || window.origin !== origin)) {
            throw new Error('Forbidden url. Url must have same origin as sender')
        }
        if (!isSafeUrl(url)) {
            throw new Error('Forbidden url. Your url is probably injected')
        }

        const modalId = generateUUIDv4()
        // NOTE: Patch url with modalId, so it can be closed by itself as well as by sender window
        const urlWithMeta = new URL(url)
        urlWithMeta.searchParams.set('modalId', modalId)

        // NOTE: If user close modal - CondoWebAppCloseModalWindowResult will be sent to opener,
        // but there will be no requestId, since it's not a response, but side-effect
        // TODO(DOMA-5563): Think about separated namespace for side-effects
        const data: CondoBridgeResultResponseEvent<'CondoWebAppCloseModalWindow'> = {
            type: 'CondoWebAppCloseModalWindowResult',
            data: {
                success: true,
                modalId,
            },
        }

        const handleClose = () => {
            source.postMessage(data, origin)
        }

        const { destroy, update } = show({
            title,
            width: size,
            children: (
                <IFrame
                    src={urlWithMeta.toString()}
                    reloadScope='organization'
                    withLoader
                    withResize
                    allowFullscreen
                />
            ),
            onCancel: handleClose,
        })

        setOpenModals(prev => ({ ...prev, [modalId]: { destroy, update } }))

        return { modalId }
    }, [show])

    const handleCloseModal = useCallback<RequestHandler<'CondoWebAppCloseModalWindow'>>(({ modalId }) => {
        if (modalId in openModals) {
            openModals[modalId].destroy()
            setOpenModals(omit(openModals, modalId))
            return { success: true, modalId }
        }

        throw new Error('Non-existent modalId')
    }, [openModals])

    const handleUpdateModal = useCallback<RequestHandler<'CondoWebAppUpdateModalWindow'>>(({ modalId, data }) => {
        if (modalId in openModals) {
            const newConfig: ModalProps = { open: true }
            if (data.title) {
                newConfig.title = data.title
            }
            if (data.size) {
                newConfig.width = data.size
            }

            openModals[modalId].update(newConfig)
            return { updated: true }
        }

        throw new Error('Non-existent modalId')
    }, [openModals])

    return [handleShowModal, handleUpdateModal, handleCloseModal, ContextHandler]
}

export const useLaunchParamsHandler: () => RequestHandler<'CondoWebAppGetLaunchParams'> = () => {
    const { locale } = useIntl()
    const { user } = useAuth()
    const { organization } = useOrganization()
    const userId = get(user, 'id', null)
    const organizationId = get(organization, 'id', null)
    return useCallback(() => {
        return {
            condoUserId: userId,
            condoUserType: STAFF,
            condoLocale: locale,
            condoContextEntity: 'Organization',
            condoContextEntityId: organizationId,
        }
    }, [userId, organizationId, locale])
}

export const useShowProgressBarHandler: () => RequestHandler<'CondoWebAppShowProgressBar'> = () => {
    const { user } = useAuth()
    const { addTask } = useTasks()
    const { MiniAppTask: miniAppTaskUIInterface } = useMiniappTaskUIInterface()
    const userId = get(user, 'id', null)

    const createTaskOp = miniAppTaskUIInterface.storage.useCreateTask({}, (record) => {
        addTask({
            ...miniAppTaskUIInterface,
            record,
        })
    })

    return useCallback(({
        message,
        description,
        externalTaskId },
    origin) => {
        const id = generateUUIDv4()
        const taskRecord = {
            id,
            taskId: externalTaskId,
            title: message,
            description,
            progress: 0,
            status: TASK_PROCESSING_STATUS,
            user: { id: userId },
            sender: origin,
            createdAt: dayjs().toISOString(),
            __typename: 'MiniAppTask',
        }

        createTaskOp(taskRecord)

        return { barId: id }
        // TODO(DOMA-5171): Adding miniAppTaskUIInterface in deps causing rerender hell!
    }, [userId])
}

export const useGetActiveProgressBarsHandler: () => RequestHandler<'CondoWebAppGetActiveProgressBars'> = () => {
    const { user } = useAuth()
    const { tasks } = useTasks()
    const userId = get(user, 'id', null)

    return useCallback((params, origin) => {
        return {
            bars: tasks
                .map(task => task.record)
                .filter(task => task.sender === origin &&
                    task.user && task.user && task.user.id === userId &&
                    task.status === TASK_PROCESSING_STATUS &&
                    typeof task.progress === 'number'
                )
                .map(task => ({
                    id: task.id,
                    message: task.title,
                    description: task.description,
                    progress: task.progress as number,
                    externalTaskId: task.taskId,
                })),
        }
    }, [userId, tasks])
}

export const useUpdateProgressBarHandler: () => RequestHandler<'CondoWebAppUpdateProgressBar'> = () => {
    const { user } = useAuth()
    const { updateTask } = useTasks()
    const { MiniAppTask: miniAppTaskUIInterface } = useMiniappTaskUIInterface()
    const userId = get(user, 'id', null)

    const updateTaskOperation = miniAppTaskUIInterface.storage.useUpdateTask({}, (record) => {
        updateTask(record)
    })

    return useCallback(({ barId, data }, origin) => {
        const taskRecord = {
            id: barId,
            title: data.message,
            description: data.description,
            progress: data.progress,
            status: data.status
                ? data.status
                : (data.progress !== undefined && data.progress >= 100 ? TASK_COMPLETED_STATUS : undefined),
            user: { id: userId },
            sender: origin,
            __typename: 'MiniAppTask',
        }

        updateTaskOperation(pickBy(taskRecord, value => value !== undefined), { id: barId })

        return { updated: true }
        // TODO(DOMA-5171): Adding miniAppTaskUIInterface in deps causing rerender hell!
    }, [userId])
}

export const useGetFragmentHandler: () => RequestHandler<'CondoWebAppGetFragment'> = () => {
    return useCallback(() => {
        if (typeof window === 'undefined') {
            return { fragment: '' }
        }

        let fragment = window.location.hash.startsWith('#') 
            ? window.location.hash.substring(1) 
            : window.location.hash

        try {
            fragment = decodeURIComponent(fragment)
        } catch (error) {
            console.warn('Failed to decode URI fragment:', fragment, error)
        }

        return { fragment }
    }, [])
}

export const useRedirectHandler: () => RequestHandler<'CondoWebAppRedirect'> = () => {
    const router = useRouter()

    return useCallback(({ url, target = '_self' }) => {
        if (!isSafeUrl(url)) {
            throw new Error('Forbidden url. Your url is probably injected')
        }
        if (typeof window === 'undefined') {
            throw new Error('Window was undefined. This is probably a bug, so please contact us')
        }

        if (target === '_blank') {
            window.open(url, target)
        } else {
            const urlOrigin = extractOrigin(url)
            if (window.origin !== urlOrigin) {
                throw new Error('The redirect url must have the same origin as parent window, if target is not _blank')
            }

            router.push(url)
        }

        return { success: true }
    }, [router])
}