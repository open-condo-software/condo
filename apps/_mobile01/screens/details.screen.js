import React from 'react'
import { SafeAreaView, StyleSheet } from 'react-native'
import { Divider, Icon, Layout, Text, TopNavigation, TopNavigationAction } from '@ui-kitten/components'

const BackIcon = (props) => (
    <Icon {...props} name='arrow-back'/>
)

export const DetailsScreen = (props) => {
    const { navigation } = props

    const navigateBack = () => {
        navigation.goBack()
    }

    const BackAction = () => (
        <TopNavigationAction icon={BackIcon} onPress={navigateBack}/>
    )

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <TopNavigation title='MyApp' alignment='center' accessoryLeft={BackAction}/>
            <Divider/>
            <Layout style={styles.container}>
                <Text category='h1'>DETAILS</Text>
            </Layout>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
})
