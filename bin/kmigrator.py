#!/usr/bin/env python3

import sys

if sys.version_info[0] < 3:
    print("ERROR: required Python version >= 3.5")
    sys.exit(1)
try:
    import django
    if django.VERSION[0] < 3:
        print("ERROR: Django is {}! required version >= 3.0.6".format(django.VERSION))
        print("TRY TO FIX BY COMMAND: '{} -m pip install \"Django>=3.0.6\"'".format(sys.executable))
        sys.exit(1)
except:
    print("ERROR: required Django version >= 3.0")
    print("TRY TO FIX BY COMMAND: '{} -m pip install \"Django>=3.0.6\"'".format(sys.executable))
    sys.exit(1)
try:
    import psycopg2
except:
    print("ERROR: required Psycopg")
    print("TRY TO FIX BY COMMAND: '{} -m pip install \"psycopg2-binary>=2.8.5\"'".format(sys.executable))
    sys.exit(1)

import base64
import os
import re
import shutil
import subprocess
import json
from datetime import datetime
from pathlib import Path
from time import time

VERSION = (1, 7, 0)
DISABLE_MODEL_CHOICES = True
CACHE_DIR = Path('.kmigrator')
KNEX_MIGRATIONS_DIR = Path('migrations')
GET_KNEX_SETTINGS_SCRIPT = CACHE_DIR / 'get.knex.settings.js'
GET_KNEX_VIEWS_SCRIPT = CACHE_DIR / 'get.knex.views.js'
GET_KNEX_VIEWS_LOG = CACHE_DIR / 'get.knex.views.log'
KNEX_MIGRATE_SCRIPT = CACHE_DIR / 'knex.run.js'
GET_KNEX_SETTINGS_LOG = CACHE_DIR / 'get.knex.settings.log'
DJANGO_DIR = CACHE_DIR / '_django_schema'
DJANGO_MODEL_GENERATOR_SCRIPT = '''
# -*- coding: utf-8 -*-

import json
from django.template import Library, Template, Engine, Context
import keyword
import sys

DATA = '__KNEX_SCHEMA_DATA__'
DISABLE_MODEL_CHOICES = '__DISABLE_MODEL_CHOICES__'.lower() in ('y', 'yes', 't', 'true', 'on', '1')
NAME = '_django_model_generator'
MODELS_TPL = """
# -*- coding: utf-8 -*-

from django.db import models
from datetime import date, time, datetime, timedelta
from django.db.models import *
from django.db.models.indexes import *
from django.contrib.postgres.indexes import *
try:
    from django.db.models import JSONField
except ImportError:
    from django.contrib.postgres.fields import JSONField

{% for tablename, fields in schema.items %}
class {{ tablename|to_classname }}(models.Model):
    {% for fieldname, field in fields.items %}{% if fieldname != '__meta' %}
    {{ fieldname|to_fieldname }} = {{ field|to_fieldtype:fieldname|safe }}{% endif %}{% endfor %}

    class Meta:
        db_table = '{{ tablename|to_tablename }}'
        {{ fields|to_meta|safe }}

{% endfor %}
"""

register = Library()


@register.filter
def to_classname(value):
    """
    >>> to_classname('public._ContentType_Test_body')
    'ContentType_Test_body'
    """
    value = value.replace("public.", "").strip('_').lower()
    return value


@register.filter
def to_tablename(value):
    if value.startswith('public.'):
        return value.replace("public.", "")
    return value


@register.filter
def to_fieldname(value):
    """
    >>> to_fieldname('for')
    'for_field'
    >>> to_fieldname('_ContentType_Test_body')
    'ContentType_Test_body'
    """
    value = value.strip('_')
    if keyword.iskeyword(value):
        return value + '_field'
    return value


@register.filter
def to_fieldtype(value, fieldname=None, disable_choices=DISABLE_MODEL_CHOICES):
    """
    >>> to_fieldtype([['increments'], ['notNullable']])
    'models.AutoField(primary_key=True)'
    >>> to_fieldtype([["uuid"], ["primary"], ["notNullable"]])
    'models.UUIDField(primary_key=True)'
    >>> to_fieldtype([['text']])
    'models.TextField(null=True, blank=True)'
    >>> to_fieldtype([["integer"],["unsigned"],["index"],["foreign"],["references","id"],["inTable","public.Condo"]])
    'models.ForeignKey(null=True, blank=True, on_delete=models.DO_NOTHING, related_name="+", to="Condo")'
    >>> to_fieldtype([ [ "text" ], [ "unique" ] ])
    'models.TextField(unique=True, null=True, blank=True)'
    >>> to_fieldtype([ [ "text" ], [ "unique" ],  ['notNullable'] ])
    'models.TextField(unique=True)'
    >>> to_fieldtype([["float", 8, 2]])
    'models.DecimalField(null=True, blank=True, max_digits=8, decimal_places=2)'
    >>> to_fieldtype([["decimal", 8, 2]])
    'models.DecimalField(null=True, blank=True, max_digits=8, decimal_places=2)'
    >>> to_fieldtype([["enum", ["pending", "processed"]], ["notNullable"]], disable_choices=False)
    "models.CharField(max_length=50, choices=[('pending', 'pending'), ('processed', 'processed')])"
    >>> to_fieldtype([["enum", [1, 19]], ["notNullable"]], disable_choices=False)
    "models.IntegerField(choices=[(1, '1'), (19, '19')])"
    """
    q = json.dumps
    processors = {
        "notNullable": lambda x: x.update({'null': False, 'blank': False}),
        "uuid": lambda x: x.update({'field_class': 'models.UUIDField'}),
        "text": lambda x: x.update({'field_class': 'models.TextField'}),
        "float": lambda x, p1, p2: x.update(
            {'field_class': 'models.DecimalField', 'max_digits': p1, 'decimal_places': p2}),
        "decimal": lambda x, p1, p2: x.update(
            {'field_class': 'models.DecimalField', 'max_digits': p1, 'decimal_places': p2}),
        "unique": lambda x: x.update({'unique': True}),
        "boolean": lambda x: x.update({'field_class': 'models.BooleanField'}),
        "string": lambda x, max_length: x.update({'field_class': 'models.CharField', 'max_length': max_length}),
        "json": lambda x: x.update({'field_class': 'JSONField'}),
        "date": lambda x: x.update({'field_class': 'models.DateField'}),
        "timestamp": lambda x, tz, precision: x.update({'field_class': 'models.DateTimeField'}),
        "integer": lambda x: x.update({'field_class': 'models.IntegerField'}),
        "unsigned": lambda x: x.update({'field_class': 'models.PositiveIntegerField'}),
        "index": lambda x: x.update({'db_index': True}),
        "foreign": lambda x: x.update(
            {'field_class': 'models.ForeignKey', 'on_delete': 'models.DO_NOTHING', 'related_name': q('+')}),
        "references": lambda x, to_field: x.update({'field_class': 'models.ForeignKey', 'to_field': q(to_field)}),
        "inTable": lambda x, to_table: x.update({'field_class': 'models.ForeignKey', 'to': q(to_classname(to_table))}),
        "onDelete": lambda x, on_delete: x.update(
            {'field_class': 'models.ForeignKey', 'on_delete': 'models.' + on_delete}),
        "enum": lambda x, choices: x.update(
            {'field_class': 'models.IntegerField', 'choices': None if disable_choices else [(i, str(i)) for i in choices]}) if type(
            choices[0]) == int else x.update(
            {'field_class': 'models.CharField', 'max_length': 50, 'choices': None if disable_choices else [(i, i) for i in choices]}),
        "defaultTo": lambda x, v: x.update({'default': v}),
        "kmigrator": lambda x, options: x.update(options),
    }

    if ['increments'] in value:
        return 'models.AutoField(primary_key=True)'
    if ["uuid"] in value and ["primary"] in value:
        return 'models.UUIDField(primary_key=True)'
    ctx = dict(field_class='JSONField',
               db_index=False, unique=False,
               null=True, blank=True)
    if fieldname:
        ctx.update({'db_column': q(fieldname)})
    for v in value:
        if v[0] not in processors:
            raise RuntimeError('no processor: {0}(ctx, *{1!r})'.format(v[0], v[1:]))
        processors[v[0]](ctx, *v[1:])
    field_class = ctx.pop('field_class')
    if not ctx['db_index'] and field_class != 'models.ForeignKey':
        ctx.pop('db_index')
    elif ctx['db_index'] and field_class == 'models.ForeignKey':
        ctx.pop('db_index')
    if not ctx['unique']:
        ctx.pop('unique')
    if not ctx['null'] and not ctx['blank']:
        ctx.pop('null')
        ctx.pop('blank')
    if ctx.get('to_field') == '"id"':
        ctx.pop('to_field')
    if ctx.get('db_column') and fieldname == to_fieldname(fieldname) and field_class != 'models.ForeignKey':
        ctx.pop('db_column')
    ctx_line = ', '.join(['{}={}'.format(k, v) for k, v in ctx.items()])
    return '{}({})'.format(field_class, ctx_line)


@register.filter
def to_meta(value):
    meta = value.get('__meta')
    if not meta:
        return ''

    ctx = {}
    processors = {
        "kmigrator": lambda x, options: x.update(options),
    }

    for v in meta:
        if v[0] not in processors:
            raise RuntimeError('no meta processor: {0}(ctx, *{1!r})'.format(v[0], v[1:]))
        processors[v[0]](ctx, *v[1:])

    code = []
    constraints = ctx.get('constraints')
    if constraints:
        code.append('\\n        constraints = [')
        for constraint in constraints:
            type_ = constraint['type']
            if type_ == 'models.CheckConstraint':
                code.append('            models.CheckConstraint(check=' + constraint['check'] + ', name="' + constraint['name'] + '"),')
            elif type_ == 'models.UniqueConstraint':
                code.append('            models.UniqueConstraint(fields=' + repr(constraint['fields']) + ', condition=' + (constraint.get('condition') or 'None') + ', name="' + constraint['name'] + '"),')
            else:
                raise Error('unknown constraint type! type=' + type_)
        code.append('        ]')
    indexes = ctx.get('indexes')
    if indexes:
        code.append('\\n        indexes = [')
        for index in indexes:
            code.append('            ' + index_to_code(index))
        code.append('        ]')
    return '\\n'.join(code)


def index_to_code(index, options=['fields', 'opclasses', 'name']):
    if 'type' not in index:
        raise Error('no type!')
    code = []
    if 'expressions' in index:
        code.append('*' + repr(index['expressions']))
    for option in options:
        if option in index:
            code.append('{}={}'.format(option, repr(index[option])))
    return '{}({}),'.format(index['type'], ', '.join(code))


def printutf8(text):
    sys.stdout.buffer.write(text.encode('utf-8'))


def main():
    engine = Engine(libraries={NAME: NAME}, builtins=[NAME])
    template = Template(MODELS_TPL, engine=engine)
    # data = sorted(json.loads(DATA).items(), key=lambda x: 0 if '_' in x[0] else 1)
    context = Context({"schema": json.loads(DATA)})
    models = template.render(context)
    printutf8(models)

if __name__ == '__main__':
    main()
'''
GET_KEYSTONE_SCHEMA_SCRIPT = """
const entryFile = '__KEYSTONE_ENTRY_PATH__'
const knexSchemaFile = '__KNEX_SCHEMA_PATH__'
const knexConnectionFile = '__KNEX_CONNECTION_PATH__'
const knexMigrationsDir = '__KNEX_MIGRATION_DIR__'
const path = require('path')
const fs = require('fs')
const util = require('util')
const { keystone } = require(path.resolve(entryFile))

const tableCache = {}
let hasKnexConnection = false

function createFakeTable (tableName) {
    if (tableCache[tableName]) return tableCache[tableName]

    const schema = new Proxy({}, {
        get: function (target, prop, receiver) {
            if (!target.hasOwnProperty(prop)) target[prop] = []
            return target[prop]
        },
    })

    function chinable(name, args) {
        if (!Array.isArray(args)) throw new Error('array required!')
        schema[name].push(args)
        const p = new Proxy({}, {
            get: function (target, prop) {
                return (...args) => {
                    try {
                        JSON.stringify(args)
                    } catch (e) {
                        // knex.raw may not to be serializable
                        console.warn('IS_NOT_SERIALIZABLE:', tableName, name, args, e)
                        return p
                    }
                    schema[name].push([prop].concat(args))
                    return p
                }
            },
        })
        return p
    }

    const table = {
        toJSON: () => { return {...schema} },
        dropColumn: (name) => {throw new Error('dropColumn() not supported')},
        dropColumns: (...columns) => {throw new Error('dropColumns() not supported')},
        renameColumn: (from, to) => {throw new Error('renameColumn() not supported')},
        increments: (name) => chinable(name, ['increments']),
        integer: (name) => chinable(name, ['integer']),
        bigInteger: (name) => chinable(name, ['bigInteger']),
        text: (name) => chinable(name, ['text']),
        string: (name, length = 255) => chinable(name, ['string', length]),
        binary: (name, length = 255) => chinable(name, ['binary', length]),
        float: (name, precision = 8, scale = 2) => chinable(name, ['float', precision, scale]),
        decimal: (name, precision = 8, scale = 2) => chinable(name, ['decimal', precision, scale]),
        boolean: (name) => chinable(name, ['boolean']),
        date: (name) => chinable(name, ['date']),
        datetime: (name) => chinable(name, ['datetime']),
        time: (name) => chinable(name, ['time']),
        timestamp: (name, {useTz, precision} = {}) => {
            return chinable(name, ['timestamp', Boolean(useTz), precision])
        },
        // timestamp: (name, {useTz, precision} = {}) => {throw new Error('timestamp() not supported')},
        timestamps: () => {throw new Error('timestamps() not supported')},
        dropTimestamps: () => {throw new Error('dropTimestamps() not supported')},
        enu: (name, values) => chinable(name, ['enum', values]),
        enum: (name, values) => chinable(name, ['enum', values]),
        json: (name) => chinable(name, ['json']),
        jsonb: (name) => chinable(name, ['json']),
        uuid: (name) => chinable(name, ['uuid']),
        comment: (value) => {throw new Error('comment() not supported')},
        engine: (value) => {throw new Error('engine() not supported')},
        charset: (value) => {throw new Error('charset() not supported')},
        collate: (value) => {throw new Error('collate() not supported')},
        inherits: (value) => {throw new Error('inherits() not supported')},
        specificType: (name, type) => {throw new Error('specificType() not supported')},
        index: (columns, indexName, indexType) => {throw new Error('index() not supported')},
        dropIndex: (columns, indexName) => {throw new Error('dropIndex() not supported')},
        unique: (columns, indexName) => {throw new Error('unique() not supported')},
        foreign: (columns, foreignKeyName) => {
            if (foreignKeyName) throw new Error('foreign(foreignKeyName) not supported')
            if (Array.isArray(columns)) throw new Error('foreign([columns]) not supported')
            return chinable(columns, ['foreign'])
        },
        dropForeign: (columns, foreignKeyName) => {throw new Error('dropForeign() not supported')},
        dropUnique: (columns, indexName) => {throw new Error('dropUnique() not supported')},
        dropPrimary: (constraintName) => {throw new Error('dropPrimary() not supported')},
        queryContext: (context) => {throw new Error('queryContext() not supported')},
        kmigrator: (name, options) => chinable(name, ['kmigrator', options]),
    }
    tableCache[tableName] = table
    return table
}

(async () => {
    keystone.eventHandlers = {}
    await keystone.connect()
    const rootAdapter = keystone.adapter

    let knexAdapters = []

    if (rootAdapter.__kmigratorKnexAdapters) {
        knexAdapters = rootAdapter.__kmigratorKnexAdapters()
    } else if (rootAdapter._createTables && rootAdapter.knex) {
        knexAdapters = [rootAdapter]
    } else {
        console.error('\\nERROR: No KNEX adapter! Check the DATABASE_URL or keystone database adapter')
        process.exit(4)
    }

    for (let adapter of knexAdapters) {
        const schemaName = adapter.schemaName
        const s = adapter.schema()
        const s_createTable = s.createTable
        const s_table = s.table
        const s_dropTableIfExists = s.dropTableIfExists
        const s_dropTable = s.dropTable
        s.table = s.createTable = function createTable (tableName, callback) {
            const ft = createFakeTable(`${schemaName}.${tableName}`)
            callback(ft)
            console.log('CALL', 'createTable', tableName)
            if (!rootAdapter.getListAdapterByKey(tableName)) {
                console.warn(`NO keystone.adapter.getListAdapterByKey('${tableName}')`)
            } else {
                if (!keystone.lists[tableName]) {
                    console.warn(`NO keystone.lists['${tableName}']`)
                    console.dir(Object.keys(keystone.lists))
                } else {
                    const createListConfig = keystone.lists[tableName].createListConfig
                    if (createListConfig && createListConfig.kmigratorOptions) {
                        const kmigratorOptions = createListConfig.kmigratorOptions
                        if (kmigratorOptions.constraints) {
                            if (!Array.isArray(kmigratorOptions.constraints)) {
                                throw new Error('kmigratorOptions.constraints is not an Array!')
                            }
                            ft.kmigrator('__meta', { constraints: kmigratorOptions.constraints })
                        }
                        if (kmigratorOptions.indexes) {
                            if (!Array.isArray(kmigratorOptions.indexes)) {
                                throw new Error('kmigratorOptions.indexes is not an Array!')
                            }
                            ft.kmigrator('__meta', { indexes: kmigratorOptions.indexes })
                        }
                    }
                }
                for (const fad of rootAdapter.getListAdapterByKey(tableName).fieldAdapters) {
                    if (fad.config.kmigratorOptions) {
                        // TODO(pahaz): add field kmigratorOptions validation
                        ft.kmigrator(fad.path, fad.config.kmigratorOptions)
                    }
                }
            }
        }
        s.dropTable = s.dropTableIfExists = function dropTable (tableName) {
            console.log('CALL', 'dropTable', tableName)
        }
        adapter.schema = () => s
        const createResult = (await adapter._createTables())
        createResult.forEach((r) => {
            if (r.isRejected) throw r.reason
        })

        const migrationsConfig = {directory: knexMigrationsDir}
        try {
            console.log('migrate.list', await adapter.knex.migrate.list(migrationsConfig))
        } catch (e) {
            if (e.message.includes('no such file')) {
                // await adapter.knex.migrate.make('init', migrationsConfig)
                console.log('no migrations dir')
            } else {
                console.error(e)
                process.exit(1)
            }
        }

        const clientCfg   = s.client.config
        const cfg = JSON.stringify({
            ...clientCfg,
            connection: { ...clientCfg.connection, password: clientCfg.connection.password }
        })
        console.log('write last knex client config', cfg)
        fs.writeFileSync(knexConnectionFile, cfg)
        hasKnexConnection = true
    }

    if (!hasKnexConnection) {
        console.error('\\nERROR: No KNEX adapter connection settings! Check the DATABASE_URL')
        process.exit(3)
    }
    try {
        fs.writeFileSync(knexSchemaFile, JSON.stringify(tableCache))
    } catch (e) {
        console.error(e)
        process.exit(7)
    }
    process.exit(0)
})()

process.on('unhandledRejection', error => {
    console.error('unhandledRejection', error)
    process.exit(5)
})
"""
GET_KEYSTONE_VIEWS_SCRIPT = """
const fs = require('fs')
const path = require('path')

const entryFile = '__KEYSTONE_ENTRY_PATH__'
const knexViewsFile = '__KNEX_VIEWS_PATH__'



const { keystone } = require(path.resolve(entryFile));

(async () => {
    const config = {
        dv: 1,
        lists: {},
    }

    for (const [listKey, list] of Object.entries(keystone.lists)) {
        if (list?.createListConfig?.analytical) {
            // Exclude virtual fields
            const fields = Object.keys(list.fieldsByPath)
                .filter(field => list.createListConfig.fields[field]?.type?.type !== 'Virtual')
                // Important to check diffs in python
                .toSorted()
            const sensitiveFields = fields.filter(field => list.createListConfig.fields[field]?.sensitive)

            config.lists[listKey] = {
                fields,
                sensitiveFields,
            }
        }
    }

    try {
        fs.writeFileSync(knexViewsFile, JSON.stringify(config))
    } catch (e) {
        console.error(e)
        process.exit(7)
    }
    process.exit(0)
})()

process.on('unhandledRejection', error => {
    console.error('unhandledRejection', error)
    process.exit(5)
})
"""
RUN_KEYSTONE_KNEX_SCRIPT = """
const entryFile = '__KEYSTONE_ENTRY_PATH__'
const knexMigrationsDir = '__KNEX_MIGRATION_DIR__'
const knexMigrationsCode = '__KNEX_MIGRATION_CODE__'

const path = require('path')
const util = require('util')
const {keystone} = require(path.resolve(entryFile))

async function runInContext(knex, config) {
    if (knexMigrationsCode.startsWith('__')) throw new Error('internal config error: no code')
    const res = await eval("(async () => {" + knexMigrationsCode + "})()")
    console.log('')
    console.log('RUN', JSON.stringify(knexMigrationsCode))
    console.log(' ->', res)
}

(async () => {
    keystone.eventHandlers = {}
    await keystone.connect()
    const rootAdapter = keystone.adapter

    let knexAdapters = []

    if (rootAdapter.__kmigratorKnexAdapters) {
        knexAdapters = rootAdapter.__kmigratorKnexAdapters()
    } else if (rootAdapter._createTables && rootAdapter.knex) {
        knexAdapters = [rootAdapter]
    } else {
        console.error('\\nERROR: No KNEX adapter! Check the DATABASE_URL or keystone database adapter')
        process.exit(4)
    }

    for (let adapter of knexAdapters) {
        const migrationsConfig = {directory: knexMigrationsDir}
        try {
            await runInContext(adapter.knex, migrationsConfig)
        } catch (e) {
            console.error(e)
            process.exit(1)
        }
    }

    process.exit(0)
})()
"""
DJANGO_SETTINGS_SCRIPT = """
# -*- coding: utf-8 -*-

import json
data = json.loads('__KNEX_CONNECTION_DATA__')
SECRET_KEY = 'qn2228$&awf126b^auv%awfa*ieh)hh&^e6o!^q(zhz!l$m4'
DEBUG = True
MIDDLEWARE = []
INSTALLED_APPS = [
    '_django_schema',
]
# ROOT_URLCONF = '_django_schema.urls'
# https://docs.djangoproject.com/en/3.0/ref/settings/#databases
DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': data['connection']['database'],
        'USER': data['connection']['user'],
        'PASSWORD': data['connection']['password'],
        'HOST': data['connection']['host'],
        'PORT': data['connection']['port'] or '',
    }
}
# https://docs.djangoproject.com/en/3.0/topics/i18n/
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True
"""
DJANGO_MANAGE_SCRIPT = '''
# -*- coding: utf-8 -*-

import os
import sys
def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', '_django_schema.settings')
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)
if __name__ == '__main__':
    main()
'''
KNEX_MIGRATION_TPL = """// auto generated by kmigrator
// KMIGRATOR:{name}:{code}
// KMIGRATOR_VIEWS:{name}:{views_state}

exports.up = async (knex) => {{
    await knex.raw(`
    {fwd_sql}
    `)
}}

exports.down = async (knex) => {{
    await knex.raw(`
    {bwd_sql}
    `)
}}
"""
KNEX_MIGRATION_TPL_NO_DOWN = """// auto generated by kmigrator
// KMIGRATOR:{name}:{code}
// KMIGRATOR_VIEWS:{name}:{views_state}

exports.up = async (knex) => {{
    await knex.raw(`
    {fwd_sql}
    `)
}}

exports.down = async (knex) => {{
    throw new Error('no auto backward migration')
}}
"""


