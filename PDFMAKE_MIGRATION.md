# Миграция с jspdf на pdfmake

## Что изменилось

Функция `createWrappedPdf` была переписана с использования `jspdf` на `pdfmake`, при этом `html2canvas` остался для рендеринга HTML в изображение.

### Преимущества нового подхода:

1. **Меньший размер бандла** - pdfmake легче чем jspdf
2. **Современная библиотека** - активная поддержка и развитие
3. **Гибкость** - можно легко расширить для векторной генерации в будущем
4. **Поддержка кириллицы** - встроенные шрифты с поддержкой русского языка

### Подход:

- `html2canvas` рендерит HTML элемент в canvas
- Canvas конвертируется в base64 изображение
- pdfmake создает PDF с этим изображением

## Установка зависимостей

```bash
# Установить pdfmake
yarn add pdfmake

# Удалить только jspdf (html2canvas остается)
yarn remove jspdf
```

## Изменения в коде

### До (jspdf):

```typescript
import html2canvas from 'html2canvas'
import Jspdf from 'jspdf'

export const createWrappedPdf = (options) => {
    const { element, fileName } = options
    const pdfWidth = element.clientWidth
    const pdfHeight = element.clientHeight
    return html2canvas(element, {
        windowWidth: pdfWidth,
        windowHeight: pdfHeight,
    }).then(canvas => {
        const doc = new Jspdf('p', 'px', [pdfWidth, pdfHeight])
        const imageOptions = {
            imageData: canvas,
            x: 0,
            y: 0,
            width: pdfWidth,
            height: pdfHeight,
        }
        doc.addImage(imageOptions)
        return doc.save(fileName, { returnPromise: true })
    })
}
```

### После (pdfmake):

```typescript
import html2canvas from 'html2canvas'
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { TDocumentDefinitions } from 'pdfmake/interfaces'

pdfMake.vfs = pdfFonts.pdfMake.vfs

export const createWrappedPdf = async (options) => {
    const { element, fileName } = options
    
    const pdfWidth = element.clientWidth
    const pdfHeight = element.clientHeight
    
    // Render HTML element to canvas
    const canvas = await html2canvas(element, {
        windowWidth: pdfWidth,
        windowHeight: pdfHeight,
    })
    
    // Convert canvas to base64 image
    const imageData = canvas.toDataURL('image/png')
    
    // Create PDF document with image
    const docDefinition: TDocumentDefinitions = {
        pageSize: {
            width: pdfWidth,
            height: pdfHeight,
        },
        pageMargins: [0, 0, 0, 0],
        content: [
            {
                image: imageData,
                width: pdfWidth,
                height: pdfHeight,
            },
        ],
    }
    
    const pdfDocGenerator = pdfMake.createPdf(docDefinition)
    pdfDocGenerator.download(fileName)
    
    return Promise.resolve()
}
```

## Использование (без изменений)

Код использующий `createWrappedPdf` остается без изменений:

```typescript
// В AcquiringReceipt.tsx
useEffect(() => {
    if (containerRef.current) {
        createWrappedPdf({ 
            fileName: `Receipt_${documentNumber}`, 
            element: containerRef.current 
        })
    }
}, [containerRef, documentNumber])

// В Check.tsx
useEffect(() => {
    if (status === MultiPaymentStatusType.Done && containerRef.current) {
        createWrappedPdf({ 
            fileName: 'Check', 
            element: containerRef.current 
        })
    }
}, [status, containerRef])
```

## Тестирование

После установки pdfmake необходимо протестировать:

1. **AcquiringReceipt** - `/reports/test`
   - Проверить генерацию PDF чека
   - Убедиться что все данные отображаются корректно
   - Проверить форматирование сумм и дат

2. **Check (EPS)** - `/reports/test-check`
   - Проверить генерацию PDF чека ЖКХ
   - Убедиться что таблицы услуг отображаются правильно
   - Проверить банковские реквизиты

## Известные ограничения

1. **Растровое изображение** - PDF содержит PNG изображение, а не векторную графику
2. **Размер файла** - может быть больше чем при векторной генерации

## Возможные улучшения в будущем

1. Реализовать парсинг HTML в векторный pdfmake формат для уменьшения размера файлов
2. Добавить поддержку разбиения на страницы для длинных документов
3. Оптимизировать качество изображения через параметры html2canvas

## Откат (если потребуется)

Если возникнут проблемы, можно откатиться к старой версии:

```bash
# Установить jspdf обратно
yarn add jspdf

# Восстановить старый код из git
git checkout HEAD -- apps/condo/domains/common/utils/pdf.ts
```
