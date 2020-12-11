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
from datetime import datetime
from pathlib import Path
from time import time

VERSION = (1, 1, 5)
CACHE_DIR = Path('.kmigrator')
KNEX_MIGRATIONS_DIR = Path('migrations')
GET_KNEX_SETTINGS_SCRIPT = CACHE_DIR / 'get.knex.settings.js'
KNEX_MIGRATE_SCRIPT = CACHE_DIR / 'knex.run.js'
GET_KNEX_SETTINGS_LOG = CACHE_DIR / 'get.knex.settings.log'
DJANGO_DIR = CACHE_DIR / '_django_schema'
DJANGO_MODEL_GENERATOR_SCRIPT = '''
import json
from django.template import Library, Template, Engine, Context
import keyword
import sys

DATA = '__KNEX_SCHEMA_DATA__'
NAME = '_django_model_generator'
MODELS_TPL = """
from django.db import models
from django.contrib.postgres.fields import JSONField

{% for tablename, fields in schema.items %}
class {{ tablename|to_classname }}(models.Model):
    {% for fieldname, field in fields.items %}
    {{ fieldname|to_fieldname }} = {{ field|to_fieldtype:fieldname|safe }}{% endfor %}

    class Meta:
        db_table = '{{ tablename|to_tablename }}'

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
def to_fieldtype(value, fieldname=None):
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
    >>> to_fieldtype([["enum", ["pending", "processed"]], ["notNullable"]])
    "models.CharField(max_length=50, choices=[('pending', 'pending'), ('processed', 'processed')])"
    >>> to_fieldtype([["enum", [1, 19]], ["notNullable"]])
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
            {'field_class': 'models.IntegerField', 'choices': [(i, str(i)) for i in choices]}) if type(
            choices[0]) == int else x.update(
            {'field_class': 'models.CharField', 'max_length': 50, 'choices': [(i, i) for i in choices]}),
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


def main():
    engine = Engine(libraries={NAME: NAME}, builtins=[NAME])
    template = Template(MODELS_TPL, engine=engine)
    # data = sorted(json.loads(DATA).items(), key=lambda x: 0 if '_' in x[0] else 1)
    context = Context({"schema": json.loads(DATA)})
    models = template.render(context)
    print(models)


if __name__ == '__main__':
    main()
'''
GET_KEYSTONE_SCHEMA_SCRIPT = """
const entryFile = '__KEYSTONE_ENTRY_PATH__'
const knexSchemaFile = '__KNEX_SCHEMA_PATH__'
const knexConnectionFile = '__KNEX_CONNECTION_PATH__'
const knexMigrationsDir = '__KNEX_MIGRATION_DIR__'

const { asyncForEach } = require('@keystonejs/utils')
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
    await asyncForEach(Object.values(keystone.adapters), async adapter => {
        if (!adapter._createTables || !adapter.knex) {
            return
        }
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
            if (!adapter.listAdapters[tableName]) {
                console.warn(`NO adapter.listAdapters['${tableName}']`)
                console.dir(adapter.listAdapters)
            } else {
                for (const fad of adapter.listAdapters[tableName].fieldAdapters) {
                    if (fad.config.kmigratorOptions) {
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

        console.log('write client config')
        fs.writeFileSync(knexConnectionFile, JSON.stringify(s.client.config))
        hasKnexConnection = true

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
    }).catch((e) => {
        console.error(e)
        process.exit(1)
    })
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
RUN_KEYSTONE_KNEX_SCRIPT = """
const entryFile = '__KEYSTONE_ENTRY_PATH__'
const knexMigrationsDir = '__KNEX_MIGRATION_DIR__'
const knexMigrationsCode = '__KNEX_MIGRATION_CODE__'

const {asyncForEach} = require('@keystonejs/utils')
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
    await asyncForEach(Object.values(keystone.adapters), async adapter => {
        if (!adapter._createTables || !adapter.knex) {
            return
        }
        const migrationsConfig = {directory: knexMigrationsDir}
        try {
            await runInContext(adapter.knex, migrationsConfig)
        } catch (e) {
            console.error(e)
            process.exit(1)
        }
    }).catch((e) => {
        console.error(e)
        process.exit(1)
    })
    process.exit(0)
})()
"""
DJANGO_SETTINGS_SCRIPT = """
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
        data = data.replace(str(k), str(v))
    return data


def _1_1_prepare_cache_dir(ctx):
    CACHE_DIR.mkdir(exist_ok=True)
    KNEX_MIGRATIONS_DIR.mkdir(exist_ok=True)


def _1_2_prepare_get_knex_schema_script(ctx):
    GET_KNEX_SETTINGS_SCRIPT.write_text(_inject_ctx(GET_KEYSTONE_SCHEMA_SCRIPT, ctx))