class KProblem(Exception):
    pass


def _inject_ctx(data, ctx):
    for k, v in ctx.items():
        data = data.replace(str(k), json.dumps(str(v))[1:-1].replace('\'', '\\\''))
    return data


def _1_1_prepare_cache_dir(ctx):
    CACHE_DIR.mkdir(exist_ok=True)
    KNEX_MIGRATIONS_DIR.mkdir(exist_ok=True)


def _1_2_prepare_get_knex_schema_script(ctx):
    GET_KNEX_SETTINGS_SCRIPT.write_text(_inject_ctx(GET_KEYSTONE_SCHEMA_SCRIPT, ctx), encoding='utf-8')

def _1_3_prepare_get_keystone_views_script(ctx):
    GET_KNEX_VIEWS_SCRIPT.write_text(_inject_ctx(GET_KEYSTONE_VIEWS_SCRIPT, ctx), encoding='utf-8')


def _2_1_generate_knex_jsons(ctx):
    try:
        log = subprocess.check_output(['node', str(GET_KNEX_SETTINGS_SCRIPT)], stderr=subprocess.STDOUT)
        GET_KNEX_SETTINGS_LOG.write_bytes(log)
    except subprocess.CalledProcessError as e:
        log = e.output
        print('ERROR: logfile =', GET_KNEX_SETTINGS_LOG.resolve())
        print(log.decode('utf-8'))
        raise KProblem('ERROR: can\'t get knex schema')
    ctx['__KNEX_SCHEMA_DATA__'] = Path(ctx['__KNEX_SCHEMA_PATH__']).read_text(encoding='utf-8')
    ctx['__KNEX_CONNECTION_DATA__'] = Path(ctx['__KNEX_CONNECTION_PATH__']).read_text(encoding='utf-8')

    try:
        log = subprocess.check_output(['node', str(GET_KNEX_VIEWS_SCRIPT)], stderr=subprocess.STDOUT)
        GET_KNEX_VIEWS_LOG.write_bytes(log)
    except subprocess.CalledProcessError as e:
        log = e.output
        print('ERROR: logfile =', GET_KNEX_VIEWS_LOG.resolve())
        print(log.decode('utf-8'))
        raise KProblem('ERROR: can\'t get knex schema')

    ctx['__KNEX_VIEWS_DATA__'] = Path(ctx['__KNEX_VIEWS_PATH__']).read_text(encoding='utf-8')


