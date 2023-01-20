import { PropertyMapCreate, PropertyMapEdit, PropertyMapUnitEdit } from '../../objects/Property'
import { authUserWithCookies } from '../../plugins/auth'

describe('Property', function () {
    describe('User', function () {
        afterEach(() => {
            cy.clearCookies()
        })

        it('can create property map', () => {
            cy.task('keystone:createUserWithProperty', true).then((response) => {
                authUserWithCookies(response)

                const propertyMapCreate = new PropertyMapCreate()
                propertyMapCreate
                    .visit()
                    .clickOnPropertyTableRow()
                    .clickEditPropertyMapButton()
                    .clickSection()
                    .clickRemoveSection()
                    .clickOnEditMenu()
                    .clickEditSection()
                    .typeFloorCount()
                    .typeUnitsOnFloorCount()
                    .clickSubmitButton()
                    .clickSavePropertyMap()
            })
        })

        it('can create and copy section', () => {
            cy.task('keystone:createUserWithProperty', true).then((response) => {
                authUserWithCookies(response)

                const propertyMapEdit = new PropertyMapEdit()
                propertyMapEdit
                    .visit()
                    .clickOnPropertyTableRow()
                    .clickEditPropertyMapButton()
                    .cleanUp()
                    .createTestSection()
                    .clickOnEditMenu()
                    .clickEditSection()
                    .clickSectionEditMode()
                    .clickSubmitButton()
                    .clickSavePropertyMap()
            })
        })

        it('can add, remove and update section unit', () => {
            cy.task('keystone:createUserWithProperty', true).then((response) => {
                authUserWithCookies(response)

                const propertyMapUnitEdit = new PropertyMapUnitEdit()
                propertyMapUnitEdit
                    .visit()
                    .clickOnPropertyTableRow()
                    .clickEditPropertyMapButton()
                    .openUnitAddModal()
                    .changeUnitType()
                    .typeUnitLabel()
                    .changeUnitSection()
                    .changeUnitFloor()
                    .clickSubmitButton()
                    .quickSave()
                    .selectUnit()
                    .clickRemoveUnit()
                    .quickSave()
                    .renameUnit()
                    .clickSavePropertyMap()
            })
        })
    })
})