def _2_1_generate_knex_jsons(ctx):
    try:
        log = subprocess.check_output(['node', str(GET_KNEX_SETTINGS_SCRIPT)], stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as e:
        log = e.output
        print('ERROR: logfile =', GET_KNEX_SETTINGS_LOG.resolve())
        print(log.decode('utf-8'))
        raise KProblem('ERROR: can\'t get knex schema')
    finally:
        GET_KNEX_SETTINGS_LOG.write_bytes(log)
    ctx['__KNEX_SCHEMA_DATA__'] = Path(ctx['__KNEX_SCHEMA_PATH__']).read_text()
    ctx['__KNEX_CONNECTION_DATA__'] = Path(ctx['__KNEX_CONNECTION_PATH__']).read_text()


def _3_1_prepare_django_dir(ctx):
    DJANGO_DIR.mkdir(exist_ok=True)
    migrations_dir = (DJANGO_DIR / 'migrations')
    if migrations_dir.exists():
        shutil.rmtree(migrations_dir, ignore_errors=True)
    migrations_dir.mkdir(exist_ok=True)
    (migrations_dir / '__init__.py').write_text('')
    (DJANGO_DIR / '__init__.py').write_text('')
    (DJANGO_DIR / 'settings.py').write_text(_inject_ctx(DJANGO_SETTINGS_SCRIPT, ctx))
    (DJANGO_DIR / '..' / 'manage.py').write_text(DJANGO_MANAGE_SCRIPT)
    (DJANGO_DIR / '..' / '_django_model_generator.py').write_text(_inject_ctx(DJANGO_MODEL_GENERATOR_SCRIPT, ctx))


def _3_2_generate_django_models(ctx):
    models = subprocess.check_output([sys.executable, str(DJANGO_DIR / '..' / '_django_model_generator.py')], timeout=30)
    (DJANGO_DIR / 'models.py').write_bytes(models)


def _3_3_restore_django_migrations(ctx):
    repaired = set()
    for item in KNEX_MIGRATIONS_DIR.iterdir():
        if not item.is_file():
            continue
        d = item.read_text()
        for name, code in (re.findall(r'^// KMIGRATOR:(.*?):([A-Za-z0-9+/=]*?)$', d, re.MULTILINE)):
            (DJANGO_DIR / 'migrations' / '{}.py'.format(name)).write_bytes(base64.b64decode(code.encode('ascii')))
            repaired.add(name)
    ctx['__KNEX_DJANGO_MIGRATION__'] = repaired


def _hotfix_django_migration_bug(item):
    if item.name.startswith('__'):
        return
    flags = re.MULTILINE | re.DOTALL
    source = code = item.read_text()
    deleting_models = re.findall(r'\s*migrations\.DeleteModel\(.*?name=[\'"](.*?)[\'"].*?\),', code, flags)
    def _repl(x):
        return x.group(0).replace('\n', '\n#')
    for m in deleting_models:
        (code, _) = re.subn(r'\s*migrations\.RemoveField\([^)]*?model_name=[\'"](' + m + ')[\'"][^)]*?\),', _repl, code, flags=flags)
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
        item.write_text(code)


def _4_1_makemigrations(ctx):
    log_file = DJANGO_DIR / '..' / 'makemigrations.{}.log'.format(time())
    exists = ctx['__KNEX_DJANGO_MIGRATION__']
    n = datetime.now()
    r = os.system(' '.join([sys.executable, str(DJANGO_DIR / '..' / 'manage.py'), 'makemigrations', '_django_schema']))
    if r != 0:
        raise KProblem('ERROR: can\'t create migration')
    for item in (DJANGO_DIR / 'migrations').iterdir():
        _hotfix_django_migration_bug(item)
        name = item.name.replace('.py', '')
        filename = '{}-{}.js'.format(n.strftime("%Y%m%d%H%M%S"), name)
        if not item.is_file() or name.startswith('__') or name in exists:
            continue
        code = base64.b64encode(item.read_bytes()).decode('utf-8')
        cmd = [sys.executable, str(DJANGO_DIR / '..' / 'manage.py'), 'sqlmigrate', '_django_schema', name]
        fwd_sql = subprocess.check_output(cmd).decode('utf-8')
        try:
            bwd_sql = subprocess.check_output(cmd + ['--backwards'], stderr=subprocess.PIPE).decode('utf-8')
            text = KNEX_MIGRATION_TPL.format(**locals())
        except subprocess.CalledProcessError as e:
            print('\nWARN: !! NO BACKWARD MIGRATION !!')
            print('WARN: filename={}'.format(filename))
            print('WARN: logfile={}\n'.format(log_file.resolve()))
            log_file.write_bytes(e.stderr)
            text = KNEX_MIGRATION_TPL_NO_DOWN.format(**locals())

        (KNEX_MIGRATIONS_DIR / filename).write_text(text)
        print(" -> ", filename)


def _5_1_run_knex_command(ctx, cmd='latest'):
    ctx['__KNEX_MIGRATION_CODE__'] = 'return await knex.migrate.{}(config)'.format(cmd)
    KNEX_MIGRATE_SCRIPT.write_text(_inject_ctx(RUN_KEYSTONE_KNEX_SCRIPT, ctx))
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


def main(command, keystoneEntryFile='./index.js'):
    ctx = {
        '__KEYSTONE_ENTRY_PATH__': keystoneEntryFile,
        '__KNEX_SCHEMA_PATH__': CACHE_DIR / 'knex.schema.json',
        '__KNEX_CONNECTION_PATH__': CACHE_DIR / 'knex.connection.json',
        '__KNEX_MIGRATION_DIR__': KNEX_MIGRATIONS_DIR,
    }
    try:
        _1_1_prepare_cache_dir(ctx)
        _1_2_prepare_get_knex_schema_script(ctx)
        _2_1_generate_knex_jsons(ctx)
        _3_1_prepare_django_dir(ctx)
        _3_2_generate_django_models(ctx)
        _3_3_restore_django_migrations(ctx)
        if command == 'makemigrations':
            _4_1_makemigrations(ctx)
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
    except KProblem as e:
        print(e, file=sys.stderr)
        return 1


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('use: kmigrator.py (makemigrations | migrate) [keystoneEntryFile]')
        sys.exit(1)
    sys.exit(main(*sys.argv[1:]) or 0)