def _3_1_prepare_django_dir(ctx):
    DJANGO_DIR.mkdir(exist_ok=True)
    migrations_dir = (DJANGO_DIR / 'migrations')
    if migrations_dir.exists():
        shutil.rmtree(migrations_dir, ignore_errors=True)
    migrations_dir.mkdir(exist_ok=True)
    (migrations_dir / '__init__.py').write_text('', encoding='utf-8')
    (DJANGO_DIR / '__init__.py').write_text('', encoding='utf-8')
    (DJANGO_DIR / 'settings.py').write_text(_inject_ctx(DJANGO_SETTINGS_SCRIPT, ctx), encoding='utf-8')
    (DJANGO_DIR / '..' / 'manage.py').write_text(DJANGO_MANAGE_SCRIPT, encoding='utf-8')
    (DJANGO_DIR / '..' / '_django_model_generator.py').write_text(_inject_ctx(DJANGO_MODEL_GENERATOR_SCRIPT, ctx), encoding='utf-8')


def _3_2_generate_django_models(ctx):
    models = subprocess.check_output([sys.executable, str(DJANGO_DIR / '..' / '_django_model_generator.py')], timeout=30)
    (DJANGO_DIR / 'models.py').write_bytes(models)


def _3_3_restore_django_migrations(ctx):
    repaired = set()
    for item in KNEX_MIGRATIONS_DIR.iterdir():
        if not item.is_file():
            continue
        d = item.read_text(encoding='utf-8')
        for name, code in (re.findall(r'^// KMIGRATOR:(.*?):([A-Za-z0-9+/=]*?)$', d, re.MULTILINE)):
            (DJANGO_DIR / 'migrations' / '{}.py'.format(name)).write_bytes(base64.b64decode(code.encode('ascii')))
            repaired.add(name)
    ctx['__KNEX_DJANGO_MIGRATION__'] = repaired

