import type { RequestParamValidator, AllRequestMethods } from './types'
import Ajv from 'ajv'

const ajv = new Ajv()

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

export type ValidatorsType = { [Method in AllRequestMethods]: RequestParamValidator<Method> }

export const validators: ValidatorsType = {
    CondoWebSendAnalyticsEvent: ajv.compile(CondoWebSendAnalyticsEventParamsSchema),
    CondoWebAppResizeWindow: ajv.compile(CondoWebAppResizeWindowParamsSchema),
}