import { SimpleTracer } from '../../objects/helpers'
import { PropertyMapCreate, PropertyMapEdit, PropertyMapUnitEdit } from '../../objects/Property'
import { authUserWithCookies } from '../../plugins/auth'

describe('Property', function () {
    describe('User', function () {
        afterEach(() => {
            cy.clearCookies()
        })

        it('can create property map', () => {
            const trace = new SimpleTracer('property.user.canCreatePropertyMap')
            const spanPrepare = trace.startSpan('1.createUserWithProperty')
            cy.task('keystone:createUserWithProperty', true).then((response) => {
                authUserWithCookies(response)
                spanPrepare.finish()
                const spanCreate = trace.startSpan('2.propertyMapCreate')
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
                spanCreate.finish()
            }).then(() => {
                trace.finish()
            })
        })

        it('can create and copy section', () => {
            const trace = new SimpleTracer('property.user.canCreateAndCopySection')
            const spanPrepare = trace.startSpan('1.createUserWithProperty')
            cy.task('keystone:createUserWithProperty', true).then((response) => {
                authUserWithCookies(response)
                spanPrepare.finish()
                const spanEdit = trace.startSpan('2.editPropertyMap')
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
                // TODO: @toplenboren (Doma-5845) await for loading!
                spanEdit.finish()
            }).then(() => {
                trace.finish()
            })
        })

        it('can add, remove and update section unit', () => {
            const trace = new SimpleTracer('property.user.canAddRemoveAndUpdateSectionUnit')
            const spanPrepare = trace.startSpan('1.createUserWithProperty')
            cy.task('keystone:createUserWithProperty', true).then((response) => {
                authUserWithCookies(response)
                spanPrepare.finish()
                const spanEdit = trace.startSpan('2.editPropertyMap')
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
                spanEdit.finish()
            }).then(() => {
                trace.finish()
            })
        })
    })
})
