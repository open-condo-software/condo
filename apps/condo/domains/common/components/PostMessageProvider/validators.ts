import Ajv from 'ajv'
import addFormats from 'ajv-formats'

import type { RequestParamValidator, AllRequestMethods } from './types'

const ajv = new Ajv()
addFormats(ajv)

const NoParamsSchema = {
    type: 'object',
    properties: {},
    additionalProperties: false,
}
const NoParamsValidator = ajv.compile(NoParamsSchema)

const CondoWebSendAnalyticsEventParamsSchema = {
    type: 'object',
    properties: {
        event: { type: 'string', enum: ['click', 'check', 'change'] },
        location: { type: 'string' },
        component: { type: 'string' },
    },
    required: ['event', 'location', 'component'],
    additionalProperties: true,
}

const CondoWebAppCloseModalWindowParamsSchema = {
    type: 'object',
    properties: {
        modalId: { type: 'string' },
    },
    required: ['modalId'],
    additionalProperties: false,
}

const CondoWebAppRedirectParamsSchema = {
    type: 'object',
    properties: {
        url: { type: 'string' },
        target: { type: 'string', enum: ['_self', '_blank'] },
    },
    required: ['url'],
    additionalProperties: false,
}

const CondoWebAppRequestAuthSchema = {
    type: 'object',
    properties: {
        url: { type: 'string' },
    },
    required: ['url'],
    additionalProperties: false,
}

const CondoWebAppResizeWindowParamsSchema = {
    type: 'object',
    properties: {
        height: { type: 'number' },
    },
    required: ['height'],
    additionalProperties: false,
}

const CondoWebSetActiveCallParamsSchema = {
    type: 'object',
    properties: {
        error: { type: 'string' },
        isCallActive: { type: 'boolean' },
        connectedTickets: {
            items: { type: 'string' },
            type: 'array',
            minItems: 0,
        },
    },
    required: ['isCallActive', 'connectedTickets'],
    additionalProperties: false,
}

const CondoWebAppShowModalWindowParamsSchema = {
    type: 'object',
    properties: {
        title: { type: 'string' },
        url: { type: 'string', format: 'uri', pattern: '^https?://'  },
        size: { type: 'string', enum: ['small', 'big'] },
        initialHeight: { type: 'number' },
    },
    required: ['title', 'url'],
    additionalProperties: false,
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

const CondoWebAppUpdateModalWindowParamsSchema = {
    type: 'object',
    properties: {
        modalId: { type: 'string' },
        data: {
            type: 'object',
            properties: {
                title: { type: 'string' },
                size: { type: 'string', enum: ['small', 'big'] },
            },
            additionalProperties: false,
            required: [],
            minProperties: 1,
        },
    },
    additionalProperties: false,
    required: ['modalId', 'data'],
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
    CondoWebSetActiveCall: ajv.compile(CondoWebSetActiveCallParamsSchema),
    CondoWebSendAnalyticsEvent: ajv.compile(CondoWebSendAnalyticsEventParamsSchema),
    CondoWebAppCloseModalWindow: ajv.compile(CondoWebAppCloseModalWindowParamsSchema),
    CondoWebAppGetActiveProgressBars: NoParamsValidator,
    CondoWebAppGetFragment: NoParamsValidator,
    CondoWebAppGetLaunchParams: NoParamsValidator,
    CondoWebAppRequestAuth: ajv.compile(CondoWebAppRequestAuthSchema),
    CondoWebAppRedirect: ajv.compile(CondoWebAppRedirectParamsSchema),
    CondoWebAppResizeWindow: ajv.compile(CondoWebAppResizeWindowParamsSchema),
    CondoWebAppShowModalWindow: ajv.compile(CondoWebAppShowModalWindowParamsSchema),
    CondoWebAppShowNotification: ajv.compile(CondoWebAppShowNotificationParamsSchema),
    CondoWebAppShowProgressBar: ajv.compile(CondoWebAppShowProgressBarParamsSchema),
    CondoWebAppUpdateModalWindow: ajv.compile(CondoWebAppUpdateModalWindowParamsSchema),
    CondoWebAppUpdateProgressBar: ajv.compile(CondoWebAppUpdateProgressBarParamsSchema),
}
