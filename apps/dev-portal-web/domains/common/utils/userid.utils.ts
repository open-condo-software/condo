import cookie from 'js-cookie'
import sample from 'lodash/sample'

const ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function makeId (length: number): string {
    const chars: Array<string> = []
    for (let i = 0; i < length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        chars.push(sample(ID_ALPHABET)!)
    }
    return chars.join('')
}

function getCurrentUserId () {
    let current: string = cookie.get('userId')
    if (!current) {
        current = makeId(12)
    }
    cookie.set('userId', current, { expires: 365 })
    return current
}

export function getClientSideSenderInfo (): { dv: number, fingerprint: string } {
    return {
        dv: 1,
        fingerprint: getCurrentUserId(),
    }
}