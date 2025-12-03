import type { Entity } from '@cutls/megalodon'

export type Reply = {
	replyStatus: Entity.Status
	inReplyToAccountId: string
	type: 'reply' | 'quote' | 'edit'
}
