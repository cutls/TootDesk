import { type Account, mockAccount } from '@/entities/account'
import { listAccts } from '@/utils/storage'
import type { ComposeMode, IState } from '@/utils/type'
import { BottomSheet, Host } from '@expo/ui/swift-ui'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformColor, useColorScheme, useWindowDimensions, View } from 'react-native'
import Acct from './composer/Acct'
import Composer from './composer/Composer'

interface Props {
	isOpened: boolean
	setIsOpened: IState<boolean>
}
export default function Navigator({ isOpened, setIsOpened }: Props) {
	const { t } = useTranslation()
	const colorScheme = useColorScheme()
	const { width } = useWindowDimensions()
	const isDark = colorScheme === 'dark'
	const textColor = PlatformColor('label')
	const [vis, setVis] = useState('public')
	const [mode, setMode] = useState<ComposeMode>('compose')
	const [useAcct, setUseAcct] = useState<Account | null>(mockAccount)
	const changeMode = (m: ComposeMode) => {
		setMode(m)
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
					{mode === 'compose' && <Composer isOpened={isOpened} acct={useAcct} changeMode={changeMode} />}
					{mode === 'acct' && <Acct change={(r) => setMode('compose')} />}
				</View>
			</BottomSheet>
		</Host>
	)
}