def _3_4_restore_views_state(ctx):
    state = '{"lists":{}, "dv":1}'
    latest_migration = 0

    for item in KNEX_MIGRATIONS_DIR.iterdir():
        if not item.is_file():
            continue
        d = item.read_text(encoding='utf-8')
        for name, code in (re.findall(r'^// KMIGRATOR_VIEWS:(.*?):([A-Za-z0-9+/=]*?)$', d, re.MULTILINE)):
            migration_number = name.split('_')[0]
            if int(migration_number) > latest_migration:
                latest_migration = int(migration_number)
                state = base64.b64decode(code.encode('ascii')).decode('utf-8')

    ctx['__KNEX_VIEWS_MIGRATION_STATE__'] = state

def _hotfix_django_migration_bug(item):
    if item.name.startswith('__'):
        return
    flags = re.MULTILINE | re.DOTALL
    source = code = item.read_text(encoding='utf-8')
    deleting_models = re.findall(r'\s*migrations\.DeleteModel\(.*?name=[\'"](.*?)[\'"].*?\),', code, flags)
    def _repl(x):
        return x.group(0).replace('\n', '\n#')
    for m in deleting_models:
        (code, _) = re.subn(r'\s*migrations\.RemoveField\([^)]*?model_name=[\'"](' + m + r')[\'"][^)]*?\),', _repl, code, flags=flags)
    # change DeleteModel order (reversed!)
    # TODO(pahaz): probably it's not solve the delete order?
    # if you see the error like: The field XXX was declared with a lazy reference to 'YYY', but app '_django_schema' doesn't provide model 'ZZZ'.
    # you need to fix it here!!
    delete_sections = []
    def _repl1(x):
        delete_sections.append(x.group(0))
        return ''
    (code_0, _) = re.subn(r'\s*migrations\.DeleteModel\([^)]*?name=[\'"](.*?)[\'"][^)]*?\),', _repl1, code,
                          flags=flags)
    op_ind = code_0.rfind(']')
    code = code_0[:op_ind].rstrip() + ''.join(reversed(delete_sections)) + '\n    ]\n'
    if source != code:
        item.write_text(code, encoding='utf-8')

