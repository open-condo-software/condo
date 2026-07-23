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
 * Handles escaped quote pairs (`''` / `""`), and backslash escapes for E-strings.
 *
 * @param {string} char
 * @param {string|undefined} nextChar
 * @param {{ normalizedSql: string, quoteChar: string|null, eString: boolean, index: number }} state
 */
function _appendQuotedChar (char, nextChar, state) {
    state.normalizedSql += char
    if (state.eString && char === '\\' && nextChar !== undefined) {
        state.normalizedSql += nextChar
        state.index += 1
        return
    }
    if (char === state.quoteChar) {
        if (nextChar === state.quoteChar) {
            state.normalizedSql += nextChar
            state.index += 1
        } else {
            state.quoteChar = null
            state.eString = false
        }
    }
}

/**
 * Copy a PostgreSQL dollar-quoted string (`$$...$$` / `$tag$...$tag$`) unchanged.
 *
 * @param {string} sql
 * @param {number} index
 * @param {{ normalizedSql: string, index: number }} state
 * @returns {boolean}
 */
function _tryCopyDollarQuotedString (sql, index, state) {
    if (sql[index] !== '$') return false
    const openMatch = sql.slice(index).match(/^\$([A-Za-z_]*)\$/)
    if (!openMatch) return false
    const tag = openMatch[0]
    const contentStart = index + tag.length
    const closeIdx = sql.indexOf(tag, contentStart)
    if (closeIdx === -1) return false
    state.normalizedSql += sql.slice(index, closeIdx + tag.length)
    state.index = closeIdx + tag.length - 1
    return true
}

/**
 * Detect and enter a line comment, block comment, dollar-quoted string, or quoted string.
 *
 * @param {string} char
 * @param {string|undefined} nextChar
 * @param {number} index
 * @param {string} sql
 * @param {{ normalizedSql: string, quoteChar: string|null, eString: boolean, lineComment: boolean, blockCommentDepth: number, index: number }} state
 * @returns {boolean} `true` when a comment or quote was started
 */
function _tryStartCommentOrQuote (char, nextChar, index, sql, state) {
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
    if (_tryCopyDollarQuotedString(sql, index, state)) return true
    if ((char === 'E' || char === 'e') && nextChar === '\'') {
        const prev = index > 0 ? sql[index - 1] : ''
        if (!/[A-Za-z0-9_]/.test(prev)) {
            state.normalizedSql += char + nextChar
            state.index = index + 1
            state.quoteChar = '\''
            state.eString = true
            return true
        }
    }
    if (char === '\'' || char === '"') {
        state.normalizedSql += char
        state.quoteChar = char
        state.eString = false
        return true
    }
    return false
}

/**
 * Convert Knex `?` placeholders into PostgreSQL-style `$1`, `$2`, ... placeholders
 * so `node-sql-parser` can parse mutation SQL produced before `positionBindings()`.
 * Keeps placeholders inside quoted strings/comments untouched, preserves JSON operators
 * `?|` / `?&`, and leaves question marks inside dollar-quoted and E-prefixed strings.
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
        eString: false,
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

        if (_tryStartCommentOrQuote(char, nextChar, state.index, sql, state)) continue

        if (char === '?') {
            if (nextChar === '|' || nextChar === '&') {
                state.normalizedSql += char
                continue
            }
            state.bindingIndex += 1
            state.normalizedSql += `$${state.bindingIndex}`
            continue
        }

        state.normalizedSql += char
    }

    return state.normalizedSql
}

/**
 * Decode PostgreSQL `E'...'` backslash escapes (and doubled single quotes).
 *
 * @param {string} content string body without the `E'` / `'` wrappers
 * @returns {string}
 */
function _decodePostgresEStringContent (content) {
    let result = ''
    for (let i = 0; i < content.length; i++) {
        const char = content[i]
        if (char === '\'' && content[i + 1] === '\'') {
            result += '\''
            i += 1
            continue
        }
        if (char !== '\\' || i === content.length - 1) {
            result += char
            continue
        }
        const next = content[++i]
        switch (next) {
            case 'n':
                result += '\n'
                break
            case 't':
                result += '\t'
                break
            case 'r':
                result += '\r'
                break
            case 'b':
                result += '\b'
                break
            case 'f':
                result += '\f'
                break
            case '\\':
                result += '\\'
                break
            case '\'':
                result += '\''
                break
            case '"':
                result += '"'
                break
            default:
                result += next
                break
        }
    }
    return result
}

/**
 * Convert a SQL AST literal node to a JavaScript value.
 * Supports null, bool, numbers, quoted strings, bare `string`, and Postgres `E'...'` escapes.
 * Bigint values are returned as-is (no `Number()` coercion) to preserve precision.
 *
 * @param {object|null} node
 * @returns {string|number|boolean|null|undefined} `undefined` when the node is not a supported literal
 */
function parseLiteralNode (node) {
    if (!node) return null
    if (node.type === 'null') return null
    if (node.type === 'bool') return node.value
    if (node.type === 'bigint') return node.value
    if (node.type === 'number') return Number(node.value)
    if (node.type === 'string' || node.type === 'single_quote_string' || node.type === 'double_quote_string') {
        return node.value
    }
    if (node.type === 'origin') {
        const raw = String(node.value || '')
        if (/^E'/i.test(raw) && raw.endsWith('\'')) {
            return _decodePostgresEStringContent(raw.slice(2, -1))
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
