/* eslint  @typescript-eslint/no-empty-function: 0 */

import { LOCALES } from './locale'

describe('date-fns - locale bug', () => {
    test('check for localize existance', () => {
        expect(typeof LOCALES.en.localize).toBe('object')
        expect(typeof LOCALES.ru.localize).toBe('object')
    })
})