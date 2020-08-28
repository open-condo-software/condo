import 'react-native-gesture-handler'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { IconRegistry } from '@ui-kitten/components'
import { EvaIconsPack } from '@ui-kitten/eva-icons'

import { AppNavigator } from './AppNavigator'
import { ThemeState } from './context/theme'

export default function App () {
    return (<>
        <IconRegistry icons={EvaIconsPack}/>
        <ThemeState>
            <AppNavigator/>
        </ThemeState>
        <StatusBar style="auto"/>
    </>)
}
