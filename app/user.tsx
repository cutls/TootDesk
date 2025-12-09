import Avatar from '@/components/Avatar'
import { Followed } from '@/components/relations/Followed'
import { Following } from '@/components/relations/Following'
import { FollowingFollowed } from '@/components/relations/FollowingFollowed'
import { FollowingRequested } from '@/components/relations/FollowingRequested'
import { Requested } from '@/components/relations/Requested'
import { Requesting } from '@/components/relations/Requesting'
import { RequestingFollowed } from '@/components/relations/RequestingFollowed'
import { RequestingRequested } from '@/components/relations/RequestingRequested'
import RelationSheet from '@/components/RelationSheet'
import { AccountName } from '@/components/status/AccountName'
import { ProfileText } from '@/components/status/ProfileText'
import { Text } from '@/components/themed/Text'
import { Button } from '@/components/ui/Button'
import { getAcctById } from '@/utils/storage'
import generator, { type Entity, type MegalodonInterface } from '@cutls/megalodon'
import { GlassView } from 'expo-glass-effect'
import { Image } from 'expo-image'
import * as Linking from 'expo-linking'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, type OpaqueColorValue, PlatformColor, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const BasePerson = ({ relation: r, textColor }: { relation: Entity.Relationship; textColor: OpaqueColorValue }) => {
	if (r.blocked_by || r.blocking) return <SymbolView name="person.slash.fill" type="monochrome" tintColor={textColor} size={20} />
	if (r.muting) return <SymbolView name="person.badge.minus" type="monochrome" tintColor={textColor} size={20} />
	return <SymbolView name="person" type="monochrome" tintColor={textColor} size={20} />
}
const Relation = ({ relation: r, textColor }: { relation: Entity.Relationship; textColor: OpaqueColorValue }) => {
	if (r.blocking && r.blocked_by) return <FollowingFollowed />
	if (r.blocking && !r.blocked_by) return <Following />
	if (!r.blocking && r.blocked_by) return <Followed />
	if (r.followed_by && r.following) return <FollowingFollowed />
	if (r.requested_by && r.following) return <FollowingRequested />
	if (r.requested && r.followed_by) return <RequestingFollowed />
	if (r.requested && r.requested_by) return <RequestingRequested />
	if (r.requested_by) return <Requested />
	if (r.requested) return <Requesting />
	if (r.following) return <Following />
	if (r.followed_by) return <Followed />
	return <SymbolView name="circle.dashed" type="monochrome" tintColor={textColor} size={20} />
}
export default function Index() {
	const { t } = useTranslation()

	const router = useRouter()
	const params = useLocalSearchParams()
	const { acctId, userId } = params as Record<'acctId' | 'userId', string>
	const { width } = useWindowDimensions()
	const styles = createStyles({ width })
	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	const textColor = PlatformColor('label')
	const [client, setClient] = useState<MegalodonInterface | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [basic, setBasic] = useState<Entity.Account | null>(null)
	const [relation, setRelation] = useState<Entity.Relationship | null>(null)
	const [rSheet, setRSheet] = useState(false)
	const verifiedBg = isDark ? '#083416' : '#d2e2d7'
	const updateRelation = async () => {
		if (!client) return
		const r = await client.getRelationship(userId)
		setRelation(r.data)
	}
	useEffect(() => {
		const fn = async () => {
			setIsLoading(true)
			try {
				const acct = await getAcctById(Number(acctId))
				if (!acct) throw new Error('Invalid account id')
				const https = `https://${acct.domain}`
				const client = generator(acct.sns, https, acct.accessToken)
				setClient(client)
				const d = await client.getAccount(userId)
				setBasic(d.data)
				const r = await client.getRelationship(userId)
				setRelation(r.data)
			} finally {
				setIsLoading(false)
			}
		}
		fn()
	}, [acctId, userId])
	if (isLoading || !basic) {
		return (
			<SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
				<ActivityIndicator />
			</SafeAreaView>
		)
	}
	return (
		<ScrollView style={{}}>
			<View style={{ position: 'absolute', paddingHorizontal: 10, marginTop: 20, zIndex: 2, paddingTop: 20, justifyContent: 'space-between', flexDirection: 'row', width: width }}>
				<Button variant="glass" onPress={() => router.back()} style={{ width: 45, height: 45 }}>
					<SymbolView name="chevron.left" type="monochrome" tintColor={textColor} size={1} />
				</Button>
				{relation && (
					<Button variant="glass" onPress={() => setRSheet(true)} style={{ width: 80, height: 45 }}>
						<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: 50 }}>
							<BasePerson relation={relation} textColor={textColor} />
							<Relation relation={relation} textColor={textColor} />
						</View>
					</Button>
				)}
			</View>
			<Image style={styles.header} source={{ uri: basic.header }} />
			<GlassView style={styles.infoBar}>
				<View style={{ width: 80, justifyContent: 'center', alignItems: 'center' }}>
					<Avatar src={basic.avatar} size={80} />
				</View>

				<View style={{ marginLeft: 5 }}>
					<AccountName account={basic} fontSize={24} width={width - 145} />
					<TouchableOpacity style={{ display: 'flex', flexDirection: 'row', marginVertical: 5 }} onPress={() => Linking.openURL(basic.url)}>
						<Text style={{}}>@{basic.acct}</Text>
						{basic.locked && <SymbolView name="lock" type="monochrome" tintColor={textColor} size={16} />}
					</TouchableOpacity>
					<View style={{ display: 'flex', flexDirection: 'row' }}>
						<View style={{ width: (width - 145) / 3 }}>
							<Text numberOfLines={1} style={{ textAlign: 'center' }}>
								{t('user.posts')}
							</Text>
							<Text numberOfLines={1} style={{ fontWeight: 'bold', textAlign: 'center' }}>
								{basic.statuses_count.toLocaleString()}
							</Text>
						</View>
						<View style={{ width: (width - 145) / 3 }}>
							<Text numberOfLines={1} style={{ textAlign: 'center' }}>
								{t('user.follows')}
							</Text>
							<Text numberOfLines={1} style={{ fontWeight: 'bold', textAlign: 'center' }}>
								{basic.following_count.toLocaleString()}
							</Text>
						</View>
						<View style={{ width: (width - 145) / 3 }}>
							<Text numberOfLines={1} style={{ textAlign: 'center' }}>
								{t('user.followers')}
							</Text>
							<Text numberOfLines={1} style={{ fontWeight: 'bold', textAlign: 'center' }}>
								{basic.followers_count.toLocaleString()}
							</Text>
						</View>
					</View>
				</View>
			</GlassView>
			<View style={{ padding: 10 }}>
				<ProfileText account={basic} width={width - 20} fontSize={14} />
				{basic.fields.map((field, idx) => (
					<View
						key={`${field.name}-${idx}`}
						style={{
							padding: 5,
							display: 'flex',
							flexDirection: 'row',
							alignItems: 'center',
							backgroundColor: field.verified ? verifiedBg : undefined,
							borderTopLeftRadius: idx === 0 ? 10 : 0,
							borderTopRightRadius: idx === 0 ? 10 : 0,
							borderBottomLeftRadius: idx === basic.fields.length - 1 ? 10 : 0,
							borderBottomRightRadius: idx === basic.fields.length - 1 ? 10 : 0
						}}
					>
						<Text style={{ fontWeight: 'bold', width: 100 }} numberOfLines={2}>
							{field.name}
						</Text>
						<ProfileText account={{ ...basic, note: field.value }} width={width - 120} fontSize={14} />
					</View>
				))}
			</View>
			{client && relation && <RelationSheet locked={basic.locked} isOpened={rSheet} setIsOpened={setRSheet} update={() => updateRelation()} client={client} relation={relation} targetId={userId} />}
		</ScrollView>
	)
}
const createStyles = ({ width }: { width: number }) =>
	StyleSheet.create({
		header: {
			width: width,
			height: 300
		},
		infoBar: {
			position: 'absolute',
			flexDirection: 'row',
			display: 'flex',
			padding: 10,
			top: 180,
			height: 110,
			left: 20,
			borderRadius: 20
		}
	})
