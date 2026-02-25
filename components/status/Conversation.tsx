import type { Entity, MegalodonInterface } from '@cutls/megalodon'
import React from 'react'
import { PlatformColor, StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native'

import type { Account } from '@/entities/account'
import type { Settings } from '@/entities/settings'
import { Link, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import Avatar from '../Avatar'
import { Text } from '../themed/Text'
import { Status } from './Status'

type IConfig = Settings['timeline']
interface IProps {
	status: Entity.Conversation
	client: MegalodonInterface
	acct: Account
	columnWidth: number
	config: IConfig
	//openFromOtherAccount: (status: Entity.Status) => void
	filters: Array<Entity.Filter>
	lang: 'ja' | 'en'
	updateStatus: (newStatus: Entity.Status | null, deleteId?: string) => void
	composeAction: (client: MegalodonInterface, account: Account, type: 'quote' | 'reply' | 'edit', target: Entity.Status) => void
}
export const Conversation = (props: IProps) => {
	const { status: conversation, client, columnWidth, lang, updateStatus, acct, composeAction, filters, config } = props
	const { t } = useTranslation()
	const { width } = useWindowDimensions()
	const router = useRouter()
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const txtColor = isDark ? 'white' : 'black'
	const showAnimation = config.animation === 'yes'
	if (conversation.last_status) {
		return (
			<>
				{conversation.accounts.length > 0 && (
					<View style={{ flexDirection: 'row', marginVertical: 5, marginLeft: 2, width: width - 10 }}>
						<Text style={{ marginLeft: 2 }}>{t('timeline.member')}</Text>
						<Link href={`/user?acctId=${acct.id}&userId=${conversation.accounts[0].id}`} push>
							<Link.Preview style={{ backgroundColor: PlatformColor('systemBackground') }} />
							<Link.Trigger>
								<View style={{ flexDirection: 'row' }}>
									<Avatar size={16} src={showAnimation ? conversation.accounts[0].avatar : conversation.accounts[0].avatar_static} />
									<Text style={{ marginLeft: 2 }}>{conversation.accounts[0].display_name || conversation.accounts[0].acct || ''}</Text>
								</View>
							</Link.Trigger>
						</Link>
						{conversation.accounts.length > 1 && <Text style={{ marginLeft: 2 }}>{t('timeline.conversationMore', { count: conversation.accounts.length - 1 })}</Text>}
					</View>
				)}
				<Status
					status={conversation.last_status}
					client={client}
					columnWidth={columnWidth}
					lang={lang}
					updateStatus={updateStatus}
					acct={acct}
					composeAction={composeAction}
					config={config}
					filters={filters}
				/>
			</>
		)
	}
	return null
}

const createStyles = ({ width }: { width: number }) => StyleSheet.create({})
