import type { Entity } from '@cutls/megalodon'

export type Poll = {
	options: Array<string>
	expires_in: number
	multiple: boolean
	hide_totals: boolean
}
const mockAcctEntity: Entity.Account = {
	id: '115469566062452004',
	username: 'cutls',
	acct: 'cutls',
	display_name: 'cutls',
	locked: false,
	bot: false,
	discoverable: true,
	group: false,
	url: 'https://6m.cutls.dev/@cutls',
	avatar: 'https://wsb.hostdon.ne.jp/mastodon_10834/accounts/avatars/115/469/566/062/452/004/original/ef676dd6b86758a7.png',
	avatar_static: 'https://wsb.hostdon.ne.jp/mastodon_10834/accounts/avatars/115/469/566/062/452/004/original/ef676dd6b86758a7.png',
	header: 'https://6m.cutls.dev/headers/original/missing.png',
	header_static: 'https://6m.cutls.dev/headers/original/missing.png',
	created_at: '2025-10-31T00:00:00.000Z',
	note: '\u003cp\u003eDev of TheDesk\u003cbr /\u003e今までにたくさんのサーバー(約4つの自鯖)を破壊し連合に迷惑をかけてきましたが、今回はHostdonを利用しているので大丈夫です。よろしくお願いします。\u003c/p\u003e',
	followers_count: 31,
	following_count: 68,
	statuses_count: 91,
	noindex: false,
	emojis: [],
	fields: [
		{
			name: 'TheDesk',
			value:
				'\u003ca href="https://thedesk.top" target="_blank" rel="nofollow noopener me" translate="no"\u003e\u003cspan class="invisible"\u003ehttps://\u003c/span\u003e\u003cspan class=""\u003ethedesk.top\u003c/span\u003e\u003cspan class="invisible"\u003e\u003c/span\u003e\u003c/a\u003e',
			verified_at: null
		},
		{
			name: 'About',
			value:
				'→ \u003ca href="https://cutls.dev" target="_blank" rel="nofollow noopener me" translate="no"\u003e\u003cspan class="invisible"\u003ehttps://\u003c/span\u003e\u003cspan class=""\u003ecutls.dev\u003c/span\u003e\u003cspan class="invisible"\u003e\u003c/span\u003e\u003c/a\u003e',
			verified_at: null
		}
	],
	suspended: null,
	limited: null,
	moved: null
}

export const statusMock: Entity.Status = {
	id: '115624723318246319',
	created_at: '2025-11-28T01:27:43.524Z',
	in_reply_to_id: null,
	in_reply_to_account_id: null,
	sensitive: false,
	spoiler_text: '',
	visibility: 'public',
	language: 'ja',
	uri: 'https://6m.cutls.dev/users/cutls/statuses/115624723318246319',
	url: 'https://6m.cutls.dev/@cutls/115624723318246319',
	replies_count: 0,
	reblogs_count: 0,
	favourites_count: 0,
	quotes_count: 0,
	edited_at: null,
	favourited: false,
	reblogged: false,
	muted: false,
	bookmarked: false,
	pinned: false,
	content:
		'<p>🎵 <a href="https://papi.n1l.dev/tags/にるぷれ" rel="nofollow noopener" target="_blank">#にるぷれ</a><span> : 傘 / King Gnu (CEREMONY)<br></span><a href="https://open.spotify.com/track/4Rbe954EM88dRNqZEws0rT" rel="nofollow noopener" target="_blank">https://open.spotify.com/track/4Rbe954EM88dRNqZEws0rT</a></p>',
	reblog: null,
	application: { name: 'Web', website: null },
	account: mockAcctEntity,
	media_attachments: [
		{
			id: '115695256074841272',
			type: 'image',
			url: 'https://wsb.hostdon.ne.jp/mastodon_10834/cache/media_attachments/files/115/695/256/074/841/272/original/7ffd20a5972980c5.png',
			preview_url: 'https://wsb.hostdon.ne.jp/mastodon_10834/cache/media_attachments/files/115/695/256/074/841/272/small/7ffd20a5972980c5.png',
			remote_url: 'https://sacred.harpy.faith/media/7907e7adc51b70851fafea61ffb1c969fd44f60c7e8ab7356d645329359f5856.png',
			text_url: null,
			meta: {
				original: {
					width: 402,
					height: 952,
					size: '402x952',
					aspect: 0.4222689075630252
				},
				small: {
					width: 312,
					height: 739,
					size: '312x739',
					aspect: 0.42219215155615697
				}
			},
			description: null,
			blurhash: 'UJN^e:%Mt7t7~qRjj[RjayRjay-;oft7t7WB'
		},
		{
			id: '115695256074841273',
			type: 'video',
			url: 'https://wsb.hostdon.ne.jp/mastodon_10834/cache/media_attachments/files/115/695/256/074/841/272/original/7ffd20a5972980c5.png',
			preview_url: 'https://wsb.hostdon.ne.jp/mastodon_10834/cache/media_attachments/files/115/695/256/074/841/272/small/7ffd20a5972980c5.png',
			remote_url: 'https://sacred.harpy.faith/media/7907e7adc51b70851fafea61ffb1c969fd44f60c7e8ab7356d645329359f5856.png',
			text_url: null,
			meta: {
				original: {
					width: 402,
					height: 952,
					size: '402x952',
					aspect: 0.4222689075630252
				},
				small: {
					width: 312,
					height: 739,
					size: '312x739',
					aspect: 0.42219215155615697
				}
			},
			description: null,
			blurhash: 'UJN^e:%Mt7t7~qRjj[RjayRjay-;oft7t7WB'
		}
	],
	mentions: [],
	tags: [],
	emojis: [],
	card: null,
	poll: null,
	quote_approval: { automatic: ['public'], manual: [], current_user: 'automatic' },
	plain_content: null,
	emoji_reactions: [],
	quote: false
}

