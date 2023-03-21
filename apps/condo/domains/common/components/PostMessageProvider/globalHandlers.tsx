import { notification } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import omit from 'lodash/omit'
import pickBy from 'lodash/pickBy'
import { useRouter } from 'next/router'
import React, { useCallback, useContext, useState } from 'react'
import { v4 as uuidV4 } from 'uuid'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Modal } from '@open-condo/ui'

import { TASK_STATUS, TasksContext } from '@condo/domains/common/components/tasks'
import { useMiniappTaskUIInterface } from '@condo/domains/common/hooks/useMiniappTaskUIInterface'
import { extractOrigin } from '@condo/domains/common/utils/url.utils'
import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'
import { STAFF } from '@condo/domains/user/constants/common'

import type { RequestHandler } from './types'

export const handleNotification: RequestHandler<'CondoWebAppShowNotification'> = (params) => {
    const { type, ...restParams } = params
    notification[type](restParams)
    return { success: true }
}

export const useModalHandler: () => [
    RequestHandler<'CondoWebAppShowModalWindow'>,
    RequestHandler<'CondoWebAppCloseModalWindow'>,
    React.ReactElement,
] = () => {
    const [openModals, setOpenModals] = useState<{ [id: string]: { destroy: () => void } }>({})
    const [show, ContextHandler] = Modal.useModal()

    const handleShowModal = useCallback<RequestHandler<'CondoWebAppShowModalWindow'>>((params, origin) => {
        const { title, url, size = 'small' } = params
        if (extractOrigin(url) !== origin) {
            throw new Error('Forbidden url. Url must have same origin as sender')
        }
        if (!isSafeUrl(url)) {
            throw new Error('Forbidden url. Your url is probably injected')
        }

        // TODO(DOMA-5563): Pass this to onCancel to notify about modal closing
        const modalId = uuidV4()
        // NOTE: Patch url with modalId, so it can be closed by itself as well as by sender window
        const urlWithMeta = new URL(url)
        urlWithMeta.searchParams.set('modalId', modalId)

        const { destroy } = show({
            title,
            width: size,
            children: (
                <IFrame
                    src={urlWithMeta.toString()}
                    reloadScope='organization'
                    withLoader
                    withResize
                />
            ),
        })

        setOpenModals(prev => ({ ...prev, [modalId]: { destroy } }))

        return { modalId }
    }, [show])

    const handleCloseModal = useCallback<RequestHandler<'CondoWebAppCloseModalWindow'>>(({ modalId }) => {
        if (modalId in openModals) {
            openModals[modalId].destroy()
            setOpenModals(omit(openModals, modalId))
            return { success: true }
        }

        throw new Error('Non-existent modalId')
    }, [openModals])

    return [handleShowModal, handleCloseModal, ContextHandler]
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
    const { addTask } = useContext(TasksContext)
    const { MiniAppTask: miniAppTaskUIInterface } = useMiniappTaskUIInterface()
    const userId = get(user, 'id', null)

    const createTaskOp = miniAppTaskUIInterface.storage.useCreateTask({}, (record) => {
        addTask({
            ...miniAppTaskUIInterface,
            // TODO(DOMA-5171): Fix types
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            record,
        })
    })

    return useCallback(({
        message,
        description,
        externalTaskId },
    origin) => {
        const id = uuidV4()
        const taskRecord = {
            id,
            taskId: externalTaskId,
            title: message,
            description,
            progress: 0,
            status: TASK_STATUS.PROCESSING,
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
    const { tasks } = useContext(TasksContext)
    const userId = get(user, 'id', null)

    return useCallback((params, origin) => {
        return {
            bars: tasks
                .map(task => task.record)
                .filter(task => task.sender === origin &&
                    task.user && task.user && task.user.id === userId &&
                    task.status === TASK_STATUS.PROCESSING &&
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
    const { updateTask } = useContext(TasksContext)
    const { MiniAppTask: miniAppTaskUIInterface } = useMiniappTaskUIInterface()
    const userId = get(user, 'id', null)

    const updateTaskOperation = miniAppTaskUIInterface.storage.useUpdateTask({}, (record) => {
        // TODO(DOMA-5171): Fix types
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
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
                : (data.progress !== undefined && data.progress >= 100 ? TASK_STATUS.COMPLETED : undefined),
            user: { id: userId },
            sender: origin,
            __typename: 'MiniAppTask',
        }

        updateTaskOperation(pickBy(taskRecord, value => value !== undefined), { id: barId })

        return { updated: true }
        // TODO(DOMA-5171): Adding miniAppTaskUIInterface in deps causing rerender hell!
    }, [userId])
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