import { Button } from '@/components/ui/Button'
import { getColorIOS } from 'expo-color-to-hex'
import * as Localization from 'expo-localization'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformColor, ScrollView, StyleSheet, useColorScheme, useWindowDimensions } from 'react-native'

export default function Index() {
	const { t } = useTranslation()
	const [scrolled, setScrolled] = useState(false)

	const router = useRouter()
	const { width } = useWindowDimensions()
	const styles = createStyles({ width })
	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	const textColor = PlatformColor('label')
	const lang = Localization.getLocales()[0]?.languageTag === 'ja-JP' ? 'ja' : 'en'
	return (
		<ScrollView style={{ padding: 20 }}>
			<Button isPrimary={true} color={getColorIOS('systemBlue') || 'blue'} onPress={() => router.push('/acct')} style={{ padding: 10 }} systemImage="person" width={width - 20} isDark={isDark}>
				{t('screen.acct')}
			</Button>
		</ScrollView>
	)
}
const createStyles = ({ width }: { width: number }) => StyleSheet.create({})
