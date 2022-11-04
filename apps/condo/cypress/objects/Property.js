const PROPERTY_URL = '/property'
const PROPERTY_MAP_UPDATE_URL = '/map/update'

class PropertyCreate {
    visit () {
        cy.visit(PROPERTY_URL)
        cy.wait('@getAllOnBoardings')
        cy.location('pathname').should('eq', PROPERTY_URL)

        return this
    }

    clickOnPropertyTableRow () {
        cy.get('[data-cy=property__table] tbody .ant-table-row.ant-table-row-level-0').trigger('click')
        cy.location('pathname').should('contain', PROPERTY_URL)

        return this
    }

    clickEditPropertyMapButton () {
        cy.get('[data-cy=property-map__update-button]').click()
        cy.location('pathname').should('contain', PROPERTY_MAP_UPDATE_URL)

        return this
    }

    clickSection () {
        cy.get('[data-cy=property-map__section-button').click()

        return this
    }

    clickRemoveSection () {
        cy.get('[data-cy=property-map__remove-section-button]').click()

        return this
    }

    clickOnEditMenu () {
        cy.get('[data-cy=property-map__edit-menu-dropdown]').click()
        cy.get('[data-cy=property-map__edit-menu-dropdown').trigger('mouseover')
        cy.get('[data-cy=property-map__edit-menu-container').should('be.visible')

        return this
    }

    clickEditSection () {
        cy.get('[data-cy=property-map__edit-menu__add-section-button]').trigger('click')
        cy.get('[data-cy=property-map__add-section-form]').should('be.visible')

        return this
    }

    typeFloorCount (count = 1) {
        cy.get('[data-cy=property-map__add-section-form__floor-count]').focus().type(count)

        return this
    }

    typeUnitsOnFloorCount (count = 2) {
        cy.get('[data-cy=property-map__add-section-form__units-on-floor]').focus().type(count)

        return this
    }

    clickSubmitButton () {
        cy.get('[data-cy=property-map__section-form__submit-button]').click()
        cy.get('[data-cy=property-map__section-button').should('be.visible')
        cy.get('[data-cy=property-map__section-button').should('have.length', 1)
        cy.get('[data-cy=property-map__unit-button').should('be.visible')
        cy.get('[data-cy=property-map__unit-button').should('have.length', 2)

        return this
    }
}

export {
    PropertyCreate,
}
