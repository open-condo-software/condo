import { getUniqueByField, getConnectionsMapping } from './helpers'

const ENTITIES_ARRAY1 = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 1 }, {}]
const ENTITIES_IDS_UNIQUE1 = [1, 2, 3]

const ENTITIES_ARRAY2 = [{ x: { id: 1 } }, { x: { id: 2 } }, { x: { id: 3 } }, { x: {} }, {}]
const ENTITIES_IDS_UNIQUE2 = [1, 2, 3]

const ENTITIES_ARRAY3 = [{ x: '{ "id": 1 }' }, { x: '{ "id": 2 }' }, { x: '{ "id": 3 }' }, { x: '{ "v": 17 }' }, {}]
const ENTITIES_IDS_UNIQUE3 = [1, 2, 3]

const ENTITIES_ARRAY4 = [{ x: { y: [1] } }, { x: { y: [2] } }, { x: { y: [3] } }, { x: { y: [] } }, { x: { y: {} } }, { x: {} }, { z: '' }, {}]
const ENTITY_VALUES_UNIQUE4 = [[1], [2], [3]]

const ENTITIES_ARRAY5 = [{ id: 6, x: { id: 1 } }, { id: 7, x: { id: 2 } }, { id: 8, x: { id: 3 } }, { id: 9, x: { id: 3 } }, { x: {} }, {}]
const ENTITIES_IDS_UNIQUE5 = { '1': [6], '2': [7], '3': [8, 9] }


describe('Script helpers tests', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
    describe('getUniqueByField', () => {
        it('correctly extracts plain unique values', () => {
            expect(getUniqueByField(ENTITIES_ARRAY1, 'id')).toStrictEqual(ENTITIES_IDS_UNIQUE1)
        })

        it('correctly extracts nested plain unique values', () => {
            expect(getUniqueByField(ENTITIES_ARRAY2, 'x.id')).toStrictEqual(ENTITIES_IDS_UNIQUE2)
        })

        it('correctly extracts nested JSON unique values', () => {
            expect(getUniqueByField(ENTITIES_ARRAY3, 'x', 'id')).toStrictEqual(ENTITIES_IDS_UNIQUE3)
        })

        it('correctly extracts nested arrays', () => {
            expect(getUniqueByField(ENTITIES_ARRAY4, 'x', 'y')).toStrictEqual(ENTITY_VALUES_UNIQUE4)
        })
    })

    describe('getConnectionsMapping', () => {
        it('correctly maps connections', () => {
            expect(getConnectionsMapping(ENTITIES_ARRAY5, 'x.id')).toStrictEqual(ENTITIES_IDS_UNIQUE5)
        })
    })
})
