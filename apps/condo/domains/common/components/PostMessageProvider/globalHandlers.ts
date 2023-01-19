import { useCallback, useContext } from 'react'
import { notification } from 'antd'
import { v4 as uuidV4 } from 'uuid'
import get from 'lodash/get'
import dayjs from 'dayjs'
import { useIntl } from '@open-condo/next/intl'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'
import { STAFF } from '@condo/domains/user/constants/common'
import { useMiniappTaskUIInterface } from '@condo/domains/common/hooks/useMiniappTaskUIInterface'
import { TasksContext } from '@condo/domains/common/components/tasks'
import { TASK_STATUS } from '@condo/domains/common/components/tasks'
import type { RequestHandler } from './types'

export const handleNotification: RequestHandler<'CondoWebAppShowNotification'> = (params) => {
    const { type, ...restParams } = params
    notification[type](restParams)
    return { success: true }
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

    return useCallback<RequestHandler<'CondoWebAppShowProgressBar'>>(({ message, description }) => {
        const id = uuidV4()
        const taskRecord = {
            id,
            title: message,
            description,
            progress: 0,
            status: TASK_STATUS.PROCESSING,
            user: { id: userId },
            createdAt: dayjs().toISOString(),
            __typename: 'MiniAppTask',
        }

        miniAppTaskUIInterface.storage.useCreateTask({}, () => {
            addTask({
                ...miniAppTaskUIInterface,
                record: taskRecord,
            })
        })(taskRecord)

        return { barId: id }
        // TODO(DOMA-5171): Adding miniAppTaskUIInterface in deps causing rerender hell!
    }, [userId, addTask])
}