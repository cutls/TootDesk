import type { ComposeMode } from '@/utils/type'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformColor, StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native'
import { CustomedButton } from '../ui/CustomedButton'

interface Props {
	changeMode: (m: ComposeMode) => void
}
export default function Menu({ changeMode }: Props) {
	const { t } = useTranslation()
	const { width } = useWindowDimensions()
	const styles = createStyles({ width })
	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	const textColor = PlatformColor('label')
	return (
		<View style={{ minHeight: 220 }}>
			<CustomedButton onPress={() => changeMode('poll')}>{t('composer.menu.poll')}</CustomedButton>
			<CustomedButton onPress={() => changeMode('schedule')} style={{ marginVertical: 10 }}>{t('composer.menu.schedule')}</CustomedButton>
			<CustomedButton isPrimary={true} onPress={() => changeMode('compose')}>{t('composer.menu.return')}</CustomedButton>
		</View>
	)
}
const createStyles = ({ width }: { width: number }) =>
	StyleSheet.create({
		btn: {
			height: 50,
			marginVertical: 10,
			display: 'flex',
			justifyContent: 'center',
			alignContent: 'center',
			width: width - 40
		}
	})
