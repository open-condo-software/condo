const { AddressInjection } = require('@address-service/domains/address/utils/serverSchema')

class InjectionsSeeker {

    /**
     * @param {String} s The string to search injections with
     */
    constructor (s) {
        this.s = s
    }

    /**
     * Splits search string to words
     * @returns {string[]}
     */
    extractSearchParts () {
        return this.s
            .replace(/[.,]/g, '')
            .split(' ')
            .filter(Boolean)
            .filter((x) => x.length > 1)
    }

    /**
     * Builds the `where` condition for the database query
     * @returns {{AND: [{deletedAt: null},{OR: {keywords_contains_i: *}[]}]}}
     */
    buildWhere () {
        const searchParts = this.extractSearchParts()

        return {
            AND: [
                { deletedAt: null },
                {
                    OR: searchParts.map((searchPart) => ({ keywords_contains_i: searchPart })),
                },
            ],
        }
    }

    /**
     * @param {Keystone} context The keystone's context
     * @returns {Promise<AddressInjection[]>}
     */
    async getInjections (context) {
        return await AddressInjection.getAll(context, this.buildWhere())
    }
}

module.exports = { InjectionsSeeker }
