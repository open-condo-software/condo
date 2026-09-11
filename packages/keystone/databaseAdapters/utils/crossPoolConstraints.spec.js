const {
    parseReferencedTable,
    selectCrossPoolForeignKeys,
} = require('./crossPoolConstraints')

// Message + MessageHistoryRecord routed to a dedicated database, everything else on main
const TABLE_DATABASES = {
    Message: 'message',
    MessageHistoryRecord: 'message',
}
const resolveTableDatabase = (tableName) => TABLE_DATABASES[tableName] || 'main'

describe('selectCrossPoolForeignKeys', () => {
    test('selects only constraints whose two tables live in different databases', () => {
        const foreignKeys = [
            // Message lives on "message", User on "main" -> unsatisfiable everywhere
            { tableName: 'Message', constraintName: 'Message_user_fk', referencedTableName: 'User' },
            { tableName: 'Message', constraintName: 'Message_org_fk', referencedTableName: 'Organization' },
            // both on "main"
            { tableName: 'Ticket', constraintName: 'Ticket_org_fk', referencedTableName: 'Organization' },
            // both on "message"
            { tableName: 'MessageHistoryRecord', constraintName: 'MHR_message_fk', referencedTableName: 'Message' },
        ]

        expect(selectCrossPoolForeignKeys({ foreignKeys, resolveTableDatabase })).toEqual([
            { tableName: 'Message', constraintName: 'Message_user_fk', referencedTableName: 'User' },
            { tableName: 'Message', constraintName: 'Message_org_fk', referencedTableName: 'Organization' },
        ])
    })

    test('keeps self-referencing constraints', () => {
        const foreignKeys = [
            { tableName: 'Message', constraintName: 'Message_parent_fk', referencedTableName: 'Message' },
        ]

        expect(selectCrossPoolForeignKeys({ foreignKeys, resolveTableDatabase })).toEqual([])
    })

    test('single-database topology drops nothing', () => {
        const foreignKeys = [
            { tableName: 'Message', constraintName: 'Message_user_fk', referencedTableName: 'User' },
            { tableName: 'Ticket', constraintName: 'Ticket_org_fk', referencedTableName: 'Organization' },
        ]

        expect(selectCrossPoolForeignKeys({
            foreignKeys,
            resolveTableDatabase: () => 'main',
        })).toEqual([])
    })

    test.each([
        ['undefined', undefined],
        ['empty', []],
    ])('handles %s constraint list', (_, foreignKeys) => {
        expect(selectCrossPoolForeignKeys({ foreignKeys, resolveTableDatabase })).toEqual([])
    })
})

describe('parseReferencedTable', () => {
    test.each([
        [
            'FOREIGN KEY ("user") REFERENCES "User"(id) DEFERRABLE INITIALLY DEFERRED',
            'User',
        ],
        [
            'FOREIGN KEY ("organization") REFERENCES "Organization"(id)',
            'Organization',
        ],
        [
            'FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
            'users',
        ],
    ])('%p', (definition, expected) => {
        expect(parseReferencedTable(definition)).toEqual(expected)
    })

    test.each([
        ['not a constraint definition'],
        [''],
        [undefined],
        [null],
    ])('returns null for %p', (definition) => {
        expect(parseReferencedTable(definition)).toBeNull()
    })
})
