import Ajv from 'ajv'

import type { RequestParamValidator, AllRequestMethods } from './types'

const ajv = new Ajv()

const NoParamsSchema = {
    type: 'object',
    properties: {},
    additionalProperties: false,
}
const NoParamsValidator = ajv.compile(NoParamsSchema)

const CondoWebAppResizeWindowParamsSchema = {
    type: 'object',
    properties: {
        height: { type: 'number' },
    },
    required: ['height'],
    additionalProperties: false,
}

const CondoWebSendAnalyticsEventParamsSchema = {
    type: 'object',
    properties: {
        event: { type: 'string', enum: ['click'] },
        location: { type: 'string' },
        component: { type: 'string' },
    },
    required: ['event', 'location', 'component'],
    additionalProperties: true,
}

const CondoWebAppShowNotificationParamsSchema = {
    type: 'object',
    properties: {
        type: { type: 'string', enum: ['success', 'error', 'warning', 'info'] },
        message: { type: 'string' },
        description: { type: 'string' },
    },
    required: ['type', 'message'],
    additionalProperties: false,
}

const CondoWebAppShowProgressBarParamsSchema = {
    type: 'object',
    properties: {
        message: { type: 'string' },
        description: { type: 'string' },
        externalTaskId: { type: 'string' },
    },
    required: ['message'],
    additionalProperties: false,
}

const CondoWebAppUpdateProgressBarParamsSchema = {
    type: 'object',
    properties: {
        barId: { type: 'string' },
        data: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                description: { type: 'string' },
                progress: { type: 'integer' },
                status: { type: 'string', enum: ['completed', 'error'] },
            },
            additionalProperties: false,
            required: [],
            minProperties: 1,
        },
    },
    additionalProperties: false,
    required: ['barId', 'data'],
}

export type ValidatorsType = { [Method in AllRequestMethods]: RequestParamValidator<Method> }

export const validators: ValidatorsType = {
    CondoWebSendAnalyticsEvent: ajv.compile(CondoWebSendAnalyticsEventParamsSchema),
    CondoWebAppGetActiveProgressBars: NoParamsValidator,
    CondoWebAppGetLaunchParams: NoParamsValidator,
    CondoWebAppResizeWindow: ajv.compile(CondoWebAppResizeWindowParamsSchema),
    CondoWebAppShowNotification: ajv.compile(CondoWebAppShowNotificationParamsSchema),
    CondoWebAppShowProgressBar: ajv.compile(CondoWebAppShowProgressBarParamsSchema),
    CondoWebAppUpdateProgressBar: ajv.compile(CondoWebAppUpdateProgressBarParamsSchema),
}