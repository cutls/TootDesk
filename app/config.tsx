import { Text } from '@/components/themed/Text'
import { Button } from '@/components/ui/Button'
import { useConfigStore } from '@/utils/store/config'
import { staticStyles } from '@/utils/theme'
import { getColorIOS } from 'expo-color-to-hex'
import { GlassView } from 'expo-glass-effect'
import * as Localization from 'expo-localization'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformColor, ScrollView, StyleSheet, TextInput, useColorScheme, useWindowDimensions, View } from 'react-native'

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

	const { config, setConfig } = useConfigStore()
	const [maxImageHeight, setMaxImageHeight] = useState(String(config.timeline.maxImageHeight))

	const handleMaxImageHeightBlur = () => {
		const parsed = Number.parseInt(maxImageHeight, 10)
		const value = Number.isNaN(parsed) || parsed < 0 ? 0 : parsed
		setMaxImageHeight(String(value))
		setConfig({ ...config, timeline: { ...config.timeline, maxImageHeight: value } })
	}

	return (
		<ScrollView style={{ padding: 20 }} contentContainerStyle={{ gap: 12 }}>
			<Button isPrimary={true} color={getColorIOS('systemBlue') || 'blue'} onPress={() => router.push('/acct')} style={{ padding: 10 }} systemImage="person" width={width - 20} isDark={isDark}>
				{t('screen.acct')}
			</Button>

			<Text style={styles.sectionHeader}>{t('config.timeline.title')}</Text>

			<GlassView style={styles.card}>
				<View style={styles.row}>
					<View style={styles.labelContainer}>
						<Text style={styles.label}>{t('config.timeline.maxImageHeight.label')}</Text>
						<Text style={styles.hint}>{t('config.timeline.maxImageHeight.hint')}</Text>
					</View>
					<TextInput
						value={maxImageHeight}
						onChangeText={setMaxImageHeight}
						onBlur={handleMaxImageHeightBlur}
						keyboardType="number-pad"
						placeholder="200"
						placeholderTextColor={isDark ? 'lightgray' : 'gray'}
						selectionColor={getColorIOS('systemBlue') || 'blue'}
						style={[staticStyles.input, styles.numberInput, { color: isDark ? 'white' : 'black' }]}
					/>
				</View>
			</GlassView>
		</ScrollView>
	)
}
const createStyles = (_: { width: number }) =>
	StyleSheet.create({
		sectionHeader: {
			fontSize: 13,
			fontWeight: '600',
			color: PlatformColor('secondaryLabel'),
			textTransform: 'uppercase',
			letterSpacing: 0.5,
			paddingHorizontal: 4
		},
		card: {
			borderRadius: 16,
			overflow: 'hidden'
		},
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingHorizontal: 16,
			paddingVertical: 14,
			gap: 12
		},
		labelContainer: {
			flex: 1
		},
		label: {
			fontSize: 16
		},
		hint: {
			fontSize: 12,
			color: PlatformColor('secondaryLabel'),
			marginTop: 2
		},
		numberInput: {
			width: 80,
			textAlign: 'center',
			padding: 10,
			flexShrink: 0
		}
	})