def _generate_views_migration(ctx, fwd=True):
    old_state = json.loads(ctx['__KNEX_VIEWS_MIGRATION_STATE__'])
    new_state = json.loads(ctx['__KNEX_VIEWS_DATA__'])
    if old_state == new_state:
        return None
    if not fwd:
        old_state, new_state = new_state, old_state

    migration = ''

    def add_line(line):
        nonlocal migration
        migration += line + '\n'

    def add_comment(comment):
        add_line('--')
        add_line('-- ' + comment)
        add_line('--')

    def generate_view_sql(lst_key, lst):
        fields = []
        for field in lst['fields']:
            if field in lst['sensitiveFields']:
                fields.append(f'NULL as "{field}"')
            else:
                fields.append(f'"{field}"')
        return f'CREATE OR REPLACE VIEW "analytics"."{lst_key}" AS SELECT {", ".join(fields)} FROM "public"."{lst_key}";'

    # Step 1. create schema if necessary
    if len(new_state['lists'].keys()) > 0 and len(old_state['lists'].keys()) == 0:
        add_comment('Create analytics schema')
        add_line('CREATE SCHEMA IF NOT EXISTS "analytics";')

    # Step 2. create / recreate views if necessary (view created or changed)
    for list_key, list_cfg in new_state['lists'].items():
        if list_key not in old_state['lists'] or old_state['lists'][list_key] != list_cfg:
            add_comment(f'Create view for "{list_key}" table')
            add_line(generate_view_sql(list_key, list_cfg))

    # Step 3. Remove views if necessary (view deleted)
    for list_key in old_state['lists'].keys():
        if list_key not in new_state['lists']:
            add_comment(f'Remove view for "{list_key}" table')
            add_line(f'DROP VIEW IF EXISTS "analytics"."{list_key}";')

    # Step 4. Drop schema if necessary
    if len(new_state['lists'].keys()) == 0 and len(old_state['lists'].keys()) > 0:
        add_comment('Drop analytics schema')
        add_line('DROP SCHEMA IF EXISTS "analytics";')

    return migration



