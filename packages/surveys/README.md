# Surveys

React Context for working with PostHog surveys. Provides centralized access to PostHog surveys API with automatic SDK readiness checking.

## Key Features

- Automatic PostHog SDK readiness checking
- Get list of surveys
- Get survey by ID
- Work with feature flags linked to surveys
- Get active matching surveys

## Installation

```bash
yarn workspace @app/your-app add @open-condo/surveys
```

## Usage

### 1. Basic Setup

Wrap your application in `PostHogSurveysProvider`:

```tsx
import { PostHogSurveysProvider } from '@open-condo/surveys'

function App () {
    return (
        <PostHogSurveysProvider>
            <YourAppContent />
        </PostHogSurveysProvider>
    )
}
```

### 2. Using the usePostHogSurveys Hook

```tsx
import { usePostHogSurveys } from '@open-condo/surveys'

function MyComponent () {
    const {
        isReady,
        getSurveys,
        getSurveyById,
        getSurveysLinkedFlagValue,
        getActiveMatchingSurveys,
    } = usePostHogSurveys()

    // Your logic
}
```
### 3. Getting Active Matching Surveys

```tsx
import { usePostHogSurveys } from '@open-condo/surveys'
import { useEffect, useState } from 'react'

function ActiveSurveys () {
    const { getActiveMatchingSurveys, isReady } = usePostHogSurveys()
    const [activeSurveys, setActiveSurveys] = useState([])

    useEffect(() => {
        if (isReady) {
            const surveys = getActiveMatchingSurveys()
                
            setActiveSurveys(surveys)
        }
    }, [isReady, getActiveMatchingSurveys])

    return (
        <div>
            {activeSurveys.map((survey) => (
                <SurveyCard key={survey.id} survey={survey} />
            ))}
        </div>
    )
}
```

### 4. Working with Feature Flags

```tsx
import { usePostHogSurveys } from '@open-condo/surveys'
import type { SurveyFeatureFlagPayload } from '@open-condo/surveys'

function SurveyWithFlags ({ survey }) {
    const { getSurveysLinkedFlagValue } = usePostHogSurveys()

    const flagValue = getSurveysLinkedFlagValue(survey) as SurveyFeatureFlagPayload

    if (!flagValue) {
        return null // Feature flag not configured
    }

    const isFullscreen = flagValue.fullscreen

    return (
        <div className={isFullscreen ? 'fullscreen-modal' : 'regular-modal'}>
            {survey.name}
        </div>
    )
}
```