class AddressTransform {

    regExps = {}
    replaces = {}

    init (config) {
        try {
            for (const [search, replace] of Object.entries(config)) {
                if (search.startsWith('r')) {
                    this.regExps[search.slice(1)] = replace
                } else {
                    this.replaces[search] = replace
                }
            }

            return { error: null }
        } catch (error) {
            return { error: 'ADDRESS_TRANSFORM_CONFIG_MALFORMED_VALUE', errorMessage: `Malformed config ${error.message}` }
        }
    }

    apply (input) {
        if (typeof input !== 'string') {
            return input.trim()
        }
        for (const regFrom of Object.keys(this.regExps)) {
            if (this.regExps.hasOwnProperty(regFrom)) {
                const regTo = this.regExps[regFrom]
                input = input.trim().replace(new RegExp(regFrom, 'g'), regTo)
            }
        }

        for (const from of Object.keys(this.replaces)) {
            if (this.replaces.hasOwnProperty(from)) {
                input = input.trim().split(from).join(this.replaces[from])
            }
        }

        // since regExp or replaces can be written without carrying of space sequences
        // let's fold those space sequences
        return input
            .replaceAll(/\s\s\s/g, ' ')
            .replaceAll(/\s\s/g, ' ')
            .trim()
    }

}

module.exports = {
    AddressTransform,
}