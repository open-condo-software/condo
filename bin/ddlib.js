// Убедитесь, что эти пакеты установлены:
// npm install @opentelemetry/api @opentelemetry/resources @opentelemetry/semantic-conventions
const { SpanKind, TraceFlags, SpanStatusCode } = require('@opentelemetry/api')
const { Resource } = require('@opentelemetry/resources')
const { SemanticResourceAttributes, SemanticAttributes } = require('@opentelemetry/semantic-conventions')

// Константы для конвертации времени
const NANO_TO_SEC = 1_000_000_000
const NANO_TO_MILLI = 1_000_000 // Не используется здесь, но для справки

/**
 * Конвертирует время из наносекунд (число или BigInt) в формат HrTime OpenTelemetry.
 * @param {number|BigInt} ns Наносекунды
 * @returns {import('@opentelemetry/api').HrTime}
 */
function nsToHrTime (ns) {
    if (typeof ns !== 'number' && typeof ns !== 'bigint') {
        console.warn(`[nsToHrTime] Invalid input type for nanoseconds: ${typeof ns}, value: ${ns}`)
        return [0, 0] // Возвращаем безопасное значение по умолчанию
    }
    try {
        const bigintNs = BigInt(ns)
        const secs = Number(bigintNs / BigInt(NANO_TO_SEC))
        const nanos = Number(bigintNs % BigInt(NANO_TO_SEC))
        return [secs, nanos]
    } catch (error) {
        console.error(`[nsToHrTime] Error converting nanoseconds: ${ns}`, error)
        return [0, 0] // Возвращаем безопасное значение по умолчанию при ошибке
    }
}

function prepId (ddTraceId) {
    if (!ddTraceId) return
    // Конвертация Identifier в строку (HEX)
    // Предполагаем, что у Identifier есть метод .toString() который возвращает HEX
    // или можно использовать dd-trace-js утилиту, если она доступна
    if (ddTraceId && typeof ddTraceId.toString === 'function' && ddTraceId._isUint64BE) { // Проверка, что это наш Identifier
        ddTraceId = ddTraceId.toString(16) // или просто .toString() если он уже дает HEX
    } else if (typeof ddTraceId !== 'string') {
        ddTraceId = String(ddTraceId || '') // На всякий случай, если придет что-то совсем иное
    }
    return ddTraceId
}

/**
 * Преобразует Datadog trace_id в 128-битный OpenTelemetry traceId.
 * @param {string} ddTraceId Datadog trace_id (может быть 16 или 32 hex символа)
 * @param {string|undefined} ddHigherTraceId Datadog _dd.p.tid (верхние 64 бита, 16 hex символов)
 * @returns {string} 32-символьный hex OpenTelemetry traceId
 */
function ddToOtelTraceId (ddTraceId, ddHigherTraceId) {
    // ddTraceId = prepId(ddTraceId)
    // ddHigherTraceId = prepId(ddHigherTraceId)
    //
    if (ddTraceId.length === 32) {
        return ddTraceId // Уже 128-битный
    }
    // if (ddHigherTraceId && ddHigherTraceId.length === 16 && ddTraceId.length === 16) {
    //     // _dd.p.tid (ddHigherTraceId) это старшие 64 бита, trace_id (ddTraceId) это младшие
    //     return ddHigherTraceId + ddTraceId
    // }
    // if (ddTraceId.length === 16) {
    //     // Если только 64-битный ID и нет _dd.p.tid, дополняем нулями спереди
    //     return ddTraceId + '0000000000000000'
    // }
    // На всякий случай, если длина какая-то странная, пытаемся дополнить до 32
    return ddTraceId.padEnd(32, '0')
}

function ddToOtelSpanId (ddSpanId) {
    ddSpanId = prepId(ddSpanId)
    if (ddSpanId === '0000000000000000') return
    return ddSpanId
}

/**
 * Маппинг Datadog span.kind/type в OpenTelemetry SpanKind.
 * @param {string|undefined} ddSpanKind Значение из meta['span.kind']
 * @param {string|undefined} ddType Значение из serializedSpan.type
 * @param {string|undefined} ddName Значение из serializedSpan.name (для уточнений)
 * @returns {import('@opentelemetry/api').SpanKind}
 */
