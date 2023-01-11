## How to add a new event to bridge? 
> 1. Add it to list of available events inside `src/bridge.ts`
> 2. Add 3 following type definitions in `src/types/methods.ts`
>   1. Add method args to `RequestMethodsParamsMap`
>   2. Add method return types to `ResultResponseDataMap`
>   3. Add method success / error event names to `ResponseEventNamesMap`