import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

export const Logo = () => {
  return (
    <View style={styles.container}>
      <Image 
        style={styles.logo} 
          source={require('../../../assets/images/inkverse-logo.png')}
        />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  logo: {
    height: 42,
    width: 176,
  }
});