function ddToOtelSpanKind (ddSpanKind, ddType, ddName) {
    const kindMap = {
        'client': SpanKind.CLIENT,
        'server': SpanKind.SERVER,
        'producer': SpanKind.PRODUCER,
        'consumer': SpanKind.CONSUMER,
        'internal': SpanKind.INTERNAL,
    }

    if (ddSpanKind && kindMap[ddSpanKind.toLowerCase()]) {
        return kindMap[ddSpanKind.toLowerCase()]
    }

    // Fallback на основе ddType, если ddSpanKind отсутствует или неизвестен
    const typeMap = {
        'web': SpanKind.SERVER,    // e.g., express.request
        'http': SpanKind.CLIENT,   // e.g., http.request (если span.kind не 'client')
        'sql': SpanKind.CLIENT,    // e.g., pg.query
        'db': SpanKind.CLIENT,
        'cache': SpanKind.CLIENT,
        // 'graphql': SpanKind.INTERNAL, // По умолчанию для graphql
    }

    if (ddType) {
        const lowerDdType = ddType.toLowerCase()
        if (lowerDdType === 'graphql') {
            // graphql.execute может быть SERVER, если это точка входа запроса.
            // graphql.resolve обычно INTERNAL.
            if (ddName && ddName.toLowerCase() === 'graphql.execute') {
                // Эвристика: если это graphql.execute и у него нет родителя (или родитель из другого сервиса), то это SERVER
                // Здесь для простоты, если это `graphql.execute` и `span.kind` не указан, считаем `SERVER`
                // В ваших примерах `graphql.execute` является дочерним от `express.middleware`, так что `INTERNAL` будет правильнее.
                // Но если бы он был корневым для запроса GraphQL, то `SERVER`.
                // Давайте пока оставим `INTERNAL` если `span.kind` не `server`.
                return SpanKind.INTERNAL
            }
            return SpanKind.INTERNAL
        }
        if (typeMap[lowerDdType]) {
            return typeMap[lowerDdType]
        }
    }
    return SpanKind.INTERNAL // По умолчанию
}

