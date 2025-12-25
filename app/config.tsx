import { Text } from '@/components/themed/Text'
import { CustomedButton } from '@/components/ui/CustomedButton'
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
			<CustomedButton isGlass={true} isPrimary={true} onPress={() => router.push('/acct')}>
				<Text>{t('screen.acct')}</Text>
			</CustomedButton>
		</ScrollView>
	)
}
const createStyles = ({ width }: { width: number }) => StyleSheet.create({})
