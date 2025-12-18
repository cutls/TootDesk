import { emojify } from '@/utils/emojify'
import type { Entity } from '@cutls/megalodon'
import React from 'react'
import { PlatformColor, useColorScheme } from 'react-native'
import HTML, { defaultHTMLElementModels, HTMLContentModel } from 'react-native-render-html'
const renderers = {
	img: defaultHTMLElementModels.img.extend({
		contentModel: HTMLContentModel.mixed
	})
}
interface FromTootToAcctName {
	text: string
	emojis: Entity.Emoji[]
	fontSize?: number
	width: number
}
export const PollOption = (props: FromTootToAcctName) => {
	const { text, emojis, width, fontSize = 20 } = props
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const txtColor = isDark ? 'white' : 'black'
	const tagStyle = { a: { color: PlatformColor('link') }, p: { color: txtColor } } as const
	const showGif = true
	return (
		<HTML
			source={{ html: `<p>${emojify(text, emojis, fontSize * 0.8, showGif)}</p>` }}
			tagsStyles={tagStyle}
			customHTMLElementModels={renderers}
			contentWidth={width}
			defaultTextProps={{ style: { fontSize: fontSize, fontWeight: 'bold' }, numberOfLines: 1 }}
			defaultViewProps={{ style: { width } }}
		/>
	)
}
