import { nowplaying, NowPlayingContext } from '@/utils/nowplaying'
import type { ComposeMode, IState } from '@/utils/type'
import type { Entity, MegalodonInterface } from '@cutls/megalodon'
import Fontisto from '@expo/vector-icons/Fontisto'
import React, { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformColor, StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native'
import { Text } from '../themed/Text'
import { CustomedButton } from '../ui/CustomedButton'

interface Props {
	changeMode: (m: ComposeMode) => void
	client: MegalodonInterface | null
	npSet: { setText: IState<string>; setUploaded: IState<Array<Entity.Attachment | Entity.AsyncAttachment>> }
}
export default function Menu({ changeMode, npSet, client }: Props) {
	const { t } = useTranslation()
	const { width } = useWindowDimensions()
	const styles = createStyles({ width })
	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	const textColor = PlatformColor('label')
	const { playing } = useContext(NowPlayingContext)
	const [isSpotifyLoading, setIsSpotifyLoading] = useState(false)
	const np = async (type: 'apple' | 'spotify') => {
		if (!client) return
		npSet.setUploaded([])
		if (type === 'spotify') setIsSpotifyLoading(true)
		const data = await nowplaying(client, type, playing)
		if (type === 'spotify') setIsSpotifyLoading(false)
		npSet.setText(data.text)
		if (data.image) npSet.setUploaded((u) => [...u, data.image])
		changeMode('compose')
	}
	return (
		<View style={{ minHeight: 320 }}>
			<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
				<Text style={{ fontWeight: 'bold', fontSize: 18 }}>NowPlaying</Text>
				<CustomedButton width={150} onPress={() => np('apple')} style={{ marginVertical: 5 }}>
					<Fontisto name="applemusic" size={24} color="black" />
				</CustomedButton>
				<CustomedButton isLoading={isSpotifyLoading} width={150} onPress={() => np('spotify')} style={{ marginVertical: 5 }}>
					<Fontisto name="spotify" size={24} color="black" />
				</CustomedButton>
			</View>
			<View style={{ height: 5 }} />
			<CustomedButton onPress={() => changeMode('poll')}>{t('composer.menu.poll')}</CustomedButton>
			<CustomedButton onPress={() => changeMode('schedule')} style={{ marginVertical: 10 }}>
				{t('composer.menu.schedule')}
			</CustomedButton>
			<CustomedButton isPrimary={true} onPress={() => changeMode('compose')}>
				{t('composer.menu.return')}
			</CustomedButton>
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
