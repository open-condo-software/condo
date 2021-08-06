/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-undef */

const HOME_PAGE_URL = 'http://localhost:3000'


class Home {

    visit () {
        cy.visit(HOME_PAGE_URL)
        return this
    }
}

export {
    Home,
    HOME_PAGE_URL,
}