function processSpan (processor, serializedSpan) {
    // Объединяем meta и metrics в один объект атрибутов
    // Ключи из metrics могут перезаписать ключи из meta, если они совпадают
    const rawAttributes = { ...serializedSpan.meta, ...serializedSpan.metrics }

    // const otelTraceId = ddToOtelTraceId(serializedSpan.trace_id, rawAttributes['_dd.p.tid'])
    const otelTraceId = ddToOtelTraceId(prepId(serializedSpan.trace_id))
    const otelSpanId = prepId(serializedSpan.span_id)
    let otelParentSpanId = prepId(serializedSpan.parent_id)
    if (otelParentSpanId === '0000000000000000') otelParentSpanId = undefined

    const startTime = nsToHrTime(serializedSpan.start)
    const durationNs = BigInt(serializedSpan.duration) // Убедимся, что это BigInt для сложения
    const endTime = nsToHrTime(BigInt(serializedSpan.start) + durationNs)

    const spanKind = ddToOtelSpanKind(rawAttributes['span.kind'], serializedSpan.type, serializedSpan.name)

    const status = {
        code: serializedSpan.error === 0 ? SpanStatusCode.OK : SpanStatusCode.ERROR,
    }
    if (serializedSpan.error !== 0) {
        if (rawAttributes['error.message']) {
            status.message = String(rawAttributes['error.message'])
        } else if (rawAttributes['error.stack']) {
            status.message = String(rawAttributes['error.stack'])
        } else if (typeof serializedSpan.error === 'string' && serializedSpan.error !== '1' && serializedSpan.error !== '0') {
            // Если error - это само сообщение
            status.message = serializedSpan.error
        }
    }

    // Атрибуты для OpenTelemetry Resource
    const resourceAttributes = {
        [SemanticResourceAttributes.SERVICE_NAME]: serializedSpan.service || rawAttributes.service || 'unknown_service',
    }
    if (rawAttributes.version) resourceAttributes[SemanticResourceAttributes.SERVICE_VERSION] = String(rawAttributes.version)
    if (rawAttributes.env) resourceAttributes[SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT] = String(rawAttributes.env)
    if (rawAttributes['runtime-id']) resourceAttributes['runtime.id'] = String(rawAttributes['runtime-id']) // Пример кастомного атрибута ресурса
    if (rawAttributes['language']) resourceAttributes[SemanticResourceAttributes.TELEMETRY_SDK_LANGUAGE] = String(rawAttributes['language'])

    // Атрибуты для самого спана
    const spanAttributes = {}
    for (const key in rawAttributes) {
        // Исключаем уже обработанные или специфичные для DD атрибуты, которые не нужны в OTel в таком виде
        if (key === 'span.kind' || key === 'service' || key === 'version' || key === 'env' || key === 'runtime-id' || key === 'language') {
            continue
        }
        // Преобразуем в семантические атрибуты OTel, где это возможно
        if (key === 'http.method') spanAttributes[SemanticAttributes.HTTP_METHOD] = String(rawAttributes[key])
        else if (key === 'http.url') spanAttributes[SemanticAttributes.HTTP_URL] = String(rawAttributes[key])
        else if (key === 'http.status_code') spanAttributes[SemanticAttributes.HTTP_STATUS_CODE] = Number(rawAttributes[key])
        else if (key === 'http.route') spanAttributes[SemanticAttributes.HTTP_ROUTE] = String(rawAttributes[key])
        else if (key === 'db.system') spanAttributes[SemanticAttributes.DB_SYSTEM] = String(rawAttributes[key]) // e.g., "postgres"
        else if (key === 'db.name') spanAttributes[SemanticAttributes.DB_NAME] = String(rawAttributes[key])
        else if (key === 'db.user') spanAttributes[SemanticAttributes.DB_USER] = String(rawAttributes[key])
        else if (key === 'db.statement' || (serializedSpan.type === 'sql' && key === 'resource')) { // DD часто кладет SQL в resource для pg.query
            spanAttributes[SemanticAttributes.DB_STATEMENT] = String(rawAttributes[key])
        } else if (key === 'messaging.system') spanAttributes[SemanticAttributes.MESSAGING_SYSTEM] = String(rawAttributes[key])
        else if (key === 'net.peer.name' || key === 'out.host') spanAttributes[SemanticAttributes.NET_PEER_NAME] = String(rawAttributes[key])
        else if (key === 'net.peer.port' || key === 'network.destination.port') spanAttributes[SemanticAttributes.NET_PEER_PORT] = Number(rawAttributes[key])
        else if (key === 'component') spanAttributes['component'] = String(rawAttributes[key]) // Можно оставить как есть или мапить в `otel.library.name`
        else {
            // Все остальные атрибуты добавляем "как есть", убедившись, что это примитивные типы
            const value = rawAttributes[key]
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                spanAttributes[key] = value
            } else if (Array.isArray(value) && value.every(v => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) {
                spanAttributes[key] = value
            } else {
                // Для сложных объектов можно сериализовать в JSON строку или пропустить
                spanAttributes[key] = JSON.stringify(value)
            }
        }
    }
    // Добавляем Datadog resource как отдельный атрибут, т.к. он важен
    if (serializedSpan.resource) {
        spanAttributes['dd.resource'] = String(serializedSpan.resource)
    }
    if (serializedSpan.type) {
        spanAttributes['dd.type'] = String(serializedSpan.type)
    }

    // Создание ReadableSpan объекта
    const readableSpan = {
        name: serializedSpan.name || 'unknown_operation', // Имя операции
        kind: spanKind,
        spanContext: () => ({
            traceId: otelTraceId,
            spanId: otelSpanId,
            traceFlags: TraceFlags.SAMPLED,
            isRemote: false,
        }),
        parentSpanId: otelParentSpanId,
        startTime: startTime,
        endTime: endTime,
        status: status,
        attributes: spanAttributes,
        links: serializedSpan.links ? serializedSpan.links.map(link => ({ // Пример маппинга, если DD links имеют похожую структуру
            context: {
                traceId: ddToOtelTraceId(prepId(link.trace_id)), // Предполагаем, что link.trace_id может быть 64-битным
                spanId: prepId(link.span_id),
            },
            attributes: link.attributes || {},
        })) : [],
        events: [], // Datadog спаны в этом формате обычно не имеют прямых аналогов OTel events
        duration: nsToHrTime(serializedSpan.duration), // duration вычисляется, но можно передать
        ended: true, // Спан уже завершен
        resource: new Resource(resourceAttributes),
        instrumentationLibrary: { // В OTel это InstrumentationScope
            name: String(rawAttributes.component || serializedSpan.meta?.component || 'dd-instrumentation'), // Извлекаем 'component' из meta, если есть
            version: String(rawAttributes.version || serializedSpan.meta?.version || 'unknown'), // Можно использовать версию приложения
        },
    }

    const context = readableSpan.spanContext()
    console.log(`[PROCESS_SPAN_CONTEXT] ${context.traceId}/${context.spanId}/${readableSpan.parentSpanId}`)
    processor.onEnd(readableSpan)
    return readableSpan
}

const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto')
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base')
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api')

const conf = require('@open-condo/config')

async function main () {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG) // или DiagLogLevel.ALL для максимальной детализации

    const OTEL_CONFIG = conf.OTEL_CONFIG ? JSON.parse(conf.OTEL_CONFIG) : {}
    const { tracesUrl, headers = {} } = OTEL_CONFIG
    const exporter = new OTLPTraceExporter({ url: tracesUrl, headers: headers })
    const processor = new BatchSpanProcessor(exporter)

    process.on('beforeExit', async () => {
        await processor.shutdown()
        await exporter.shutdown()
    })

    serializedSpanExamples.forEach(span => (JSON.stringify(processSpan(processor, span), null, 2)))
    await processor.forceFlush()
    console.log('exit!')
}

module.exports = {
    processSpan,
}
// main()
//