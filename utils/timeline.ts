import type { TimelineKind } from '@/entities/timeline'
import type { Entity, MegalodonInterface, Response } from '@cutls/megalodon'
import { parseHeader } from './parseHeader'
interface Statuses {
	data: Array<Entity.Status>
	maxId: string | null
}
export const getStatuses = async (client: MegalodonInterface, type: TimelineKind, options?: Record<string, any>, targetId?: string | null): Promise<Statuses> => {
	try {
		let response: Response<Array<Entity.Status>> | null = null
		if (type === 'home') response = await client.getHomeTimeline(options)
		if (type === 'local') response = await client.getLocalTimeline(options)
		if (type === 'public') response = await client.getPublicTimeline(options)
		if (type === 'bookmarks') response = await client.getBookmarks(options)
		if (type === 'favourites') response = await client.getFavourites(options)
		if (type === 'list' && targetId) response = await client.getListTimeline(targetId, options)
		if (type === 'tag' && targetId) response = await client.getTagTimeline(targetId, options)
		if (!response || !response.data) throw new Error('Invalid timeline type or missing targetId')
		if (type !== 'bookmarks' && type !== 'favourites') {
			const maxId = response.data.length > 0 ? response.data[response.data.length - 1].id : null
			return { data: response.data, maxId }
		} else {
			const link = parseHeader(response.headers.link)
			const maxId = link.next.urlParams.max_id
			return { data: response.data, maxId }
		}
	} catch (e) {
		console.log(e)
		return { data: [], maxId: null }
	}
}

export const getNotifications = async (client: MegalodonInterface, options?: Record<string, any>): Promise<Array<Entity.Notification>> => {
	try {
		const response: Response<Array<Entity.Notification>> =  await client.getNotifications(options)
		if (!response || !response.data) throw new Error('Invalid timeline type or missing targetId')
		return response.data
	} catch (e) {
		console.log(e)
		return []
	}
}
