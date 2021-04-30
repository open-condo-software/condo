import { MapEdit, MapTypesList } from './MapConstructor'
import { notValidBuildingMapJson, buildingMapJson } from '@condo/domains/property/constants/property.example'
import { cloneDeep } from 'lodash'

const testSection = {
    id: '',
    minFloor: -5,
    maxFloor: 10,
    unitsOnFloor: 10,
}

const sectionName = () => {
    return Math.random().toString()
}
const createBuildingMap = (sections: number) => {
    const PropertyMap = new MapEdit(null, () => null )
    for (let i = 0; i < sections; i++){
        PropertyMap.addSection({ ...testSection, name: sectionName(), type: MapTypesList.Section })
    }
    return PropertyMap
}


describe('Map constructor', () => {
    describe('Service functions', () => {
        describe('Select options for sections', () => {
            it('Should correctly generate floor list for choosed section', () => {
                const Building = createBuildingMap(5)
                expect(Building.sections).toHaveLength(5)
                expect(Building.getSectionFloorOptions(Building.sections[0].id)).toHaveLength(15)
            })
        })
        describe('Select options for floors', () => {
            it('should correctly generate sections list', () => {
                const Building = createBuildingMap(14)
                expect(Building.getSectionOptions()).toHaveLength(14)
            })
        })
        describe('getUnitInfo by id', () => {
            it('should correctly get unit position on section and floor', () => {
                const Building = createBuildingMap(5)
                const jsonMap = Building.getMap()
                const unitFromMap = jsonMap.sections[2].floors[2].units[2]
                const unit = Building.getUnitInfo(unitFromMap.id)
                expect(unit.section).toEqual(jsonMap.sections[2].id)
                expect(unit.floor).toEqual(jsonMap.sections[2].floors[2].id)
            })
        })
        describe('geting floors range', () => {
            it('should correctly get min and max floor from all sections', () => {
                const PropertyMap = new MapEdit(null, () => null )
                PropertyMap.addSection({ id: '', minFloor: -2, maxFloor: 5, unitsOnFloor: 10, name: sectionName() })
                PropertyMap.addSection({ id: '', minFloor: -1, maxFloor: 10, unitsOnFloor: 10, name: sectionName() })
                expect(PropertyMap.possibleFloors).toEqual([ 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, -1, -2 ])
            })
        })
    })

    describe('Unit operations', () => {
        describe('Add unit', () => {
            it('unit should be correctly placed to map', () => {
                const Building = createBuildingMap(10)
                const jsonMap = Building.getMap()
                const newUnit = { id: '', floor: jsonMap.sections[3].floors[3].id, section: jsonMap.sections[3].id, label: '1000' }
                Building.addUnit(newUnit)
                const newJsonMap = Building.getMap()
                const found = newJsonMap.sections[3].floors[3].units.find(u => u.label === newUnit.label)
                expect(found).not.toBeUndefined()
            })
            it('after adding unit with numeric label should update names of units placed next', () => {
                const Building = createBuildingMap(10)
                const jsonMap = Building.getMap()
                const unitPlacedAfterLabel = jsonMap.sections[5].floors[5].units[5].label
                const newUnit = { id: '', floor: jsonMap.sections[3].floors[3].id, section: jsonMap.sections[3].id, label: '1000' }
                Building.addUnit(newUnit)
                const newJsonMap = Building.getMap()
                expect(newJsonMap.sections[5].floors[5].units[5].label).not.toEqual(unitPlacedAfterLabel)
            })
            it('after adding unit with not-numeric label shouldn\'t update names of units placed before', () => {
                const Building = createBuildingMap(10)
                const jsonMap = Building.getMap()
                const unitPlacedBefore = jsonMap.sections[1].floors[1].units[1]
                const newUnit = { id: '', floor: jsonMap.sections[3].floors[3].id, section: jsonMap.sections[3].id, label: '1000' }
                Building.addUnit(newUnit)
                const newJsonMap = Building.getMap()
                expect(newJsonMap.sections[1].floors[1].units[1].label).toEqual(unitPlacedBefore.label)
            })
        })

        describe('Edit unit', () => {
            it('should update name of edited unit', () => {
                const Building = createBuildingMap(10)
                const jsonMap = Building.getMap()
                const updatedUnit = jsonMap.sections[5].floors[5].units[5]
                Building.updateUnit({ ...updatedUnit, label: 'Test label' })
                const newJsonMap = Building.getMap()
                const unitToCompare = newJsonMap.sections[5].floors[5].units[5]
                expect(unitToCompare.label).not.toEqual(updatedUnit.label)
            })
            it('should correctly update map if floor/section is changed', () => {
                const Building = createBuildingMap(10)
                const jsonMap = Building.getMap()
                const updatedUnit = jsonMap.sections[5].floors[5].units[5]
                Building.updateUnit({ ...updatedUnit, label: 'Test label', floor:  jsonMap.sections[2].floors[2].id, section: jsonMap.sections[2].id })
                const newJsonMap = Building.getMap()
                const info = Building.getUnitInfo(updatedUnit.id)
                expect(info.floor).toEqual(newJsonMap.sections[2].floors[2].id)
                expect(info.section).toEqual(newJsonMap.sections[2].id)
            })
        })

        describe('Delete unit', () => {
            it('should remove unit from map', () => {
                const Building = createBuildingMap(5)
                const jsonMap = Building.getMap()
                const unitToRemove = jsonMap.sections[1].floors[1].units[1]
                Building.removeUnit(unitToRemove.id)
                const found = Building.getUnitInfo(unitToRemove.id)
                expect(found.floor).toBe('')
            })
        })
    })
        
    describe('Section operations', () => {
        describe('Add section', () => {
            it('check generated structure on section add', () => {
                const Building = createBuildingMap(5)
                Building.addSection({ id: '', minFloor: -10, maxFloor: 10, unitsOnFloor: 10, name: sectionName() })
                expect(Building.sections).toHaveLength(6)
                Building.validate()
                expect(Building.isMapValid).toBe(true)
            })
        })
        describe('Edit section', () => {
            it('check rename of the structure on section edit', () => {
                const Building = createBuildingMap(10)
                const jsonMap = Building.getMap()
                const updatedSection = jsonMap.sections[1]
                Building.updateSection({ ...updatedSection, name: 'Test Section Name' })
                Building.validate()
                expect(Building.isMapValid).toBe(true)
                const newJsonMap = Building.getMap()
                expect(newJsonMap.sections[0].name).not.toEqual('Test Section Name')
                expect(newJsonMap.sections[1].name).toEqual('Test Section Name')
            })
        })
        describe('Delete section', () => {
            it('check if section is gone on delete', () => {
                const Building = createBuildingMap(10)
                const jsonMap = Building.getMap()
                const removeSection = jsonMap.sections[1]
                Building.removeSection(removeSection.id)
                Building.validate()
                expect(Building.isMapValid).toBe(true)
                expect(Building.sections).toHaveLength(9)
            })
        })
    })       

    
    describe('Checking validation ', () => {
        it('Check that unit operations do not break structure', () => {
            const Building = createBuildingMap(10)
            const jsonMap = Building.getMap()
            const newUnit = { id: '', floor: jsonMap.sections[3].floors[3].id, section: jsonMap.sections[3].id, label: '1000' }
            Building.addUnit(newUnit)
            Building.validate()
            expect(Building.isMapValid).toBe(true)
            Building.updateUnit({ ...jsonMap.sections[3].floors[3].units[3], label: 'Test label' })
            Building.validate()
            expect(Building.isMapValid).toBe(true)
            Building.removeUnit(jsonMap.sections[3].floors[3].units[3].id)
            Building.validate()
            expect(Building.isMapValid).toBe(true)
        })
        it('Check that section operations do not break structure', () => {
            const Building = createBuildingMap(10)
            const jsonMap = Building.getMap()
            Building.addSection({ id: '', minFloor: -10, maxFloor: 10, unitsOnFloor: 10, name: sectionName() })
            Building.validate()
            expect(Building.isMapValid).toBe(true)
            const updatedSection = jsonMap.sections[1]
            Building.updateSection({ ...updatedSection, name: 'Test Section Name' })
            Building.validate()
            expect(Building.isMapValid).toBe(true)
            Building.removeSection(updatedSection.id)
            Building.validate()
            expect(Building.isMapValid).toBe(true)
        })

        describe('Check that JSON schema validator is working', () => {
            it('Check that validator react on bad structure', () => {
                const Building = new MapEdit(null, () => null )
                Building.map = cloneDeep(notValidBuildingMapJson)
                const isValid = Building.validateSchema()
                expect(isValid).toBe(false)
                expect(Building.validationErrors).toHaveLength(1)
            })
            it('Check that validator not react on good structure', () => {
                const Building = new MapEdit(null, () => null )
                Building.map = cloneDeep(buildingMapJson)
                const isValid = Building.validateSchema()
                expect(isValid).toBe(true)                
            })
        })

    })

})
