import type { Color } from './timeline'

export type Account = {
	id: string
	username: string
	accountId: string
	avatar: string | null
	avatarStatic: string | null
	clientId: string | null
	clientSecret: string
	accessToken: string
	refreshToken: string
	usual: boolean
	color?: Color | null
	domain: string
	streamingUrl: string
	sns: 'mastodon' | 'pleroma' | 'misskey'
	favicon: string | null
	noStreaming: boolean
	cannotSubscribe: boolean
	emojiReactions: boolean
	quoteSupport: boolean
}
export const mockAccount: Account = {
	id: 'f7e38316-8d05-4a38-9cd2-0f232ebf0303',
	username: 'tootdesk',
	accountId: '153879aa-8058-4495-aebf-c0b0b57da923',
	avatar: null,
	avatarStatic: null,
	clientId: null,
	clientSecret: '',
	accessToken: '',
	refreshToken: '',
	usual: false,
	color: 'blue',
	domain: 'mastodon.example',
	streamingUrl: 'wss://mastodon.social',
	sns: 'mastodon',
	favicon: null,
	noStreaming: false,
	cannotSubscribe: false,
	emojiReactions: true,
	quoteSupport: true
}
