/**
 * Shared SQL AST helpers for node-sql-parser (PostgreSQL build).
 * Used by mutation FK validation, provider SQL bridge, and cross-pool SELECT rewrite.
 */

/**
 * Append one character while inside a `--` line comment.
 * Ends the comment when a newline is seen.
 *
 * @param {string} char
 * @param {{ normalizedSql: string, lineComment: boolean }} state
 */
function _appendLineCommentChar (char, state) {
    state.normalizedSql += char
    if (char === '\n') state.lineComment = false
}

/**
 * Append one character while inside a `/* ... *\/` block comment.
 * Tracks nesting depth for nested block comments.
 *
 * @param {string} char
 * @param {string|undefined} nextChar
 * @param {number} index
 * @param {{ normalizedSql: string, blockCommentDepth: number, index: number }} state
 */
function _appendBlockCommentChar (char, nextChar, index, state) {
    state.normalizedSql += char
    if (char === '*' && nextChar === '/') {
        state.normalizedSql += nextChar
        state.index = index + 1
        state.blockCommentDepth -= 1
        return
    }
    if (char === '/' && nextChar === '*') {
        state.normalizedSql += nextChar
        state.index = index + 1
        state.blockCommentDepth += 1
    }
}

/**
 * Append one character while inside a quoted string (`'` or `"`).
 * Handles escaped quote pairs (`''` / `""`) and closes the quote on an unpaired delimiter.
 *
 * @param {string} char
 * @param {string|undefined} nextChar
 * @param {{ normalizedSql: string, quoteChar: string|null, index: number }} state
 */
function _appendQuotedChar (char, nextChar, state) {
    state.normalizedSql += char
    if (char === state.quoteChar) {
        if (nextChar === state.quoteChar) {
            state.normalizedSql += nextChar
            state.index += 1
        } else {
            state.quoteChar = null
        }
    }
}

/**
 * Detect and enter a line comment, block comment, or quoted string at the current position.
 *
 * @param {string} char
 * @param {string|undefined} nextChar
 * @param {number} index
 * @param {{ normalizedSql: string, quoteChar: string|null, lineComment: boolean, blockCommentDepth: number, index: number }} state
 * @returns {boolean} `true` when a comment or quote was started
 */
function _tryStartCommentOrQuote (char, nextChar, index, state) {
    if (char === '-' && nextChar === '-') {
        state.normalizedSql += char + nextChar
        state.index = index + 1
        state.lineComment = true
        return true
    }
    if (char === '/' && nextChar === '*') {
        state.normalizedSql += char + nextChar
        state.index = index + 1
        state.blockCommentDepth = 1
        return true
    }
    if (char === '\'' || char === '"') {
        state.normalizedSql += char
        state.quoteChar = char
        return true
    }
    return false
}

/**
 * Convert Knex `?` placeholders into PostgreSQL-style `$1`, `$2`, ... placeholders
 * so `node-sql-parser` can parse mutation SQL produced before `positionBindings()`.
 * Keeps placeholders inside quoted strings/comments untouched.
 *
 * @param {string} sql
 * @returns {string}
 */
function normalizePositionalBindings (sql) {
    if (!sql || !sql.includes('?')) return sql

    const state = {
        bindingIndex: 0,
        normalizedSql: '',
        quoteChar: null,
        lineComment: false,
        blockCommentDepth: 0,
        index: 0,
    }

    for (state.index = 0; state.index < sql.length; state.index++) {
        const char = sql[state.index]
        const nextChar = sql[state.index + 1]

        if (state.lineComment) {
            _appendLineCommentChar(char, state)
            continue
        }

        if (state.blockCommentDepth > 0) {
            _appendBlockCommentChar(char, nextChar, state.index, state)
            continue
        }

        if (state.quoteChar) {
            _appendQuotedChar(char, nextChar, state)
            continue
        }

        if (_tryStartCommentOrQuote(char, nextChar, state.index, state)) continue

        if (char === '?') {
            state.bindingIndex += 1
            state.normalizedSql += `$${state.bindingIndex}`
            continue
        }

        state.normalizedSql += char
    }

    return state.normalizedSql
}

/**
 * Convert a SQL AST literal node to a JavaScript value.
 * Supports null, bool, numbers, quoted strings, bare `string`, and Postgres `E'...'` escapes.
 *
 * @param {object|null} node
 * @returns {string|number|boolean|null|undefined} `undefined` when the node is not a supported literal
 */
function parseLiteralNode (node) {
    if (!node) return null
    if (node.type === 'null') return null
    if (node.type === 'bool') return node.value
    if (node.type === 'number' || node.type === 'bigint') return Number(node.value)
    if (node.type === 'string' || node.type === 'single_quote_string' || node.type === 'double_quote_string') {
        return node.value
    }
    if (node.type === 'origin') {
        const raw = String(node.value || '')
        if (raw.startsWith('E\'') && raw.endsWith('\'')) {
            return raw.slice(2, -1).replace(/''/g, '\'')
        }
        return raw
    }
    return undefined
}

/**
 * Resolve an AST value node to a JS value using positional `$N` bindings when present.
 * Falls back to {@link parseLiteralNode}, then to `node.value` for unrecognized nodes.
 *
 * @param {object|null} node
 * @param {Array} [bindings=[]] values for `$1`, `$2`, … (0-based in this array)
 * @returns {*}
 */
function resolveSqlValue (node, bindings = []) {
    if (!node || typeof node !== 'object') return node
    if (node.type === 'var' && node.prefix === '$') {
        return bindings[Number(node.name) - 1]
    }
    const literal = parseLiteralNode(node)
    return literal === undefined ? node.value : literal
}

/**
 * Normalize a column AST node to a bare column name string.
 *
 * For `column_ref`, `node-sql-parser` often nests the name under
 * `column.expr.value` (object) rather than a plain `column` string;
 * this helper unwraps both shapes and strips quotes.
 *
 * @param {*} columnNode
 * @returns {string|null}
 */
function normalizeColumnName (columnNode) {
    if (!columnNode) return null
    if (typeof columnNode === 'string') return columnNode.replace(/"/g, '')
    if (columnNode.type === 'column_ref') {
        return normalizeColumnName(columnNode.column)
    }
    if (columnNode.type === 'double_quote_string' || columnNode.type === 'single_quote_string') {
        return columnNode.value
    }
    if (columnNode.expr) {
        return normalizeColumnName(columnNode.expr)
    }
    if (typeof columnNode.column === 'string') return columnNode.column.replace(/"/g, '')
    if (columnNode.column?.expr) return normalizeColumnName(columnNode.column.expr)
    return null
}

module.exports = {
    normalizePositionalBindings,
    parseLiteralNode,
    resolveSqlValue,
    normalizeColumnName,
}
