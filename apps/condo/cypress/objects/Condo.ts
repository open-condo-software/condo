import { trackedVisit } from './helpers'

const URL = ''

class Condo {
    visit (): this {
        trackedVisit(URL)
        cy.wait('@getAllOnBoardings')

        cy.location('pathname').should('contain', URL)

        return this
    }

    clickOnMenuItem (menuItem: string): this {
        cy.get(`div[id="menuitem-${menuItem}"]`).click()
        return this
    }
}

export {
    Condo,
}
