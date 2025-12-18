import type { Entity, MegalodonInterface } from '@cutls/megalodon'
import { ja } from 'date-fns/locale'
import React from 'react'
import { PlatformColor, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native'
import { Text } from '../themed/Text'

import { formatDistanceToNow } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { defaultHTMLElementModels, HTMLContentModel } from 'react-native-render-html'
import { PollOption } from './PollOption'
const renderers = {
	img: defaultHTMLElementModels.img.extend({
		contentModel: HTMLContentModel.mixed
	})
}

type IConfig = {}
interface IProps {
	client: MegalodonInterface
	status: Entity.Status
	emojis: Entity.Emoji[]
	columnWidth: number
	config: IConfig
	//openFromOtherAccount: (status: Entity.Status) => void
	lang: 'ja' | 'en'
	isMe: boolean
	updateStatus: (newStatus: Entity.Status | null, deleteId?: string) => void
}
export const Poll = (props: IProps) => {
	const { columnWidth, lang, isMe, emojis, client, updateStatus, status } = props
	const poll = status.poll || { id: '', options: [], expired: true, multiple: false, votes_count: 0, voters_count: 0, voted: false, expires_at: null }
	const { t } = useTranslation()
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const styles = createStyles({ width: columnWidth })
	const locale = lang === 'ja' ? ja : undefined
	const fromNow = formatDistanceToNow(poll.expires_at ? new Date(poll.expires_at) : new Date(), { addSuffix: true, locale })
	const fontSize = 16
	const left = 20
	const totalVotes = poll.voters_count || poll.votes_count
	const [choiceds, setChoiceds] = React.useState<number[]>([])
	const choice = async (i: number) => {
		if (poll.multiple) {
			if (choiceds.includes(i)) {
				setChoiceds(choiceds.filter((c) => c !== i))
			} else {
				setChoiceds([...choiceds, i])
			}
		} else {
			const newPoll = await client.votePoll(poll.id, [i])
			updateStatus({ ...status, poll: newPoll.data })
		}
	}
	const vote = async () => {
		if (choiceds.length === 0) return
		const newPoll = await client.votePoll(poll.id, choiceds)
		updateStatus({ ...status, poll: newPoll.data })
	}
	if (poll.expired || poll.voted || isMe) {
		return (
			<View style={styles.container}>
				{poll.options.map((opt, idx) => {
					const percentage = totalVotes > 0 ? ((opt.votes_count || 0) / totalVotes) * 100 : 0
					return (
						<View key={opt.title + idx.toString()} style={[{ marginBottom: 10 }]}>
							<PollOption text={opt.title} emojis={emojis} width={columnWidth - left} fontSize={fontSize} />
							<View style={{ height: 20, backgroundColor: isDark ? '#444' : '#ddd', borderRadius: 4, overflow: 'hidden' }}>
								<View style={{ width: `${percentage}%`, height: '100%', backgroundColor: PlatformColor('systemBlue') }} />
							</View>
							<Text style={{ marginTop: 5 }}>{`${opt.votes_count || 0} ${t('timeline.poll.votes')} (${percentage.toFixed(1)}%)`}</Text>
						</View>
					)
				})}
				<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
					<Text>{`${totalVotes} ${t('timeline.poll.votes')}`}</Text>
					<TouchableOpacity
						activeOpacity={0.7}
						onPress={async () => {
							const newPoll = await client.getPoll(poll.id)
							updateStatus({ ...status, poll: newPoll.data })
						}}
					>
						<Text>{poll.expired ? t('timeline.poll.finished', { time: fromNow }) : t('timeline.poll.left', { time: fromNow })}</Text>
					</TouchableOpacity>
				</View>
			</View>
		)
	}
	return (
		<View style={styles.container}>
			{poll.options.map((opt, idx) => {
				return (
					<TouchableOpacity
						activeOpacity={0.7}
						key={opt.title + idx.toString()}
						style={[styles.option, choiceds.includes(idx) ? { borderColor: PlatformColor('systemBlue'), borderWidth: 2 } : {}]}
						onPress={() => choice(idx)}
					>
						<PollOption text={opt.title} emojis={emojis} width={columnWidth - left} fontSize={fontSize} />
					</TouchableOpacity>
				)
			})}
			{poll.multiple && (
				<View>
					<TouchableOpacity activeOpacity={0.7} style={[styles.vote]} onPress={() => vote()}>
						<Text style={{ fontSize: fontSize, fontWeight: 'bold', textAlign: 'center' }}>{t('timeline.poll.vote')}</Text>
					</TouchableOpacity>
				</View>
			)}
			<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
				<Text>
					[{poll.multiple ? t('timeline.poll.multiple') : t('timeline.poll.single')}] {`${totalVotes || '?'} ${t('timeline.poll.votes')}`}
				</Text>
				<Text>{poll.expired ? t('timeline.poll.finished', { time: fromNow }) : t('timeline.poll.left', { time: fromNow })}</Text>
			</View>
		</View>
	)
}

const createStyles = ({ width }: { width: number }) =>
	StyleSheet.create({
		container: {},
		option: {
			width: width,
			padding: 5,
			borderWidth: 1,
			borderColor: PlatformColor('systemGray3'),
			borderRadius: 8,
			marginTop: 5
		},
		vote: {
			width: 100,
			padding: 5,
			backgroundColor: PlatformColor('systemTeal'),
			borderRadius: 8,
			marginVertical: 10
		}
	})
