import type { Entity } from '@cutls/megalodon'

export type IState<T> = (value: React.SetStateAction<T>) => void
export type ComposeMode = 'compose' | 'acct' | 'menu' | 'emoji' | 'schedule' | 'poll' | 'loading'
export interface PostComposer {
	visibility: Entity.StatusVisibility
}
export const colors = ['blue', 'green', 'indigo', 'orange', 'red', 'teal', 'yellow'] as const
export type Color = typeof colors[number]
export const getTextColor = (color: Color) => {
	switch (color) {
		case 'yellow':
		case 'orange':
			return 'black'
		default:
			return 'white'
	}
}
