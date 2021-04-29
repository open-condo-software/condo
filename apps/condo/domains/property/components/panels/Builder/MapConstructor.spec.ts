import {  
    mapAddSection,
    mapUpdateSection,
    mapRemoveSection,

    mapAddUnit,
    mapUpdateUnit,
    mapRemoveUnit,

    getUnitInfo,
    getPossibleFloors,

    getSectionFloorOptions,
    getSectionOptions,
} from './MapConstructor'


describe('Map constructor', () => {
    describe('Service functions', () => {
        describe('Select options for sections', () => {
            it('should correctly generate floor list for choosed section', () => {
                let map = mapAddSection(null, { id: null, minFloor: -5, maxFloor: 20, unitsOnFloor: 10 })
                map = mapAddSection(map, { id: null, minFloor: -10, maxFloor: 10, unitsOnFloor: 10 })
                const floors1 = getSectionFloorOptions(map, map.sections[0].id)
                expect(floors1).toHaveLength(25)
                const floors2 = getSectionFloorOptions(map, map.sections[1].id)
                expect(floors2).toHaveLength(20)
            })
        })
        describe('Select options for floors', () => {
            it('should correctly generate floor list', () => {
                let map = mapAddSection(null, { id: null, minFloor: -5, maxFloor: 20, unitsOnFloor: 10 })
                map = mapAddSection(map, { id: null, minFloor: -10, maxFloor: 10, unitsOnFloor: 10 })
                const sections = getSectionOptions(map)
                expect(sections).toHaveLength(2)
            })
        })
        describe('geting getUnitInfo by id', () => {
            it('should correctly get unit position on section and floor', () => {
                let map = mapAddSection(null, { id: null, minFloor: -5, maxFloor: 20, unitsOnFloor: 10 })
                map = mapAddSection(map, { id: null, minFloor: -10, maxFloor: 10, unitsOnFloor: 10 })
                const unitFromMap = map.sections[1].floors[3].units[2]
                const unit = getUnitInfo(map, unitFromMap.id)
                expect(unit.section).toEqual(map.sections[1].id)
                expect(unit.floor).toEqual(map.sections[1].floors[3].id)
            })
        })
        describe('geting floors range', () => {
            it('should correctly get min and max floor from all sections', () => {
                let map = mapAddSection(null, { id: null, minFloor: -2, maxFloor: 5, unitsOnFloor: 10 })
                map = mapAddSection(map, { id: null, minFloor: -1, maxFloor: 10, unitsOnFloor: 10 })
                const floors = getPossibleFloors(map)
                expect(floors).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1, -1, -2])
            })
        })
    })

    describe('Unit operations', () => {

        describe('Add unit', () => {
            let map = mapAddSection(null, { id: null, minFloor: -2, maxFloor: 5, unitsOnFloor: 10 })
            map = mapAddSection(map, { id: null, minFloor: -1, maxFloor: 10, unitsOnFloor: 10 })
            map = mapAddSection(map, { id: null, minFloor: 2, maxFloor: 7, unitsOnFloor: 4 })
            const unitPlacedBefore = map.sections[0].floors[3].units[2]
            const unitPlacedAfter = map.sections[2].floors[4].units[1]
            const newUnit = {
                id: null,
                floor: map.sections[1].floors[4].id,
                section: map.sections[1].id,
                label: '1000',
            }
            map = mapAddUnit(map, newUnit)
            it('unit should be correctly placed to map', () => {
                const found = map.sections[1].floors[4].units.find(u => u.label === newUnit.label)
                expect(found).not.toBeUndefined()
            })
            it('after adding unit with numeric label should update names of some units', () => {
                expect(map.sections[2].floors[4].units[1].label).not.toEqual(unitPlacedAfter.label)
            })
            it('after adding unit with not-numeric label shouldn\'t update names of other units', () => {
                expect(map.sections[0].floors[3].units[2].label).toEqual(unitPlacedBefore.label)
            })
        })

        describe('Edit unit', () => {
            let map = mapAddSection(null, { id: null, minFloor: -2, maxFloor: 5, unitsOnFloor: 10 })
            map = mapAddSection(map, { id: null, minFloor: -1, maxFloor: 10, unitsOnFloor: 10 })
            map = mapAddSection(map, { id: null, minFloor: 2, maxFloor: 7, unitsOnFloor: 4 })
            const unitPlacedBefore = map.sections[0].floors[3].units[2]
            const unitPlacedAfter = map.sections[2].floors[4].units[1]
            const editUnit = map.sections[1].floors[2].units[0]
            it('should correctly update names of some units if has numeric label', () => {
                map = mapUpdateUnit(map, { ...editUnit, label: '1000', floor: map.sections[1].floors[2].id, section: map.sections[1].id } )
                expect(map.sections[2].floors[4].units[1].label).not.toEqual(unitPlacedAfter.label)
                expect(map.sections[0].floors[3].units[2].label).toEqual(unitPlacedBefore.label)
            })
            it('should correctly update map if floor/section is changed', () => {
                map = mapUpdateUnit(map, { ...editUnit, floor: map.sections[0].floors[0].id, section: map.sections[0].id } )
                const info = getUnitInfo(map, editUnit.id)
                expect(info.floor).toEqual(map.sections[0].floors[0].id)
                expect(info.section).toEqual(map.sections[0].id)
            })
        })

        describe('Delete unit', () => {
            it('should remove unit from map', () => {
                let map = mapAddSection(null, { id: null, minFloor: -2, maxFloor: 5, unitsOnFloor: 10 })
                const unitToRemove = map.sections[0].floors[1].units[2]
                map = mapRemoveUnit(map, unitToRemove.id)
                const found = getUnitInfo(map, unitToRemove.id)
                expect(found.floor).toBe('')
            })
        })
    })
        
    describe('Section operations', () => {
        describe('Add section', () => {
            it('check generated structure on section add', () => {
                let map = mapAddSection(null, { id: null, minFloor: -5, maxFloor: 20, unitsOnFloor: 10 })
                map = mapAddSection(map, { id: null, minFloor: -10, maxFloor: 10, unitsOnFloor: 10 })
                expect(map.sections).toHaveLength(2)
                expect(map.sections[1].floors).toHaveLength(20)
            })
        })
        describe('Edit section', () => {
            it('check rename of the structure on section edit', () => {
                let map = mapAddSection(null, { id: null, minFloor: -5, maxFloor: 20, unitsOnFloor: 10, name: 'test_name_1' })
                expect(map.sections[0].name).toEqual('test_name_1')
                map = mapUpdateSection(map, { id: map.sections[0].id, name: 'test_name_2' })
                expect(map.sections[0].name).toEqual('test_name_2')
            })
        })
        mapUpdateSection
        describe('Delete section', () => {
            it('check if section is gone on delete', () => {
                let map = mapAddSection(null, { id: null, minFloor: -5, maxFloor: 20, unitsOnFloor: 10 })
                map = mapAddSection(map, { id: null, minFloor: -10, maxFloor: 10, unitsOnFloor: 10 })
                map = mapRemoveSection(map, map.sections[0].id)
                expect(map.sections).toHaveLength(1)
                expect(map.sections[0].floors).toHaveLength(20)
            })
        })
    })       

})
