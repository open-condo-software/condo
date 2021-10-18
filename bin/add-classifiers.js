const has = require('lodash/has')
const { v4: uuid } = require('uuid')
const path = require('path')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { GqlWithKnexLoadList } = require('@condo/domains/common/utils/serverSchema')

const CLASSIFIER_PLACE_TEMPLATE = 'INSERT INTO public."TicketPlaceClassifier" (dv, sender, "name", id, v, "createdAt", "updatedAt", "deletedAt", "newId", "createdBy", organization,  "updatedBy") VALUES (1, \'{"dv": 1, "fingerprint": "initial_import"}\', \'{name}\', \'{uuid}\', 1, \'2021-07-22 00:00:00.000000\', \'2021-07-22 00:00:00.000000\', null, null, null, null, null);'
const CLASSIFIER_CATEGORY_TEMPLATE = 'INSERT INTO public."TicketCategoryClassifier" (dv, sender, "name", id, v, "createdAt", "updatedAt", "deletedAt", "newId", "createdBy", organization,  "updatedBy") VALUES (1, \'{"dv": 1, "fingerprint": "initial_import"}\', \'{name}\', \'{uuid}\', 1, \'2021-07-22 00:00:00.000000\', \'2021-07-22 00:00:00.000000\', null, null, null, null, null);'
const CLASSIFIER_PROBLEM_TEMPLATE = 'INSERT INTO public."TicketProblemClassifier" (dv, sender, "name", id, v, "createdAt", "updatedAt", "deletedAt", "newId", "createdBy", organization,  "updatedBy") VALUES (1, \'{"dv": 1, "fingerprint": "initial_import"}\', \'{name}\', \'{uuid}\', 1, \'2021-07-22 00:00:00.000000\', \'2021-07-22 00:00:00.000000\', null, null, null, null, null);'
const CLASSIFIER_RULE_TEMPLATE = 'INSERT INTO public."TicketClassifierRule" ("dv", "sender", "id", "v", "createdAt", "updatedAt", "deletedAt", "newId", "category", "createdBy", "place", "problem", "updatedBy") VALUES (1, \'{"dv": 1, "fingerprint": "initial_import"}\', \'{uuid}\', 1, \'2021-07-22 00:00:00.000000\', \'2021-07-22 00:00:00.000000\', null, null, \'{category}\', null, \'{place}\', {problem}, null);'


const CLASSIFIER_PLACE_REMOVE_TEMPLATE = 'DELETE FROM public."TicketPlaceClassifier" WHERE "id" = \'{uuid}\'; '
const CLASSIFIER_CATEGORY_REMOVE_TEMPLATE = 'DELETE FROM public."TicketCategoryClassifier" WHERE "id" = \'{uuid}\'; '
const CLASSIFIER_PROBLEM_REMOVE_TEMPLATE = 'DELETE FROM public."TicketProblemClassifier" WHERE "id" = \'{uuid}\'; '
const CLASSIFIER_RULE_REMOVE_TEMPLATE = 'DELETE FROM public."TicketClassifierRule" WHERE "id" = \'{uuid}\';'

const MIGRATION_TEMPLATE = `
exports.up = async (knex) => {
    await knex.raw(\`
    BEGIN;
    
    [UP]

    COMMIT;
    \`)
}

exports.down = async (knex) => {
    await knex.raw(\`
    BEGIN;
    
    [DOWN]
    
    COMMIT;
    \`)
}
`
// Example:
// Чердаки, подвалы;Доступ;Ограничение доступа
// type=place =  Чердаки, подвалы
// type=category = Доступ
// type=problem = Ограничение доступа
// relations (2): place + category + problem (null)
// Чердаки, подвалы => Доступ => Ограничение доступа
// Чердаки, подвалы => Доступ => null


const importCsvData = `
Подъезд;Доводчик;Сломался доводчик
Подъезд;Доводчик;Установить доводчик
Нежилое помещение;Доводчик;Сломался доводчик
Нежилое помещение;Доводчик;Установить доводчик
Кладовка;Доводчик;Сломался доводчик
Кладовка;Доводчик;Установить доводчик
Чердаки подвалы;Доводчик;Сломался доводчик
Чердаки подвалы;Доводчик;Установить доводчик
`

class NewClassifiersToSql {

    places = {}
    categories = {}
    problems = {}
    relations = []
    nullRelations = {}

    existingClassifiers = {
        places: {},
        categories: {},
        problems: {},
    }

    uuids = {
        places: {},
        categories: {},
        problems: {},
    }

    async init () {
        const resolved = path.resolve('./index.js')
        const { distDir, keystone, apps } = require(resolved)
        const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
        // we need only apollo
        await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
        await keystone.connect()
        this.context = await keystone.createContext({ skipAccessControl: true })
        await this.loadExistingClassifiers()
    }

