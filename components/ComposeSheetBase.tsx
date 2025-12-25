import type { ActionProps, IState } from '@/utils/type'
import { BottomSheet, Host } from '@expo/ui/swift-ui'
import React from 'react'
import { useWindowDimensions } from 'react-native'
import ComposeSheet from './ComposeSheet'

interface Props {
	isOpened: boolean
	setIsOpened: IState<boolean>
	composeAction: ActionProps | null
	clearComposeAction: (acctId: string) => void
}
export default function ComposeSheetBase({ isOpened, setIsOpened, composeAction, clearComposeAction }: Props) {
	const { width } = useWindowDimensions()
	return (
		<Host style={{ width, position: isOpened ? 'absolute' : undefined, zIndex: 1000 }}>
			<BottomSheet isOpened={isOpened} onIsOpenedChange={(e) => setIsOpened(e)}>
				<ComposeSheet isOpened={isOpened} setIsOpened={setIsOpened} composeAction={composeAction} clearComposeAction={clearComposeAction} />
			</BottomSheet>
		</Host>
	)
}
