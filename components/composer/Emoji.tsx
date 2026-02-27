import { useWindowSize } from '@/hooks/useWindowSize'
import type { Entity, MegalodonInterface } from '@cutls/megalodon'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native'
import { Text } from '../themed/Text'
import { Button } from '../ui/Button'

interface Props {
	client: MegalodonInterface | null
	add: (id: string) => void
}
const column = 8
const margin = 2
export default function Emoji({ client, add }: Props) {
	const { width } = useWindowSize()
	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	const styles = createStyles({ width })
	const perWidth = (width - 100 - column * margin - margin) / column
	const { t } = useTranslation()
	const [emoji, setEmoji] = useState<Entity.Emoji[]>([])
	const [isLoading, setIsLoading] = useState(false)
	useEffect(() => {
		const fn = async () => {
			setIsLoading(true)
			try {
				if (!client) return
				const emojis = await client.getInstanceCustomEmojis()
				setEmoji(emojis.data)
			} catch (e) {
				console.log(e)
			} finally {
				setIsLoading(false)
			}
		}
		fn()
	}, [])
	return (
		<View style={styles.wrap}>
			{isLoading ? (
				<View style={styles.container}>
					<ActivityIndicator />
				</View>
			) : (
				<FlashList
					data={emoji}
					numColumns={column}
					keyExtractor={(item) => item.shortcode}
					ListEmptyComponent={
						<View style={styles.container}>
							<Text>{t('composer.emoji.empty')}</Text>
						</View>
					}
					renderItem={({ item }) => (
						<TouchableOpacity activeOpacity={0.7} onPress={() => add(item.shortcode)} style={{ width: perWidth, height: perWidth }}>
							<Image source={{ uri: item.url }} style={{ width: perWidth, height: perWidth, margin }} contentFit="contain" />
						</TouchableOpacity>
					)}
					style={{ height: 250}}
				/>
			)}
			<Button onPress={() => add('')} style={{ width: width - 40, height: 50, marginTop: 10 }} width={width - 40} isDark={isDark}>
				{t('composer.emoji.close')}
			</Button>
		</View>
	)
}
const createStyles = ({ width }: { width: number }) =>
	StyleSheet.create({
		wrap: {
			flexDirection: 'column',
			justifyContent: 'space-around'
		},
		container: {
			width: '100%',
			height: 250,
			alignItems: 'center',
			justifyContent: 'center'
		}
	})
