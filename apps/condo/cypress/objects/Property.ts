const PROPERTY_URL = '/property'
const PROPERTY_MAP_UPDATE_URL = '/map/update'

class BasePropertyTest {
    visit (): this {
        cy.visit(PROPERTY_URL)
        cy.wait('@getAllOnBoardings')

        cy.location('pathname').should('contain', PROPERTY_URL)
        cy.get('[data-cy=property__table]').should('be.visible')

        return this
    }

    clickOnPropertyTableRow (): this {
        cy.get('[data-cy=property__table] tbody .ant-table-row.ant-table-row-level-0').trigger('click')
        cy.location('pathname').should('contain', PROPERTY_URL)

        return this
    }

    clickEditPropertyMapButton (): this {
        cy.get('[data-cy=property-map__update-button]').click()
        cy.location('pathname').should('contain', PROPERTY_MAP_UPDATE_URL)

        return this
    }

    clickOnEditMenu (): this {
        cy.get('[data-cy=property-map__edit-menu-dropdown]').click()
        cy.get('[data-cy=property-map__edit-menu-dropdown').trigger('mouseover')
        cy.get('[data-cy=property-map__edit-menu-container').should('be.visible')

        return this
    }

    clickEditSection (): this {
        cy.get('[data-cy=property-map__edit-menu__add-section-button]').trigger('click')
        cy.get('[data-cy=property-map__add-section-form]').should('be.visible')

        return this
    }

    clickCloseModal (): this {
        cy.get('[data-cy=property-map__top-modal__close-button]').click()
        cy.get('[data-cy=property-map__top-modal__children-container]').should('be.hidden')

        return this
    }

    clickSavePropertyMap (): this {
        cy.get('[data-cy=property-map__save-map-button]').click()
        cy.location('pathname').should('not.contain', PROPERTY_MAP_UPDATE_URL)

        return this
    }

    quickSave (): this {
        cy.get('.fullscreen').type('{ctrl+s}')

        return this
    }
}

class PropertyMapCreate extends BasePropertyTest {
    clickSection (): this {
        cy.get('[data-cy=property-map__section-button]').click()

        return this
    }

    clickRemoveSection (): this {
        cy.get('[data-cy=property-map__remove-section-button]').click()

        cy.get('[data-cy=property-map__section-button]').should('have.length', 1)
        cy.get('[data-cy=property-map__unit-button]').should('have.length', 8)

        return this
    }

    typeFloorCount (count = 1): this {
        cy.get('[data-cy=property-map__add-section-form__floor-count]').focus().type(String(count))

        return this
    }

    typeUnitsOnFloorCount (count = 2): this {
        cy.get('[data-cy=property-map__add-section-form__units-on-floor]').focus().type(String(count))

        return this
    }

    clickSubmitButton (): this {
        cy.get('[data-cy=property-map__section-form__submit-button]').click()
        cy.get('[data-cy=property-map__section-button]').should('be.visible')
        cy.get('[data-cy=property-map__section-button]').should('have.length', 1)
        cy.get('[data-cy=property-map__unit-button]').should('be.visible')
        cy.get('[data-cy=property-map__unit-button]').should('have.length', 2)

        return this
    }
}

class PropertyMapEdit extends BasePropertyTest {
    cleanUp (): this {
        cy.get('[data-cy=property-map__section-button]').click()
        cy.get('[data-cy=property-map__remove-section-button]').click()

        return this
    }

    createTestSection (): this {
        this.clickOnEditMenu()
        this.clickEditSection()

        cy.get('[data-cy=property-map__add-section-form__floor-count]').focus().type('5')
        cy.get('[data-cy=property-map__add-section-form__units-on-floor]').focus().type('5')
        cy.get('[data-cy=property-map__section-form__submit-button]').click()


        cy.get('[data-cy=property-map__section-button]').should('be.visible')
        cy.get('[data-cy=property-map__section-button]').should('have.length', 1)
        cy.get('[data-cy=property-map__unit-button]').should('be.visible')
        cy.get('[data-cy=property-map__unit-button]').should('have.length', 25)


        return this
    }

    selectExistingSection (): this {
        cy.get('[data-cy=property-map__section-button]').click()

        return this
    }

    clickSectionEditMode (): this {
        cy.get('[data-cy=property-map__add-section-form__section-mode-select]').click()
        cy.get('[data-cy=property-map__add-section-form__section-mode-select__copy-option]').first().click()

        cy.get('[data-cy=property-map__section-button]').should('be.visible')
        cy.get('[data-cy=property-map__section-button]').should('have.length', 2)
        cy.get('[data-cy=property-map__unit-button]').should('be.visible')
        cy.get('[data-cy=property-map__unit-button]').should('have.length', 50)

        return this
    }

    clickSubmitButton (): this {
        cy.get('[data-cy=property-map__section-form__submit-button]').click()

        cy.get('[data-cy=property-map__save-map-button]').should('be.disabled')
        this.clickCloseModal()

        cy.get('[data-cy=property-map__save-map-button]').should('not.be.disabled')
        cy.get('[data-cy=property-map__section-button]').should('be.visible')
        cy.get('[data-cy=property-map__section-button]').should('have.length', 2)
        cy.get('[data-cy=property-map__unit-button]').should('be.visible')
        cy.get('[data-cy=property-map__unit-button]').should('have.length', 50)

        return this
    }
}

class PropertyMapUnitEdit extends BasePropertyTest {
    openUnitAddModal (): this {
        this.clickOnEditMenu()
        cy.get('[data-cy=property-map__edit-menu__add-unit-button]').click()

        return this
    }

    changeUnitType (): this {
        cy.get('[data-cy=property-map__unit-form__unit-type-select]').click()
        cy.get('[data-cy=property-map__unit-form__unit-type-select__option]').last().click()

        return this
    }

    typeUnitLabel (label = '1000'): this {
        cy.get('[data-cy=property-map__unit-form__label-input]').focus().clear().type(label)

        return this
    }

    changeUnitSection (): this {
        cy.get('[data-cy=property-map__unit-form__section-select]').click()
        cy.get('[data-cy=property-map__unit-form__section-select__option]').first().click()

        return this
    }

    changeUnitFloor (): this {
        cy.get('[data-cy=property-map__unit-form__floor-select]').click()
        cy.get('[data-cy=property-map__unit-form__floor-select__option]').last().click()

        return this
    }

    selectUnit (): this {
        cy.get('[data-cy=property-map__unit-button]').last().click()

        return this
    }

    clickSubmitButton (): this {
        cy.get('[data-cy=property-map__unit-form__submit-button]').click()

        cy.get('[data-cy=property-map__unit-button]').should('have.length', 29)

        return this
    }

    clickRemoveUnit (): this {
        cy.get('[data-cy=property-map__unit-form__delete-button]').click()

        cy.get('[data-cy=property-map__unit-button]').should('have.length', 28)

        return this
    }

    renameUnit (): this {
        cy.get('[data-cy=property-map__unit-button]').last().click()
        cy.get('[data-cy=property-map__unit-form__submit-button]').click()

        return this
    }
}

export {
    PropertyMapCreate,
    PropertyMapEdit,
    PropertyMapUnitEdit,
}
