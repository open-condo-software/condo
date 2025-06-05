const { joinNameAndType, selfOrFirst, getGarLevel, getGarParam } = require('./helpers')

describe('helpers', () => {
    describe('joinNameAndType', () => {
        it('should join name and type with space when isNameFirst is true', () => {
            expect(joinNameAndType('name', 'type')).toBe('name type')
            expect(joinNameAndType('name', 'type', true)).toBe('name type')
        })

        it('should join type and name with space when isNameFirst is false', () => {
            expect(joinNameAndType('name', 'type', false)).toBe('type name')
        })

        it('should handle empty strings', () => {
            expect(joinNameAndType('', 'type')).toBe('')
            expect(joinNameAndType('name', '')).toBe('')
            expect(joinNameAndType('', '', true)).toBe('')
        })
    })

    describe('selfOrFirst', () => {
        it('should return first element of array', () => {
            expect(selfOrFirst([1, 2, 3])).toBe(1)
            expect(selfOrFirst(['a', 'b'])).toBe('a')
        })

        it('should return object itself if not array', () => {
            const obj = { key: 'value' }
            expect(selfOrFirst(obj)).toBe(obj)
        })

        it('should handle empty array', () => {
            expect(selfOrFirst([])).toBe(undefined)
        })
    })

    describe('getGarLevel', () => {
        const garData = [
            { level: 1, value: 'first' },
            { level: 2, value: 'second' },
            { level: 3, value: 'third' },
        ]

        it('should return object with matching level', () => {
            expect(getGarLevel(garData, 2)).toEqual({ level: 2, value: 'second' })
        })

        it('should return first element when level not found', () => {
            expect(getGarLevel(garData, 5)).toEqual({ level: 1, value: 'first' })
        })

        it('should return first element when level is null', () => {
            expect(getGarLevel(garData)).toEqual({ level: 1, value: 'first' })
        })

        it('should return object itself if not array', () => {
            const singleGar = { level: 1, value: 'single' }
            expect(getGarLevel(singleGar, 2)).toEqual(singleGar)
        })
    })

    describe('getGarParam', () => {
        const garObject = {
            param: [
                { '@_name': 'type', '#text': 'street' },
                { '@_name': 'code', '#text': '123' },
            ],
        }

        it('should return param value by name', () => {
            expect(getGarParam(garObject, 'type')).toBe('street')
            expect(getGarParam(garObject, 'code')).toBe('123')
        })

        it('should return undefined for non-existing param', () => {
            expect(getGarParam(garObject, 'missing')).toBeUndefined()
        })

        it('should handle undefined/null gar object', () => {
            expect(getGarParam(null, 'type')).toBeUndefined()
            expect(getGarParam(undefined, 'type')).toBeUndefined()
        })

        it('should handle gar object without params', () => {
            expect(getGarParam({}, 'type')).toBeUndefined()
        })
    })
})
