export type Timeline = {
	id: number
	kind: TimelineKind
	name: string
	acctId: number
	listId?: string | null
	tagName?: string | null
	color?: Color
	tts?: boolean
	mediaOnly?: boolean
	isMisskeyAntenna?: boolean
}
export const colorList = ['blue', 'green', 'indigo', 'orange', 'red', 'teal', 'yellow'] as const
export type Color = (typeof colorList)[number]
export type TimelineKind = 'home' | 'notifications' | 'local' | 'public' | 'favourites' | 'list' | 'bookmarks' | 'direct' | 'tag'
export const columnWidthSet = ['xs', 'sm', 'md', 'lg'] as const
export type ColumnWidth = (typeof columnWidthSet)[number]

export function columnWidth(width: ColumnWidth | number) {
	if (typeof width === 'number') return width
	switch (width) {
		case 'xs':
			return 280
		case 'sm':
			return 340
		case 'md':
			return 420
		case 'lg':
			return 500
		default:
			return 340
	}
}
