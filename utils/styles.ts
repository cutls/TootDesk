import { StyleSheet, Platform } from 'react-native'
let ios = true
if (Platform.OS === 'android') ios = false
let web = false
if (Platform.OS === 'web') web = true

export const commonStyle = StyleSheet.create({
	container: {
		flex: 1,
		padding: 10,
	},
	spacer: {
		height: 40
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	separator: {
		height: 1,
		width: '100%',
		maxWidth: 500,
		backgroundColor: '#ddd'
	},
	horizonal: {
		flexDirection: 'row',
		flexWrap: 'wrap'
	},
	textCenter: {
		textAlign: 'center'
	},
	blockCenter: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	switch: {
		marginRight: 2,
		position: 'relative',
	},
	switches: {
		marginVertical: 10,
		flex: 0,
		flexDirection: 'row',
	},
	switchText: {
		top: ios ? 7 : 2
	},
	link: {
		textDecorationStyle: 'solid',
		textDecorationColor: 'black',
		textDecorationLine: 'underline'
	},
	linkDark: {
		textDecorationStyle: 'solid',
		textDecorationColor: 'white',
		textDecorationLine: 'underline'
	},
})
