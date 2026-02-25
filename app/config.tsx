import { Text } from '@/components/themed/Text'
import { Button } from '@/components/ui/Button'
import { confirmDialog, CONTINUE } from '@/utils/alert'
import { getSettings, saveSettings } from '@/utils/storage'
import { useConfigStore } from '@/utils/store/config'
import { staticStyles } from '@/utils/theme'
import { usePreventRemove } from '@react-navigation/native'
import { getColorIOS } from 'expo-color-to-hex'
import { GlassView } from 'expo-glass-effect'
import { useNavigation, useRouter } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActionSheetIOS, findNodeHandle, PlatformColor, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, useColorScheme, useWindowDimensions, View } from 'react-native'

export default function Index() {
	const { t } = useTranslation()

	const router = useRouter()
	const navigation = useNavigation()
	const { width } = useWindowDimensions()
	const styles = createStyles({ width })
	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'

	const { config, setConfig } = useConfigStore()

	// Local (pending) state — not persisted until Save is pressed
	const [maxImageHeight, setMaxImageHeight] = useState(String(config.timeline.maxImageHeight))
	const [maxLength, setMaxLength] = useState(String(config.timeline.maxLength))
	const [animation, setAnimation] = useState(config.timeline.animation === 'yes')
	const [cropImage, setCropImage] = useState<'cover' | 'contain'>(config.timeline.cropImage)
	const cropImageDropdown = useRef(null)
	const isDirty = useRef(false)

	// Load persisted settings on mount
	useEffect(() => {
		const fn = async () => {
			const stored = await getSettings()
			if (stored) {
				setConfig(stored)
				setMaxImageHeight(String(stored.timeline.maxImageHeight))
				setMaxLength(String(stored.timeline.maxLength))
				setAnimation(stored.timeline.animation === 'yes')
				setCropImage(stored.timeline.cropImage)
			}
		}
		fn()
	}, [])

	// Mark dirty whenever local state diverges from the loaded config
	const handleChangeMaxImageHeight = (value: string) => {
		setMaxImageHeight(value)
		isDirty.current = true
	}

	const normaliseHeight = (raw: string): number => {
		const parsed = Number.parseInt(raw, 10)
		return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed
	}

	const handleSave = async () => {
		const heightValue = normaliseHeight(maxImageHeight)
		const lengthValue = normaliseHeight(maxLength)
		setMaxImageHeight(String(heightValue))
		setMaxLength(String(lengthValue))

		const updated = { ...config, timeline: { ...config.timeline, maxImageHeight: heightValue, maxLength: lengthValue, animation: (animation ? 'yes' : 'no') as 'yes' | 'no', cropImage } }
		await saveSettings(updated)
		setConfig(updated)
		isDirty.current = false
		router.back()
	}

	usePreventRemove(isDirty.current, ({ data }) => {
		const fn = async () => {
			const result = await confirmDialog(t('config.unsavedChanges.title'), t('config.unsavedChanges.message'), CONTINUE, t)
			if (result === 1) {
				isDirty.current = false
				navigation.dispatch(data.action)
			}
		}
		fn()
	})

	return (
		<ScrollView style={{ padding: 20 }} contentContainerStyle={{ gap: 12 }}>
			<Button onPress={() => router.push('/acct')} style={{ padding: 10 }} systemImage="person" width={width - 20} isDark={isDark}>
				{t('screen.acct')}
			</Button>
			<Button isPrimary={true} onPress={handleSave} style={{ padding: 10 }} systemImage="checkmark" width={width - 20} isDark={isDark}>
				{t('config.save')}
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
						onChangeText={handleChangeMaxImageHeight}
						onBlur={() => setMaxImageHeight(String(normaliseHeight(maxImageHeight)))}
						keyboardType="number-pad"
						placeholder="100"
						placeholderTextColor={isDark ? 'lightgray' : 'gray'}
						selectionColor={getColorIOS('systemBlue') || 'blue'}
						style={[staticStyles.input, styles.numberInput, { color: isDark ? 'white' : 'black' }]}
					/>
				</View>
				<View style={styles.divider} />
				<View style={styles.row}>
					<View style={styles.labelContainer}>
						<Text style={styles.label}>{t('config.timeline.maxLength.label')}</Text>
						<Text style={styles.hint}>{t('config.timeline.maxLength.hint')}</Text>
					</View>
					<TextInput
						value={maxLength}
						onChangeText={(v) => {
							setMaxLength(v)
							isDirty.current = true
						}}
						onBlur={() => setMaxLength(String(normaliseHeight(maxLength)))}
						keyboardType="number-pad"
						placeholder="500"
						placeholderTextColor={isDark ? 'lightgray' : 'gray'}
						selectionColor={getColorIOS('systemBlue') || 'blue'}
						style={[staticStyles.input, styles.numberInput, { color: isDark ? 'white' : 'black' }]}
					/>
				</View>
				<View style={styles.divider} />
				<View style={styles.row}>
					<View style={styles.labelContainer}>
						<Text style={styles.label}>{t('config.timeline.animation.label')}</Text>
						<Text style={styles.hint}>{t('config.timeline.animation.hint')}</Text>
					</View>
					<Switch
						value={animation}
						onValueChange={(v) => {
							setAnimation(v)
							isDirty.current = true
						}}
					/>
				</View>
				<View style={styles.divider} />
				<View style={styles.row}>
					<View style={styles.labelContainer}>
						<Text style={styles.label}>{t('config.timeline.cropImage.label')}</Text>
						<Text style={styles.hint}>{t('config.timeline.cropImage.hint')}</Text>
					</View>
					<TouchableOpacity
						ref={cropImageDropdown}
						activeOpacity={0.7}
						onPress={() => {
							const options = [t('config.timeline.cropImage.cover'), t('config.timeline.cropImage.contain'), t('cancel')]
							ActionSheetIOS.showActionSheetWithOptions(
								{ options, cancelButtonIndex: 2, title: t('config.timeline.cropImage.label'), anchor: findNodeHandle(cropImageDropdown.current) || undefined },
								(index) => {
									if (index === 0) {
										setCropImage('cover')
										isDirty.current = true
									} else if (index === 1) {
										setCropImage('contain')
										isDirty.current = true
									}
								}
							)
						}}
					>
						<View style={styles.pickerButton}>
							<Text style={styles.pickerButtonText}>{t(`config.timeline.cropImage.${cropImage}`)}</Text>
							<SymbolView name="chevron.up.chevron.down" type="monochrome" tintColor={getColorIOS('systemBlue') || 'blue'} size={12} />
						</View>
					</TouchableOpacity>
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
		},
		divider: {
			height: 1,
			backgroundColor: PlatformColor('separator'),
			marginHorizontal: 16
		},
		currentValue: {
			fontSize: 16,
			color: PlatformColor('secondaryLabel'),
			flexShrink: 0
		},
		pickerButton: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: 5,
			paddingHorizontal: 12,
			paddingVertical: 7,
			borderRadius: 8,
			backgroundColor: PlatformColor('systemGray5'),
		},
		pickerButtonText: {
			fontSize: 15,
			color: PlatformColor('label'),
		}
	})
