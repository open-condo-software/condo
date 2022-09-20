import { isValidName } from '@condo/domains/organization/utils/name.utils'

const VALID_NAMES = ['ООО «УК №9»', 'TOP', 'Рога и копыта', '«А»', 'ЖСК "МУРМАНСК 85-19"']
const INVALID_NAMES = [undefined, null, '', '01234556789', '%%%', '`!@#$%^&*()_+-=[]{};\':"\\|,.<>/?~']

describe('isValidName()', () => {
    VALID_NAMES.forEach(name => {
        test(`for valid name: "${name}"`, () => {
            expect(isValidName(name)).toBe(true)
        })
    })
    INVALID_NAMES.forEach(name => {
        test(`for invalid name: "${name}"`, () => {
            expect(isValidName(name)).toBe(false)
        })
    })
})
