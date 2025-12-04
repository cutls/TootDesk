import { type Account, mockAccount } from '@/entities/account'
import { listAccts } from '@/utils/storage'
import type { ComposeMode, IState } from '@/utils/type'
import type { Entity } from '@cutls/megalodon'
import { BottomSheet, Host } from '@expo/ui/swift-ui'
import { SymbolView } from 'expo-symbols'
import React, { useEffect, useState } from 'react'
import { PlatformColor, StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native'
import Avatar from './Avatar'
import Acct from './composer/Acct'
import Composer from './composer/Composer'
import Emoji from './composer/Emoji'
import Menu from './composer/Menu'
import Schedule from './composer/Schedule'
import { Text } from './themed/Text'
import { Button } from './ui/Button'

interface Props {
	isOpened: boolean
	setIsOpened: IState<boolean>
}
interface IOptional {
	scheduled_at?: string
	poll?: Entity.Poll
}
export default function Navigator({ isOpened, setIsOpened }: Props) {
	const { width } = useWindowDimensions()
	const styles = createStyles({ width })
	const [mode, setMode] = useState<ComposeMode>('compose')
	const [useAcct, setUseAcct] = useState<Account | null>(mockAccount)
	const [text, setText] = useState('')
	const [optional, setOptional] = useState<IOptional>({})
	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	const textColor = PlatformColor('label')
	const [maxChars, setMaxChars] = useState(5000)
	const changeMode = (m: ComposeMode) => {
		setMode(m)
	}
	const addEmoji = (e: string) => {
		if (e) setText((t) => `${t} :${e}: `)
		setMode('compose')
	}
	const addSchedule = (date: Date | null) => {
		setOptional((o) => ({ ...o, scheduled_at: date ? date.toISOString() : undefined }))
		setMode('compose')
	}
	useEffect(() => {
		const fn = async () => {
			const accts = await listAccts()
			// setUseAcct(accts[0] || null)
		}
		fn()
	}, [])
	if (!useAcct) return null
	return (
		<Host style={{ width }}>
			<BottomSheet isOpened={isOpened} onIsOpenedChange={(e) => setIsOpened(e)}>
				<View style={{ padding: 20 }}>
					{mode === 'compose' && (
						<View style={{ display: 'flex', flexDirection: 'row', marginBottom: 10, alignItems: 'center', justifyContent: 'space-between' }}>
							<Button variant="bordered" onPress={() => changeMode('acct')} style={{ flexGrow: 1 }}>
								<View style={styles.acctContainer}>
									<View>
										<Avatar src={useAcct.avatar || useAcct.favicon} fallback={useAcct.sns} size={20} />
									</View>
									<Text style={[styles.username, { color: textColor }]} numberOfLines={1}>
										{useAcct.username}@{useAcct.domain}
									</Text>
								</View>
							</Button>
							<View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 5, width: 80 }}>
								{optional.scheduled_at && <SymbolView type="monochrome" tintColor={textColor} name="clock" size={16} />}
								{optional.poll && <SymbolView type="monochrome" tintColor={textColor} name="checklist" size={16} />}
								<Text>{maxChars - text.length}</Text>
							</View>
						</View>
					)}
					<Composer isOpened={mode === 'compose'} acct={useAcct} changeMode={changeMode} text={text} setText={setText} />
					{mode === 'acct' && <Acct change={(r) => setMode('compose')} />}
					{mode === 'emoji' && <Emoji acct={useAcct} add={(r) => addEmoji(r)} />}
					{mode === 'menu' && <Menu changeMode={changeMode} />}
					{mode === 'schedule' && <Schedule changeMode={changeMode} addSchedule={addSchedule} />}
				</View>
			</BottomSheet>
		</Host>
	)
}

const createStyles = ({ width }: { width: number }) =>
	StyleSheet.create({
		acctContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingBottom: 10,
			height: 40
		},
		username: {
			fontSize: 16,
			marginLeft: 10
		}
	})