def _4_1_makemigrations(ctx, merge=False, check=False, empty=False):
    # Step 1. Execute django migration
    log_file = DJANGO_DIR / '..' / 'makemigrations.{}.log'.format(time())
    exists = ctx['__KNEX_DJANGO_MIGRATION__']
    n = datetime.now()
    base_command = [sys.executable, str(DJANGO_DIR / '..' / 'manage.py'), 'makemigrations', '_django_schema']
    command = base_command.copy()
    if merge:
        command += ['--merge']
    elif check:
        command += ['--check', '--dry-run', '--noinput']
    elif empty:
        command += ['--empty']
    # call script generated command without end user input (development only)
    # nosemgrep: python.lang.security.audit.dangerous-system-call.dangerous-system-call
    r = os.system(' '.join(command))
    if r != 0:
        raise KProblem('ERROR: can\'t create migration')

    # Generate views migration, if not None, we should append it to the django migration or generate empty migration
    fwd_views_sql = _generate_views_migration(ctx)
    bwd_views_sql = _generate_views_migration(ctx, fwd=False)

    new_django_migrations = []
    for item in (DJANGO_DIR / 'migrations').iterdir():
        name = item.name.replace('.py', '')
        if not item.is_file() or name.startswith('__') or name in exists:
            continue
        new_django_migrations.append(name)

    # If no model changes, but view changed -> create empty migration
    if len(new_django_migrations) == 0 and (fwd_views_sql or bwd_views_sql):
        r = os.system(' '.join(base_command + ['--empty']))
        if r != 0:
            raise KProblem('ERROR: can\'t create empty migration')

    views_state = base64.b64encode(ctx['__KNEX_VIEWS_DATA__'].encode('utf-8')).decode('ascii')
    views_inserted = bool(fwd_views_sql is None and bwd_views_sql is None)

    # Step 2. Process migrations
    for item in (DJANGO_DIR / 'migrations').iterdir():
        _hotfix_django_migration_bug(item)
        name = item.name.replace('.py', '')
        filename = '{}-{}.js'.format(n.strftime("%Y%m%d%H%M%S"), name)
        if not item.is_file() or name.startswith('__') or name in exists:
            continue
        code = base64.b64encode(item.read_bytes()).decode('utf-8')
        cmd = [sys.executable, str(DJANGO_DIR / '..' / 'manage.py'), 'sqlmigrate', '_django_schema', name]
        fwd_sql = subprocess.check_output(cmd).decode('utf-8')
        if not views_inserted and fwd_views_sql:
            fwd_sql += '\n' + fwd_views_sql
            if not bwd_views_sql:
                views_inserted = True
        try:
            bwd_sql = subprocess.check_output(cmd + ['--backwards'], stderr=subprocess.PIPE).decode('utf-8')
            if not views_inserted:
                bwd_sql += '\n' + bwd_views_sql
                views_inserted = True
            text = KNEX_MIGRATION_TPL.format(**locals())
        except subprocess.CalledProcessError as e:
            print('\nWARN: !! NO BACKWARD MIGRATION !!')
            print('WARN: filename={}'.format(filename))
            print('WARN: logfile={}\n'.format(log_file.resolve()))
            log_file.write_bytes(e.stderr)
            template = KNEX_MIGRATION_TPL_NO_DOWN
            if not views_inserted and bwd_views_sql:
                bwd_sql = bwd_views_sql
                template = KNEX_MIGRATION_TPL
                views_inserted = True
            text = template.format(**locals())

        (KNEX_MIGRATIONS_DIR / filename).write_text(text, encoding='utf-8')
        print(" -> ", filename)


