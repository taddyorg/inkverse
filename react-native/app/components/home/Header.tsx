import React from "react"
import { Logo } from "../ui/Logo"
import { Platform, StyleSheet, View } from "react-native"

export const Header = () => {
  return (
    <View style={[styles.container]}>
      <View style={styles.sideContainer} />
      <View style={styles.logoContainer}>
        <Logo />
      </View>
      <View style={styles.sideContainer}>
        {/* <HomeBellIcon /> */}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...Platform.select({
      ios: {
        paddingTop: 30,
      },
      android: {
        paddingTop: 10,
      },
    }),
  },
  logoContainer: {
    width: '60%',
    alignItems: 'center',
  },
  sideContainer: {
    width: '20%',
    alignItems: 'flex-end',
  },
});