import type { Account } from '@/entities/account'
import { listAccts } from '@/utils/storage'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformColor, StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native'
import Avatar from '../Avatar'
import { Text } from '../themed/Text'
import { Button } from '../ui/Button'

interface Props {
	change: (acct: Account) => void
}
export default function Acct({ change }: Props) {
	const { t } = useTranslation()
	const { width } = useWindowDimensions()
	const styles = createStyles({ width })
	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	const textColor = PlatformColor('label')
	const [acct, setAcct] = useState<Account[]>([])
	useEffect(() => {
		const fn = async () => {
			const accts = await listAccts()
			setAcct(accts)
		}
		fn()
	}, [])
	return (
		<View style={{ minHeight: 200 }}>
			{acct.map((a) => (
				<Button key={a.id} onPress={() => change(a)}>
					<View style={styles.container}>
						<View>
							<Avatar src={a.avatar || a.favicon} color={a.color} fallback={a.sns} size={40} />
						</View>
						<View style={styles.infoContainer}>
							<Text style={[styles.username, { color: textColor }]} numberOfLines={1}>
								{a.username}
							</Text>
							<Text style={[styles.domain, { color: textColor }]} numberOfLines={1}>
								{a.domain}
							</Text>
						</View>
					</View>
				</Button>
			))}
		</View>
	)
}
const createStyles = ({ width }: { width: number }) =>
	StyleSheet.create({
		container: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: 10
		},
		infoContainer: {
			marginLeft: 10,
			maxWidth: width - 100
		},
		username: {
			fontSize: 16,
			fontWeight: '600'
		},
		domain: {
			fontSize: 14,
			marginTop: 2
		}
	})
