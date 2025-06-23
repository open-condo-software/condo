const { joinNameAndType, selfOrFirst, getLevel, getGar, getGarParam, extractLastFiasId, extractLastGarParam, resolveTypes } = require('./helpers')

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
            expect(selfOrFirst([])).toBeNull()
        })
    })

    describe('getLevel', () => {
        const item = {
            textaddr: {
                textobj: [
                    { level: 'region', value: 'Moscow' },
                    { level: 'city', value: 'Moscow City' },
                    { level: 'street', value: 'Tverskaya' },
                ],
            },
        }

        it('should return the correct level object when found', () => {
            expect(getLevel(item, 'city')).toEqual({ level: 'city', value: 'Moscow City' })
            expect(getLevel(item, 'region')).toEqual({ level: 'region', value: 'Moscow' })
            expect(getLevel(item, 'street')).toEqual({ level: 'street', value: 'Tverskaya' })
        })

        it('should return null if level is not found', () => {
            expect(getLevel(item, 'building')).toBeNull()
        })

        it('should return null if item is null or undefined', () => {
            expect(getLevel(null, 'city')).toBeNull()
            expect(getLevel(undefined, 'city')).toBeNull()
        })

        it('should return null if textaddr is missing', () => {
            expect(getLevel({}, 'city')).toBeNull()
        })

        it('should return null if textobj is not an array', () => {
            expect(getLevel({ textaddr: { textobj: null } }, 'city')).toBeNull()
            expect(getLevel({ textaddr: { textobj: {} } }, 'city')).toBeNull()
        })

        it('should skip falsy elements in textobj', () => {
            const itemWithNulls = {
                textaddr: {
                    textobj: [
                        null,
                        { level: 'city', value: 'Moscow City' },
                        undefined,
                    ],
                },
            }
            expect(getLevel(itemWithNulls, 'city')).toEqual({ level: 'city', value: 'Moscow City' })
        })
    })

    describe('getGar', () => {
        const item = {
            textaddr: {
                textobj: [
                    { level: 'region', gar: [
                        { level: 'region', name: 'Region Name' },
                        { level: 'adminarea', name: 'Admin Area' },
                    ] },
                    { level: 'city', gar: { level: 'city', name: 'City Name' } },
                ],
            },
        }

        it('should return the correct gar object from array', () => {
            expect(getGar(item, 'region', 'region')).toEqual({ level: 'region', name: 'Region Name' })
            expect(getGar(item, 'region', 'adminarea')).toEqual({ level: 'adminarea', name: 'Admin Area' })
        })

        it('should return the correct gar object from object', () => {
            expect(getGar(item, 'city', 'city')).toEqual({ level: 'city', name: 'City Name' })
        })

        it('should return null if gar or level not found', () => {
            expect(getGar(item, 'city', 'region')).toBeNull()
            expect(getGar(item, 'missing', 'region')).toBeNull()
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

        it('should handle null param array', () => {
            const garObjectWithNullParam = {
                param: null,
            }
            expect(getGarParam(garObjectWithNullParam, 'type')).toBeUndefined()
        })
    })

    describe('extractLastFiasId', () => {
        it('should return null for empty array', () => {
            expect(extractLastFiasId([])).toBeNull()
        })

        it('should return null for undefined input', () => {
            expect(extractLastFiasId()).toBeNull()
        })

        it('should return null when no gar guids present', () => {
            const textobj = [
                { someField: 'value' },
                { gar: { someField: 'value' } },
                { gar: { guid: null } },
            ]
            expect(extractLastFiasId(textobj)).toBeNull()
        })

        it('should return the last valid guid from the array', () => {
            const textobj = [
                { gar: { guid: '123' } },
                { gar: { guid: '456' } },
                { gar: { guid: '789' } },
            ]
            expect(extractLastFiasId(textobj)).toBe('789')
        })

        it('should handle mixed valid and invalid guids', () => {
            const textobj = [
                { gar: { guid: '123' } },
                { someField: 'value' },
                { gar: { guid: '456' } },
                { gar: { someField: 'value' } },
            ]
            expect(extractLastFiasId(textobj)).toBe('456')
        })

        it('should keep previous value if current guid is empty', () => {
            const textobj = [
                { gar: { guid: '123' } },
                { gar: { guid: '' } },
                { gar: { guid: null } },
                { gar: { guid: undefined } },
            ]
            expect(extractLastFiasId(textobj)).toBe('123')
        })
    })

    describe('extractLastGarParam', () => {
        it('should return null for empty array', () => {
            expect(extractLastGarParam([], 'kladrcode')).toBeNull()
        })

        it('should return null when no parameters present', () => {
            const textobj = [
                { someField: 'value' },
                { gar: { someField: 'value' } },
                { gar: { param: [] } },
            ]
            expect(extractLastGarParam(textobj, 'kladrcode')).toBeNull()
        })

        it('should return the last valid parameter value from the array', () => {
            const textobj = [
                { gar: { param: [{ '@_name': 'kladrcode', '#text': '1234567890' }] } },
                { gar: { param: [{ '@_name': 'kladrcode', '#text': '0987654321' }] } },
                { gar: { param: [{ '@_name': 'kladrcode', '#text': '1122334455' }] } },
            ]
            expect(extractLastGarParam(textobj, 'kladrcode')).toBe('1122334455')
        })

        it('should return the last valid okato value', () => {
            const textobj = [
                { gar: { param: [{ '@_name': 'okato', '#text': '1234' }] } },
                { gar: { param: [{ '@_name': 'okato', '#text': '5678' }] } },
            ]
            expect(extractLastGarParam(textobj, 'okato')).toBe('5678')
        })

        it('should return the last valid oktmo value', () => {
            const textobj = [
                { gar: { param: [{ '@_name': 'oktmo', '#text': '87654321' }] } },
                { gar: { param: [{ '@_name': 'oktmo', '#text': '12345678' }] } },
            ]
            expect(extractLastGarParam(textobj, 'oktmo')).toBe('12345678')
        })

        it('should handle mixed parameters', () => {
            const textobj = [
                { gar: { param: [
                    { '@_name': 'kladrcode', '#text': '1234567890' },
                    { '@_name': 'okato', '#text': '1234' },
                ] } },
                { gar: { param: [
                    { '@_name': 'oktmo', '#text': '87654321' },
                    { '@_name': 'kladrcode', '#text': '0987654321' },
                ] } },
            ]
            expect(extractLastGarParam(textobj, 'kladrcode')).toBe('0987654321')
            expect(extractLastGarParam(textobj, 'okato')).toBe('1234')
            expect(extractLastGarParam(textobj, 'oktmo')).toBe('87654321')
        })

        it('should return null for undefined input', () => {
            expect(extractLastGarParam(undefined, 'kladrcode')).toBeNull()
        })

        it('should handle array with null elements', () => {
            const textobj = [
                null,
                { gar: { param: [{ '@_name': 'kladrcode', '#text': '1234567890' }] } },
            ]
            expect(extractLastGarParam(textobj, 'kladrcode')).toBe('1234567890')
        })

        it('should handle textobj with null gar', () => {
            const textobj = [
                { gar: null },
                { gar: { param: [{ '@_name': 'kladrcode', '#text': '1234567890' }] } },
            ]
            expect(extractLastGarParam(textobj, 'kladrcode')).toBe('1234567890')
        })
    })

    describe('resolveTypes', () => {
        it('should resolve known types and their aliases', () => {
            expect(resolveTypes('город')).toEqual({ type: 'г', typeFull: 'город', isNameFirst: false })
            expect(resolveTypes('область')).toEqual({ type: 'обл', typeFull: 'область', isNameFirst: true })
            expect(resolveTypes('край')).toEqual({ type: 'кр', typeFull: 'край', isNameFirst: true })
            expect(resolveTypes('муниципальный округ')).toEqual({ type: 'муницип окр', typeFull: 'муниципальный округ', isNameFirst: false })
            expect(resolveTypes('городской округ')).toEqual({ type: 'гор окр', typeFull: 'городской округ', isNameFirst: true })
            expect(resolveTypes('пгт')).toEqual({ type: 'пгт', typeFull: 'поселок городского типа', isNameFirst: false })
            expect(resolveTypes('поселок')).toEqual({ type: 'пос', typeFull: 'поселок', isNameFirst: false })
            expect(resolveTypes('поселение')).toEqual({ type: 'п', typeFull: 'поселение', isNameFirst: false })
            expect(resolveTypes('район')).toEqual({ type: 'р-н', typeFull: 'район', isNameFirst: true })
            expect(resolveTypes('село')).toEqual({ type: 'с', typeFull: 'село', isNameFirst: false })
            expect(resolveTypes('деревня')).toEqual({ type: 'д', typeFull: 'деревня', isNameFirst: false })
            expect(resolveTypes('улица')).toEqual({ type: 'ул', typeFull: 'улица', isNameFirst: false })
            expect(resolveTypes('просп')).toEqual({ type: 'пр-кт', typeFull: 'проспект', isNameFirst: false })
            expect(resolveTypes('проспект')).toEqual({ type: 'пр-кт', typeFull: 'проспект', isNameFirst: false })
            expect(resolveTypes('уч')).toEqual({ type: 'уч', typeFull: 'участок', isNameFirst: false })
            expect(resolveTypes('участок')).toEqual({ type: 'уч', typeFull: 'участок', isNameFirst: false })
            expect(resolveTypes('stead')).toEqual({ type: 'уч', typeFull: 'участок', isNameFirst: false })
            expect(resolveTypes('дом')).toEqual({ type: 'д', typeFull: 'дом', isNameFirst: false })
            expect(resolveTypes('house')).toEqual({ type: 'д', typeFull: 'дом', isNameFirst: false })
            expect(resolveTypes('строение')).toEqual({ type: 'стр', typeFull: 'строение', isNameFirst: false })
            expect(resolveTypes('соор')).toEqual({ type: 'соор', typeFull: 'сооружение', isNameFirst: false })
            expect(resolveTypes('сооружение')).toEqual({ type: 'соор', typeFull: 'сооружение', isNameFirst: false })
            expect(resolveTypes('construction')).toEqual({ type: 'соор', typeFull: 'сооружение', isNameFirst: false })
            expect(resolveTypes('корпус')).toEqual({ type: 'корп', typeFull: 'корпус', isNameFirst: false })
            expect(resolveTypes('block')).toEqual({ type: 'корп', typeFull: 'корпус', isNameFirst: false })
            expect(resolveTypes('квартира')).toEqual({ type: 'кв', typeFull: 'квартира', isNameFirst: false })
            expect(resolveTypes('flat')).toEqual({ type: 'кв', typeFull: 'квартира', isNameFirst: false })
            expect(resolveTypes('апартаменты')).toEqual({ type: 'апарт', typeFull: 'апартаменты', isNameFirst: false })
            expect(resolveTypes('apartment')).toEqual({ type: 'апарт', typeFull: 'апартаменты', isNameFirst: false })
            expect(resolveTypes('офис')).toEqual({ type: 'оф', typeFull: 'офис', isNameFirst: false })
            expect(resolveTypes('комната')).toEqual({ type: 'ком', typeFull: 'комната', isNameFirst: false })
            expect(resolveTypes('машиноместо')).toEqual({ type: 'мм', typeFull: 'машиноместо', isNameFirst: false })
        })

        it('should return null for unknown or empty types', () => {
            expect(resolveTypes('unknown')).toBeNull()
            expect(resolveTypes('')).toBeNull()
            expect(resolveTypes(undefined)).toBeNull()
            expect(resolveTypes(null)).toBeNull()
        })

        it('should set isNameFirst correctly for all types', () => {
            expect(resolveTypes('область').isNameFirst).toBe(true)
            expect(resolveTypes('край').isNameFirst).toBe(true)
            expect(resolveTypes('городской округ').isNameFirst).toBe(true)
            expect(resolveTypes('район').isNameFirst).toBe(true)
            expect(resolveTypes('город').isNameFirst).toBe(false)
            expect(resolveTypes('улица').isNameFirst).toBe(false)
            expect(resolveTypes('дом').isNameFirst).toBe(false)
        })
    })
})
