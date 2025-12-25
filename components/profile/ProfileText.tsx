import { emojify } from '@/utils/emojify'
import type { Entity, MegalodonInterface } from '@cutls/megalodon'
import { useRouter } from 'expo-router'
import { openBrowserAsync } from 'expo-web-browser'
import React, { useState } from 'react'
import { ActivityIndicator, PlatformColor, useColorScheme, View } from 'react-native'
import HTML, { defaultHTMLElementModels, HTMLContentModel } from 'react-native-render-html'
const renderers = {
	img: defaultHTMLElementModels.img.extend({
		contentModel: HTMLContentModel.mixed
	})
}
interface ProfileTextProps {
	acctId: string
	client: MegalodonInterface | null
	account: Entity.Account
	fontSize?: number
	showWithoutEllipsis?: boolean
	width: number
}
export const ProfileText = (props: ProfileTextProps) => {
	const router = useRouter()
	const { account, showWithoutEllipsis, width, fontSize = 20, client, acctId } = props
	const textProps = showWithoutEllipsis ? {} : { numberOfLines: 1 }
	const theme = useColorScheme()
	const [isLoading, setIsLoading] = useState(false)
	const isDark = theme === 'dark'
	const txtColor = isDark ? 'white' : 'black'
	const tagStyle = { a: { color: PlatformColor('link') }, p: { color: txtColor } } as const
	const showGif = true
	const handleLink = async (url: string) => {
		const linkMatch = url.match(/^https:\/\/([a-zA-Z0-9-.]+)\/@([a-zA-Z0-9_]+)/)
		if (linkMatch && client) {
			setIsLoading(true)
			try {
				const userSearch = await client.searchAccount(`${linkMatch[2]}@${linkMatch[1]}`, { resolve: true })
				const userData = userSearch.data
				setIsLoading(false)
				if (userData && userData.length > 0) {
					const user = userData[0]
					router.push(`/user?acctId=${acctId}&userId=${user.id}`)
					return
				} else {
					openBrowserAsync(url)
				}
			} catch (e) {
				setIsLoading(false)
				openBrowserAsync(url)
			}
		} else {
			openBrowserAsync(url)
		}
		// Todo
	}
	return (
		<>
			{isLoading && (
				<View style={{ position: 'absolute', zIndex: 2, backgroundColor: PlatformColor('systemGray3'), padding: 5, borderRadius: 10, left: width / 2 - 20, top: 5 }}>
					<ActivityIndicator />
				</View>
			)}
			<HTML
				source={{ html: `<p>${emojify(account.note, account.emojis, fontSize * 0.8, showGif)}</p>` }}
				tagsStyles={tagStyle}
				customHTMLElementModels={renderers}
				contentWidth={width}
				defaultTextProps={{ style: { fontSize: fontSize } }}
				defaultViewProps={{ style: { width } }}
				renderersProps={{
					a: {
						onPress: (e, href) => handleLink(href)
					}
				}}
			/>
		</>
	)
}
