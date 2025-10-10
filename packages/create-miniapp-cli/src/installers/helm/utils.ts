import { promises as fs } from 'fs'
import path from 'path'

import * as p from '@clack/prompts'
import { CONDO_ROOT } from '@cli/consts'

import { ResourceSettings } from './values'

const TEMPLATES_DIR = path.join(CONDO_ROOT, './.helm/templates')

export async function fileExists (p: string) {
    try {
        await fs.stat(p)
        return true
    } catch {
        return false
    }
}

export function padNum (n: number) {
    return String(n).padStart(3, '0')
}

export async function getNextPrefix () {
    const files = await fs.readdir(TEMPLATES_DIR)
    const nums = files
        .map(f => f.match(/^(\d{3})-/))
        .filter(Boolean)
        .map(m => parseInt(m![1], 10))
    const max = nums.length ? Math.max(...nums) : 0
    // if no templates found start at 100
    if (max === 0) return 100

    return (Math.floor(max / 10) * 10) + 10
}

export function validateCpu (input: string): true | string {
    return /^\d+m$/.test(input.trim())
        ? true
        : 'CPU must be in format like "250m"'
}

export function validateMemory (input: string): true | string {
    const trimmed = input.trim()
    const match = /^(\d+)(Mi)$/.exec(trimmed)
    if (!match) return 'Memory must be in format like "512Mi"'
    const num = parseInt(match[1], 10)
    return (num & (num - 1)) === 0
        ? true
        : 'Memory size must be a power of 2 (e.g. 256Mi, 512Mi, 1024Mi)'
}

export function validateNumber (input: string): true | string {
    const n = Number(input)
    if (Number.isNaN(n) || n <= 0) return 'Enter a positive number'
    return (n & (n - 1)) === 0 ? true : 'Must be a power of 2 (e.g. 256, 512, 1024)'
}

export async function askForResources ({
    label,
    wantReview,
    defaults,
}: {
    label: 'app' | 'worker'
    wantReview: boolean
    defaults: ResourceSettings
}): Promise<ResourceSettings> {
    const envLabels = wantReview
        ? 'default,review,development,production'
        : 'default,development,production'
    const envCount = wantReview ? 4 : 3

    const defaultCpuValue = wantReview
        ? `${defaults.cpu.default},${defaults.cpu.default},${defaults.cpu.development},${defaults.cpu.production}`
        : `${defaults.cpu.default},${defaults.cpu.development},${defaults.cpu.production}`

    const cpu = await p.text({
        message: `Enter ${label} CPU (${envLabels}) [e.g. 250m,300m,400m,500m]:`,
        defaultValue: defaultCpuValue,
        placeholder: defaultCpuValue,
        validate: (v) => {
            const parts = v.split(',').map((s) => s.trim())
            if (v) {
                if (parts.length !== envCount)
                    return `Please provide ${envCount} comma-separated values`
                for (const pVal of parts) {
                    const res = validateCpu(pVal)
                    if (res !== true) return res
                }
            }
            
            return
        },
    }) as string

    const defaultMemoryValue = wantReview
        ? `${defaults.memory.default},${defaults.memory.default},${defaults.memory.development},${defaults.memory.production}`
        : `${defaults.memory.default},${defaults.memory.development},${defaults.memory.production}`
    const memory = await p.text({
        message: `Enter ${label} memory (${envLabels}) or hit Enter to accept default values:`,
        defaultValue: defaultMemoryValue,
        placeholder: defaultMemoryValue,
        validate: (v) => {
            if (v) {
                const parts = v.split(',').map((s) => s.trim())
                if (parts.length !== envCount)
                    return `Please provide ${envCount} comma-separated values`
                for (const pVal of parts) {
                    const res = validateMemory(pVal)
                    if (res !== true) return res
                }
            }
            return
        },
    }) as string

    const cpuParts = cpu.split(',').map((s) => s.trim())
    const memParts = memory.split(',').map((s) => s.trim())

    const cpuObj: any = { default: cpuParts[0] }
    const memObj: any = { default: memParts[0] }
    let i = 1
    if (wantReview) {
        cpuObj.review = cpuParts[i]
        memObj.review = memParts[i++]
    }
    cpuObj.development = cpuParts[i]
    cpuObj.production = cpuParts[i + 1]
    memObj.development = memParts[i]
    memObj.production = memParts[i + 1]

    return { cpu: cpuObj, memory: memObj }
}