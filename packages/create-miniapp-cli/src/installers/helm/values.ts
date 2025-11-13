import fs from 'fs/promises'
import path from 'path'

import { CONDO_ROOT } from '@cli/consts'
import { logger } from '@cli/utils/logger'
import { parseDocument, YAMLMap, Pair, Scalar } from 'yaml'

export interface MaxOldSpace {
    default: number
    development?: number
    production?: number
    review?: number
}

export interface ResourceSettings {
    cpu: {
        default: string
        development?: string
        production?: string
        review?: string
    }
    memory: {
        default: string
        development?: string
        production?: string
        review?: string
    }
}

export interface UpdateValuesOptions {
    appName: string
    hasWorker: boolean
    hasReview: boolean
    appResources: ResourceSettings
    workerResources?: ResourceSettings
    maxOldSpace: MaxOldSpace
}

const VALUES_FILE = path.resolve(CONDO_ROOT, '.helm/values.yaml')

export async function updateValues (options: UpdateValuesOptions) {
    const {
        appName,
        hasWorker,
        hasReview,
        appResources,
        workerResources,
        maxOldSpace,
    } = options

    const snakeName = appName.replace(/-/g, '_')
    const rawYaml = await fs.readFile(VALUES_FILE, 'utf8')
    const doc = parseDocument(rawYaml, {
        keepSourceTokens: true, // NOTE(@abshnko): keep original content as-is
    })

    if (!doc.contents) {
        throw new Error('values.yaml appears empty or invalid')
    }

    if (doc.get(snakeName)) {
        logger.info(`${snakeName} already exists in values.yaml, skipping.`)
        return VALUES_FILE
    }

    const newMiniappBlock: Record<string, any> = {
        app: {
            port: { _default: 3000 },
            replicas: { _default: 1 },
            requests: {
                cpu: {
                    _default: appResources.cpu.default,
                    ...(appResources.cpu.development ? { development: appResources.cpu.development } : {}),
                    ...(appResources.cpu.production ? { production: appResources.cpu.production } : {}),
                    ...(hasReview && appResources.cpu.review ? { review: appResources.cpu.review } : {}),
                },
                memory: {
                    _default: appResources.memory.default,
                    ...(appResources.memory.development ? { development: appResources.memory.development } : {}),
                    ...(appResources.memory.production ? { production: appResources.memory.production } : {}),
                    ...(hasReview && appResources.memory.review ? { review: appResources.memory.review } : {}),
                },
            },
        },
    }

    if (hasWorker && workerResources) {
        newMiniappBlock.worker = {
            port: { _default: 3000 },
            replicas: { _default: 1 },
            requests: {
                cpu: {
                    _default: workerResources.cpu.default,
                    ...(workerResources.cpu.development ? { development: workerResources.cpu.development } : {}),
                    ...(workerResources.cpu.production ? { production: workerResources.cpu.production } : {}),
                    ...(hasReview && workerResources.cpu.review ? { review: workerResources.cpu.review } : {}),
                },
                memory: {
                    _default: workerResources.memory.default,
                    ...(workerResources.memory.development ? { development: workerResources.memory.development } : {}),
                    ...(workerResources.memory.production ? { production: workerResources.memory.production } : {}),
                    ...(hasReview && workerResources.memory.review ? { review: workerResources.memory.review } : {}),
                },
            },
        }
    }

    const envEntry: Record<string, Record<string, string>> = {
        keep_alive_timeout: { _default: '75000' },
        headers_timeout: { _default: '80000' },
        default_locale: { _default: 'ru' },
        dd_agent_host: { _default: 'datadog-agent.infrastructure-datadog.svc.cluster.local' },
        dd_version: {
            _default: 'review',
            development: 'dev',
            production: 'prod',
        },
        dd_dbm_propagation_mode: {
            _default: 'full',
            development: 'full',
            production: 'full',
        },
        node_options: {
            _default: `--max_old_space_size=${maxOldSpace.default} --trace-warnings`,
            ...(maxOldSpace.development
                ? { development: `--max_old_space_size=${maxOldSpace.development} --trace-warnings` }
                : {}),
            ...(maxOldSpace.production
                ? { production: `--max_old_space_size=${maxOldSpace.production} --trace-warnings` }
                : {}),
        },
    }

    if (hasReview) {
        envEntry.dd_version.review = 'review'
        envEntry.dd_dbm_propagation_mode.review = 'full'
        envEntry.node_options.review = `--max_old_space_size=${maxOldSpace.review ?? maxOldSpace.default} --trace-warnings`
    }

    if (!doc.has('envs')) {
        doc.set('envs', {})
    }

    const envs = doc.get('envs') as YAMLMap
    envs.set(snakeName, envEntry)

    const map = doc.contents as YAMLMap
    let inserted = false
    const newItems: typeof map.items = []

    for (const pair of map.items) {
        if ((pair.key as Scalar).value === 'envs' && !inserted) {
            newItems.push(new Pair(snakeName, newMiniappBlock))
            inserted = true
        }
        newItems.push(pair)
    }

    map.items = newItems

    await fs.writeFile(VALUES_FILE, doc.toString({ lineWidth: 0 }), 'utf8')
    logger.success(`Added ${snakeName} to .helm/values.yaml`)

    return VALUES_FILE
}

