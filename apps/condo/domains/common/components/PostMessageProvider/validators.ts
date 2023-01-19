import type { RequestParamValidator, AllRequestMethods } from './types'
import Ajv from 'ajv'

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
    },
    required: ['message'],
    additionalProperties: false,
}

export type ValidatorsType = { [Method in AllRequestMethods]: RequestParamValidator<Method> }

export const validators: ValidatorsType = {
    CondoWebSendAnalyticsEvent: ajv.compile(CondoWebSendAnalyticsEventParamsSchema),
    CondoWebAppGetLaunchParams: NoParamsValidator,
    CondoWebAppResizeWindow: ajv.compile(CondoWebAppResizeWindowParamsSchema),
    CondoWebAppShowNotification: ajv.compile(CondoWebAppShowNotificationParamsSchema),
    CondoWebAppShowProgressBar: ajv.compile(CondoWebAppShowProgressBarParamsSchema),
}