export const statusMockQuote: Entity.Status = {
	id: '115624723318246319',
	created_at: '2025-11-28T01:27:43.524Z',
	in_reply_to_id: null,
	in_reply_to_account_id: null,
	sensitive: false,
	spoiler_text: '',
	visibility: 'public',
	language: 'ja',
	uri: 'https://6m.cutls.dev/users/cutls/statuses/115624723318246319',
	url: 'https://6m.cutls.dev/@cutls/115624723318246319',
	replies_count: 0,
	reblogs_count: 0,
	favourites_count: 0,
	quotes_count: 0,
	edited_at: null,
	favourited: false,
	reblogged: false,
	muted: false,
	bookmarked: false,
	pinned: false,
	content:
		'\u003cp class="quote-inline"\u003eRE: \u003ca href="https://6m.cutls.dev/@cutls/115624617939463108" target="_blank" rel="nofollow noopener" translate="no"\u003e\u003cspan class="invisible"\u003ehttps://\u003c/span\u003e\u003cspan class="ellipsis"\u003e6m.cutls.dev/@cutls/1156246179\u003c/span\u003e\u003cspan class="invisible"\u003e39463108\u003c/span\u003e\u003c/a\u003e\u003c/p\u003e\u003cp\u003e訳としては、今日インストールしたiOSクライアントが微妙だったということになります\u003c/p\u003e',
	reblog: null,
	application: { name: 'Web', website: null },
	account: mockAcctEntity,
	media_attachments: [],
	mentions: [],
	tags: [],
	emojis: [],
	quote_status_state: 'blocked_account',
	quote_status: {
		id: '115624617939463108',
		created_at: '2025-11-28T01:00:55.570Z',
		in_reply_to_id: null,
		in_reply_to_account_id: null,
		sensitive: false,
		spoiler_text: '',
		visibility: 'public',
		language: 'ja',
		uri: 'https://6m.cutls.dev/users/cutls/statuses/115624617939463108',
		url: 'https://6m.cutls.dev/@cutls/115624617939463108',
		replies_count: 1,
		reblogs_count: 0,
		favourites_count: 1,
		quotes_count: 1,
		edited_at: null,
		favourited: false,
		reblogged: false,
		muted: false,
		bookmarked: false,
		pinned: false,
		content: '\u003cp\u003e絶対にTootDeskを復活させてまともなiOSクライアントを作成する決意であります\u003c/p\u003e',
		reblog: null,
		application: { name: 'SubwayTooter', website: null },
		account: {
			id: '115469566062452004',
			username: 'cutls',
			acct: 'cutls',
			display_name: 'cutls',
			locked: false,
			bot: false,
			discoverable: true,
			group: false,
			created_at: '2025-10-31T00:00:00.000Z',
			note: '\u003cp\u003eDev of TheDesk\u003cbr /\u003e今までにたくさんのサーバー(約4つの自鯖)を破壊し連合に迷惑をかけてきましたが、今回はHostdonを利用しているので大丈夫です。よろしくお願いします。\u003c/p\u003e',
			url: 'https://6m.cutls.dev/@cutls',
			avatar: 'https://wsb.hostdon.ne.jp/mastodon_10834/accounts/avatars/115/469/566/062/452/004/original/ef676dd6b86758a7.png',
			avatar_static: 'https://wsb.hostdon.ne.jp/mastodon_10834/accounts/avatars/115/469/566/062/452/004/original/ef676dd6b86758a7.png',
			header: 'https://6m.cutls.dev/headers/original/missing.png',
			header_static: 'https://6m.cutls.dev/headers/original/missing.png',
			followers_count: 31,
			following_count: 68,
			statuses_count: 91,
			noindex: false,
			emojis: [],
			fields: [
				{
					name: 'TheDesk',
					value:
						'\u003ca href="https://thedesk.top" target="_blank" rel="nofollow noopener me" translate="no"\u003e\u003cspan class="invisible"\u003ehttps://\u003c/span\u003e\u003cspan class=""\u003ethedesk.top\u003c/span\u003e\u003cspan class="invisible"\u003e\u003c/span\u003e\u003c/a\u003e',
					verified_at: null
				},
				{
					name: 'About',
					value:
						'→ \u003ca href="https://cutls.dev" target="_blank" rel="nofollow noopener me" translate="no"\u003e\u003cspan class="invisible"\u003ehttps://\u003c/span\u003e\u003cspan class=""\u003ecutls.dev\u003c/span\u003e\u003cspan class="invisible"\u003e\u003c/span\u003e\u003c/a\u003e',
					verified_at: null
				}
			],
			suspended: null,
			limited: null,
			moved: null
		},
		media_attachments: [],
		mentions: [],
		tags: [],
		emojis: [],
		quote: false,
		card: null,
		poll: null,
		quote_approval: { automatic: ['public'], manual: [], current_user: 'automatic' },
		plain_content: null,
		emoji_reactions: []
	},
	card: null,
	poll: null,
	quote_approval: { automatic: ['public'], manual: [], current_user: 'automatic' },
	plain_content: null,
	emoji_reactions: [],
	quote: false
}
