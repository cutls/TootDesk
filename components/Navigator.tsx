import { useWindowSize } from '@/hooks/useWindowSize'
import type { IState } from '@/utils/type'
import type { FlashListRef } from '@shopify/flash-list'
import type React from 'react'
import { type RefObject } from 'react'
import NavigatorSP from './Navigator.sp'
import NavigatorTab from './Navigator.tab'

interface Props {
	openComposer: () => void
	openAddTimeline: () => void
	context: {
		current: number
		setCurrent: IState<number>
		relayRef: RefObject<FlashListRef<any> | null>
	}
}

export default function Navigator(props: Props) {
	const { deviceWidth } = useWindowSize()
	return (deviceWidth <= 550 ? <NavigatorSP {...props} /> : <NavigatorTab {...props} />)
}
