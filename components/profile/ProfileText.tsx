import { emojify } from '@/utils/emojify'
import type { Entity } from '@cutls/megalodon'
import { openBrowserAsync } from 'expo-web-browser'
import React from 'react'
import { PlatformColor, useColorScheme } from 'react-native'
import HTML, { defaultHTMLElementModels, HTMLContentModel } from 'react-native-render-html'
const renderers = {
	img: defaultHTMLElementModels.img.extend({
		contentModel: HTMLContentModel.mixed
	})
}
interface ProfileTextProps {
	account: Entity.Account
	fontSize?: number
	showWithoutEllipsis?: boolean
	width: number
}
export const ProfileText = (props: ProfileTextProps) => {
	const { account, showWithoutEllipsis, width, fontSize = 20 } = props
	const textProps = showWithoutEllipsis ? {} : { numberOfLines: 1 }
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const txtColor = isDark ? 'white' : 'black'
	const tagStyle = { a: { color: PlatformColor('link') }, p: { color: txtColor } } as const
	const showGif = true
	return (
		<HTML
			source={{ html: `<p>${emojify(account.note, account.emojis, fontSize * 0.8, showGif)}</p>` }}
			tagsStyles={tagStyle}
			customHTMLElementModels={renderers}
			contentWidth={width}
			defaultTextProps={{ style: { fontSize: fontSize } }}
			defaultViewProps={{ style: { width } }}
			renderersProps={{
				a: {
					onPress: (e, href) => openBrowserAsync(href)
				}
			}}
		/>
	)
}
