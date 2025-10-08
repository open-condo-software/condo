# RichTextArea - WYSIWYG редактор с поддержкой Markdown

## Описание

RichTextArea - это компонент текстового редактора с поддержкой WYSIWYG (What You See Is What You Get) на базе Slate.js. Он автоматически преобразует markdown-подобный синтаксис в форматированные элементы.

## Использование

### Базовый пример

```tsx
import { Input } from '@open-condo/ui'

function MyComponent() {
    const [value, setValue] = useState('')
    
    return (
        <Input.TextArea
            enableRichText
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Введите текст..."
        />
    )
}
```

### В CommentForm

```tsx
<Input.TextArea
    ref={commentTextAreaRef}
    value={commentValue}
    onChange={(event) => setCommentValue(event.target.value)}
    placeholder={PlaceholderMessage}
    enableRichText={true}  // Включить WYSIWYG режим
    isSubmitDisabled={!canSendMessage}
    autoSize={{ minRows: 1, maxRows: 5 }}
    disabled={isInputDisable}
    onSubmit={()=>handelSendMessage(commentForm)}
    bottomPanelUtils={[...]}
/>
```

## Поддерживаемый синтаксис

### Чекбоксы

Введите `- [ ]` и нажмите пробел - появится чекбокс:
- `- [ ]` → ☐ Невыполненная задача
- `- [x]` → ☑ Выполненная задача

### Списки

Введите `- ` или `* ` и нажмите пробел:
- `- ` → • Элемент списка
- `* ` → • Элемент списка

### Форматирование текста (планируется)

- `**текст**` → **жирный текст**
- `*текст*` → *курсив*
- `` `код` `` → `код`

## Props

| Prop | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `enableRichText` | `boolean` | `false` | Включить WYSIWYG режим с поддержкой markdown |
| `value` | `string` | - | Значение текста |
| `onChange` | `(e: ChangeEvent) => void` | - | Обработчик изменения |
| `placeholder` | `string` | - | Placeholder текст |
| `disabled` | `boolean` | `false` | Отключить редактор |
| `autoFocus` | `boolean` | `false` | Автофокус при монтировании |
| `maxLength` | `number` | `1000` | Максимальная длина текста |

## Особенности

1. **Автоматическое преобразование**: При вводе markdown-синтаксиса и нажатии пробела текст автоматически преобразуется в форматированный элемент

2. **Интерактивные чекбоксы**: Чекбоксы можно кликать для изменения состояния

3. **Обратное преобразование**: При нажатии Backspace в начале строки элемент преобразуется обратно в обычный параграф

4. **Сохранение в markdown**: Значение сохраняется в виде markdown-строки, что удобно для хранения в БД

## Примеры использования

### Простой редактор задач

```tsx
function TaskEditor() {
    const [tasks, setTasks] = useState('- [ ] Купить молоко\n- [x] Сделать зарядку\n- [ ] Написать отчет')
    
    return (
        <Input.TextArea
            enableRichText
            value={tasks}
            onChange={(e) => setTasks(e.target.value)}
            placeholder="Добавьте задачи..."
            autoSize={{ minRows: 3, maxRows: 10 }}
        />
    )
}
```

### С кнопкой отправки

```tsx
function CommentBox() {
    const [comment, setComment] = useState('')
    
    const handleSubmit = (value: string) => {
        console.log('Отправка:', value)
        setComment('')
    }
    
    return (
        <Input.TextArea
            enableRichText
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onSubmit={handleSubmit}
            isSubmitDisabled={!comment.trim()}
            placeholder="Напишите комментарий..."
        />
    )
}
```

## Технические детали

- **Библиотека**: Slate.js v0.118+
- **История**: Поддержка undo/redo через slate-history
- **Чекбоксы**: Используются компоненты из @open-condo/ui
- **Сериализация**: Автоматическое преобразование между Slate nodes и markdown строками

## Ограничения

- Форматирование bold/italic/code пока в разработке
- Не поддерживаются вложенные списки
- Максимальная длина ограничена maxLength prop
