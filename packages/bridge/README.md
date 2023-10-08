[npm-badge-link]: https://img.shields.io/npm/v/@open-condo/bridge?style=flat-square
[npm-pkg-link]: https://www.npmjs.com/package/@open-condo/bridge

# `@open-condo/bridge` [![NPM][npm-badge-link]][npm-pkg-link]
> A library that allows the client of your mini-application to communicate with the main user's condo client on different devices, using a common bridge API


## Table of contents
[Installation](#installation)\
[Usage](#usage)\
[API Reference](#api-reference)

## Installation
To install package simply run the following command if you're using npm as your package manager:
```bash
npm i @open-condo/bridge
```
or it's yarn alternative
```bash
yarn add @open-condo/bridge
```

## Usage
You can access and use the bridge as follows:
```typescript
import bridge from '@open-condo/bridge'

// Send event
bridge.send('<event-name>')

// Send event with args
bridge.send('<event-name>', { someArg: 'some value' })

// Send event and process response
bridge.send('<event-name>', { someArg: 'some value' })
    .then((response) => {
        // successful state processing
    }).catch((error) => {
        // error processing        
    })
```
You can also use the bridge in the browser environment:
```html
<script src="https://unpkg.com/@open-condo/bridge/dist/browser.min.js"></script>
<script>
    condoBridge.send('<event-name>')
</script>
```

## API Reference
### `bridge.send(method[, params])`

Sends a message to main client and returns the `Promise` object with response data

**Parameters**

- `method` _required_ The method of Condo Bridge
- `params` _optional_ Object containing method args. Make sure you are not sending sensitive data!

**Example**

```typescript
// Sending event to client
bridge
  .send('CondoWebAppResizeWindow', { height: 800 })
  .then(data => {
    // Handling response
    console.log(data.height)
  })
  .catch(error => {
    // Handling an error
  });
```

Since `bridge.send` returns a Promise you can use `async / await` flow for handling events:

```typescript

try {
    const response = await bridge.send('CondoWebAppResizeWindow', { height: 800 })
    // Handling response
    console.log(response.height)
} catch (err) {
    // Handling error
}
```

### `bridge.subscribe(listener)`

Subscribes listener to all incoming events and responses.

**Parameters**

- `listener` _required_ Function handling events

**Example**

```typescript
// Subscribing to receive events
bridge.subscribe((event) => {
    const { type, data } = event
    if (type === 'CondoWebAppResizeWindowResult') {
        // Processing event result
        console.log(data.height)
    } else if (type === 'CondoWebAppResizeWindowError') {
        // Processing event error
        const { errorType, errorMessage } = data
    }
})
```

### `bridge.unsubscribe(listener)`

Unsubscribes a function from event listening

**Parameters**

- `listener` _required_ Function handling events

**Example**

```typescript
import bridge from "@open-condo/bridge";

const myListener = (event) => {
    logger.info(event)
}

// Subscribing
bridge.subscribe(myListener)

// Unsubscribing
bridge.unsubscribe(myListener)
```

### `bridge.supports(method)`

Checks if the main client (runtime environment) supports this method

**Parameters**

- `method` _required_ The method of Condo Bridge

**Example**

```typescript
// Checking if event is available
if (bridge.supports('CondoWebAppResizeWindow')) {
    // Then sending actual event
    bridge.send('CondoWebAppResizeWindow', { height: document.body.scrollHeight })
}
```