def _5_1_run_knex_command(ctx, cmd='latest'):
    ctx['__KNEX_MIGRATION_CODE__'] = 'return await knex.migrate.{}(config)'.format(cmd)
    KNEX_MIGRATE_SCRIPT.write_text(_inject_ctx(RUN_KEYSTONE_KNEX_SCRIPT, ctx), encoding='utf-8')
    log_file = DJANGO_DIR / '..' / 'knex.run.{}.{}.log'.format(time(), cmd)
    try:
        log = subprocess.check_output(['node', str(KNEX_MIGRATE_SCRIPT)], stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as e:
        log = e.output
        print('ERROR: logfile =', log_file.resolve())
        raise KProblem('ERROR: can\'t run knex command knex.migrate.{}'.format(cmd))
    finally:
        log_file.write_bytes(log)
        print(log.decode('utf-8'))


def main(command, keystoneEntryFile='./index.js', merge=False, check=False, empty=False):
    ctx = {
        '__KEYSTONE_ENTRY_PATH__': keystoneEntryFile,
        '__KNEX_SCHEMA_PATH__': CACHE_DIR / 'knex.schema.json',
        '__KNEX_VIEWS_PATH__': CACHE_DIR / 'knex.views.json',
        '__KNEX_CONNECTION_PATH__': CACHE_DIR / 'knex.connection.json',
        '__KNEX_MIGRATION_DIR__': KNEX_MIGRATIONS_DIR,
        '__DISABLE_MODEL_CHOICES__': DISABLE_MODEL_CHOICES,
    }
    try:
        _1_1_prepare_cache_dir(ctx)
        _1_2_prepare_get_knex_schema_script(ctx)
        _1_3_prepare_get_keystone_views_script(ctx)
        _2_1_generate_knex_jsons(ctx)
        _3_1_prepare_django_dir(ctx)
        _3_2_generate_django_models(ctx)
        _3_3_restore_django_migrations(ctx)
        _3_4_restore_views_state(ctx)
        if command == 'makemigrations':
            _4_1_makemigrations(ctx, merge=merge, check=check, empty=empty)
        elif command == 'migrate':
            _5_1_run_knex_command(ctx)
        elif command == 'up':
            _5_1_run_knex_command(ctx, cmd='up')
        elif command == 'down':
            _5_1_run_knex_command(ctx, cmd='down')
        elif command == 'currentVersion':
            _5_1_run_knex_command(ctx, cmd='currentVersion')
        elif command == 'list':
            _5_1_run_knex_command(ctx, cmd='list')
        elif command == 'unlock':
            _5_1_run_knex_command(ctx, cmd='forceFreeMigrationsLock')
    except KProblem as e:
        print(e, file=sys.stderr)
        return 1


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('use: kmigrator.py (makemigrations ([--merge] | [--check] | [--empty]) | migrate) [keystoneEntryFile]')
        sys.exit(1)
    args = [x for x in sys.argv[1:] if not x.startswith('--')]
    flags = {k[2:]: True for k in sys.argv[1:] if k.startswith('--')}
    sys.exit(main(*args, **flags) or 0)