    async loadExistingClassifiers () {
        const modelsToLoad = {
            places: 'TicketPlaceClassifier',
            categories: 'TicketCategoryClassifier',
            problems: 'TicketPlaceClassifier',
        }
        await Promise.all(Object.entries(modelsToLoad).map( async ([key, Model]) => {
            const knexLoader = new GqlWithKnexLoadList({
                listKey: Model,
                fields: 'id name',
            })
            const records = await knexLoader.load()
            records.forEach( record => {
                this.existingClassifiers[key][this.toKey(record.name)] = record.id
            })
        }))
    }

    toKey (name) {
        return name.replace(/[^A-Za-zА-Яа-яЁё]/g, '').toLowerCase()
    }

    setUUID (type, key) {
        if (!has(this.uuids[type], key)) {
            this.uuids[type][key] = this.existingClassifiers[type][key] ? this.existingClassifiers[type][key] : uuid()
        }
    }

    setUUIDS (place, category, problem){
        this.setUUID('places', place)
        this.setUUID('categories', category)
        this.setUUID('problems', problem)
    }

    setRelation (place, category, problem) {
        this.setUUIDS(place, category, problem)
        this.relations.push({
            place: this.uuids.places[place],
            category: this.uuids.categories[category],
            problem: this.uuids.problems[problem],
        })
        this.nullRelations[[place, category].join('_')] = {
            place: this.uuids.places[place],
            category: this.uuids.categories[category],
            problem: null,
        }
    }

    prepareData () {
        const data = importCsvData.split('\n')
        data.forEach(line => {
            line = line.trim()
            const semiColonsCount =  (line.match(/;/g) || []).length
            if (line.length && semiColonsCount === 2) {
                const [place, category, problem] = line.trim().split(';')
                const [placeKey, categoryKey, problemKey] = [place, category, problem].map( key => this.toKey(key) )
                this.places[placeKey] = place
                this.categories[categoryKey] = category
                this.problems[problemKey] = problem
                this.setRelation(placeKey, categoryKey, problemKey)
            }
        })
    }

    getClassifierSql ({ name, uuid }, template) {
        return template
            .split('{name}').join(name)
            .split('{uuid}').join(uuid)
    }

    getClassifiersSql () {
        const classifiersUp = []
        const classifiersDown = []
        for (const placeKey in this.places) {
            if (!this.existingClassifiers.places[placeKey]) {
                classifiersUp.push(this.getClassifierSql({ name: this.places[placeKey], uuid: this.uuids.places[placeKey] }, CLASSIFIER_PLACE_TEMPLATE))
                classifiersDown.push(CLASSIFIER_PLACE_REMOVE_TEMPLATE.split('{uuid}').join(this.uuids.places[placeKey]))
            }
        }
        for (const categoryKey in this.categories) {
            if (!this.existingClassifiers.categories[categoryKey]) {
                classifiersUp.push(this.getClassifierSql({ name: this.categories[categoryKey], uuid: this.uuids.categories[categoryKey] }, CLASSIFIER_CATEGORY_TEMPLATE))
                classifiersDown.push(CLASSIFIER_CATEGORY_REMOVE_TEMPLATE.split('{uuid}').join(this.uuids.categories[categoryKey]))
            }
        }
        for (const problemKey in this.problems) {
            if (!this.existingClassifiers.problems[problemKey]) {
                classifiersUp.push(this.getClassifierSql({ name: this.problems[problemKey], uuid: this.uuids.problems[problemKey] }, CLASSIFIER_PROBLEM_TEMPLATE))
                classifiersDown.push(CLASSIFIER_PROBLEM_REMOVE_TEMPLATE.split('{uuid}').join(this.uuids.problems[problemKey]))
            }
        }
        return [ classifiersUp.join('\n'), classifiersDown.join('\n') ]
    }

    getRelationsSql () {
        const relationsUp = []
        const relationsDown = []
        const allRelations = [...this.relations, ...Object.values(this.nullRelations)]
        allRelations.forEach(({ place, category, problem }) => {
            const newId = uuid()
            relationsUp.push(
                CLASSIFIER_RULE_TEMPLATE
                    .split('{uuid}').join(newId)
                    .split('{place}').join(place)
                    .split('{category}').join(category)
                    .split('{problem}').join(problem ? `'${problem}'` : null)
            )
            relationsDown.push(CLASSIFIER_RULE_REMOVE_TEMPLATE.split('{uuid}').join(newId))
        })
        return [ relationsUp.join('\n'), relationsDown.join('\n') ]
    }

    async printResult () {
        await this.init()
        this.prepareData()
        const [ classifiersUp, classifiersDown ] = this.getClassifiersSql()
        const [ relationsUp, relationsDown ] = this.getRelationsSql()
        process.stdout.write(
            MIGRATION_TEMPLATE
                .replace('[UP]', classifiersUp + '\n' + relationsUp)
                .replace('[DOWN]',  classifiersDown + '\n' + relationsDown)
        )
        process.exit(0)
    }

}


const Migration = new NewClassifiersToSql()
Migration.printResult().then(result => {
    process.exit(0)
}).catch(error => {
    console.error('Error', error)
    process.exit(1)
})