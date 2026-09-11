const {
    normalizeColumnName,
    normalizePositionalBindings,
    parseLiteralNode,
    resolveSqlValue,
} = require('./sqlAstUtils')

describe('sqlAstUtils', () => {
    describe('normalizePositionalBindings', () => {
        test('returns falsy / no-placeholder SQL unchanged', () => {
            expect(normalizePositionalBindings('')).toEqual('')
            expect(normalizePositionalBindings(null)).toEqual(null)
            expect(normalizePositionalBindings('select 1')).toEqual('select 1')
        })

        test('rewrites standalone bind placeholders', () => {
            expect(normalizePositionalBindings('select * from t where a = ? and b = ?'))
                .toEqual('select * from t where a = $1 and b = $2')
        })

        test('preserves PostgreSQL JSON operators ?| and ?&', () => {
            expect(normalizePositionalBindings('select * from t where tags ?| array[?]'))
                .toEqual('select * from t where tags ?| array[$1]')
            expect(normalizePositionalBindings('select * from t where tags ?& array[?]'))
                .toEqual('select * from t where tags ?& array[$1]')
        })

        test('leaves question marks inside dollar-quoted strings unchanged', () => {
            expect(normalizePositionalBindings('select $$a?b$$, ?'))
                .toEqual('select $$a?b$$, $1')
            expect(normalizePositionalBindings('select $tag$a?b$tag$, ?'))
                .toEqual('select $tag$a?b$tag$, $1')
        })

        test('rewrites ? when a dollar quote is unclosed', () => {
            expect(normalizePositionalBindings('select $$a?b, ?'))
                .toEqual('select $$a$1b, $2')
        })

        test('leaves question marks inside E-prefixed strings unchanged', () => {
            expect(normalizePositionalBindings('select E\'a\\?b\', ?'))
                .toEqual('select E\'a\\?b\', $1')
            expect(normalizePositionalBindings('select e\'a?b\', ?'))
                .toEqual('select e\'a?b\', $1')
        })

        test('leaves question marks inside quoted strings and identifiers', () => {
            expect(normalizePositionalBindings('select \'a?b\', ?'))
                .toEqual('select \'a?b\', $1')
            expect(normalizePositionalBindings('select "col?name", ?'))
                .toEqual('select "col?name", $1')
            expect(normalizePositionalBindings('select \'it\'\'s ?\', ?'))
                .toEqual('select \'it\'\'s ?\', $1')
        })

        test('leaves question marks inside line and block comments', () => {
            expect(normalizePositionalBindings('select ? -- c?\n, ?'))
                .toEqual('select $1 -- c?\n, $2')
            expect(normalizePositionalBindings('select /* ? */ ?, ?'))
                .toEqual('select /* ? */ $1, $2')
            expect(normalizePositionalBindings('select /* outer /* inner ? */ still ? */ ?'))
                .toEqual('select /* outer /* inner ? */ still ? */ $1')
        })
    })

    describe('parseLiteralNode', () => {
        test('maps null / missing nodes to null', () => {
            expect(parseLiteralNode(null)).toBeNull()
            expect(parseLiteralNode(undefined)).toBeNull()
            expect(parseLiteralNode({ type: 'null' })).toBeNull()
        })

        test('returns bool, string, and origin literals', () => {
            expect(parseLiteralNode({ type: 'bool', value: true })).toBe(true)
            expect(parseLiteralNode({ type: 'string', value: 'hi' })).toEqual('hi')
            expect(parseLiteralNode({ type: 'single_quote_string', value: 'a' })).toEqual('a')
            expect(parseLiteralNode({ type: 'double_quote_string', value: 'b' })).toEqual('b')
            expect(parseLiteralNode({ type: 'origin', value: 'now()' })).toEqual('now()')
        })

        test('preserves bigint values without Number() coercion', () => {
            expect(parseLiteralNode({ type: 'bigint', value: '9007199254740993' }))
                .toEqual('9007199254740993')
        })

        test('converts number literals with Number()', () => {
            expect(parseLiteralNode({ type: 'number', value: '42' })).toEqual(42)
        })

        test('decodes PostgreSQL E-string backslash escapes', () => {
            expect(parseLiteralNode({ type: 'origin', value: 'E\'a\\nb\\t\\\\\'' }))
                .toEqual('a\nb\t\\')
            expect(parseLiteralNode({ type: 'origin', value: 'E\'\\r\\b\\f\\\'\\"\'' }))
                .toEqual('\r\b\f\'"')
            expect(parseLiteralNode({ type: 'origin', value: 'E\'it\'\'s\'' }))
                .toEqual('it\'s')
        })

        test('returns undefined for unsupported node types', () => {
            expect(parseLiteralNode({ type: 'column_ref', column: 'id' })).toBeUndefined()
        })
    })

    describe('resolveSqlValue', () => {
        test('returns non-object nodes as-is', () => {
            expect(resolveSqlValue(null)).toBeNull()
            expect(resolveSqlValue('raw')).toEqual('raw')
            expect(resolveSqlValue(7)).toEqual(7)
        })

        test('resolves positional $N vars from bindings', () => {
            expect(resolveSqlValue({ type: 'var', prefix: '$', name: '1' }, ['u-1', 'u-2'])).toEqual('u-1')
            expect(resolveSqlValue({ type: 'var', prefix: '$', name: '2' }, ['u-1', 'u-2'])).toEqual('u-2')
        })

        test('falls back to parseLiteralNode, then node.value', () => {
            expect(resolveSqlValue({ type: 'number', value: '3' })).toEqual(3)
            expect(resolveSqlValue({ type: 'unknown', value: 'keep' })).toEqual('keep')
        })
    })

    describe('normalizeColumnName', () => {
        test('returns null for missing or unrecognized nodes', () => {
            expect(normalizeColumnName(null)).toBeNull()
            expect(normalizeColumnName({ type: 'number', value: 1 })).toBeNull()
        })

        test('strips quotes from plain strings', () => {
            expect(normalizeColumnName('"user"')).toEqual('user')
            expect(normalizeColumnName('organization')).toEqual('organization')
        })

        test('unwraps node-sql-parser column_ref / quote / expr shapes', () => {
            expect(normalizeColumnName({ type: 'column_ref', column: 'id' })).toEqual('id')
            expect(normalizeColumnName({ type: 'double_quote_string', value: 'user' })).toEqual('user')
            expect(normalizeColumnName({ type: 'single_quote_string', value: 'type' })).toEqual('type')
            expect(normalizeColumnName({
                type: 'column_ref',
                column: { expr: { type: 'double_quote_string', value: 'remoteClient' } },
            })).toEqual('remoteClient')
            expect(normalizeColumnName({
                expr: { type: 'double_quote_string', value: 'organization' },
            })).toEqual('organization')
        })
    })
})
