import { promises as fs } from 'fs'
import path from 'path'

import { CONDO_ROOT } from '@cli/consts'

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