import type { Poll as IPoll } from '@/entities/status'
import type { ComposeMode } from '@/utils/type'
import { Button as SwiftButton } from '@expo/ui/swift-ui'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformColor, StyleSheet, Switch, TextInput, useColorScheme, useWindowDimensions, View } from 'react-native'
import { Text } from '../themed/Text'
import { Button } from '../ui/Button'
import { CustomedButton } from '../ui/CustomedButton'
import { Dropdown } from '../ui/Dropdown'

interface Props {
	changeMode: (m: ComposeMode) => void
	addPoll: (poll: IPoll | null) => void
	defaultPoll: IPoll | null
}
const expiresList = [
	{ title: 'composer.poll.5min', value: '300' },
	{ title: 'composer.poll.30min', value: '1800' },
	{ title: 'composer.poll.1h', value: '3600' },
	{ title: 'composer.poll.6h', value: '21600' },
	{ title: 'composer.poll.1d', value: '86400' },
	{ title: 'composer.poll.3d', value: '259200' },
	{ title: 'composer.poll.7d', value: '604800' }
]
export default function Poll({ changeMode, addPoll, defaultPoll }: Props) {
	const { t } = useTranslation()
	const { width } = useWindowDimensions()
	const styles = createStyles({ width })
	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	const textColor = PlatformColor('label')
	const [options, setOptions] = useState<Array<string>>(defaultPoll?.options || ['', ''])
	const [expires, setExpires] = useState(defaultPoll?.expires_in || 300) // default 1 day
	const [isMultiple, setIsMultiple] = useState(defaultPoll?.multiple || false)
	const [hideTotals, setHideTotals] = useState(defaultPoll?.hide_totals || false)
	const [optionMenu, setOptionMenu] = useState(false)
	const makeAddPoll = () => {
		const poll: IPoll = {
			options: options,
			expires_in: expires,
			multiple: isMultiple,
			hide_totals: hideTotals
		}
		addPoll(poll)
	}
	return (
		<View style={styles.container}>
			<Text style={styles.title}>{t('composer.menu.poll')}</Text>
			{options.map((opt, idx) => (
				<View key={`${idx}${opt}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
					<TextInput
						value={opt}
						onChangeText={(t) => {
							const newOpts = [...options]
							newOpts[idx] = t
							setOptions(newOpts)
						}}
						style={[styles.input, { flexGrow: 1 }]}
						placeholder={`${t('composer.poll.option')}${idx + 1}`}
						placeholderTextColor={isDark ? 'lightgray' : 'gray'}
					/>
					<Button
						style={{ width: 50, height: 50 }}
						disabled={options.length === 2}
						onPress={() => setOptions((o) => o.filter((_a, i) => i !== idx))}
						color="red"
						variant="bordered"
						systemImage="xmark"
					></Button>
				</View>
			))}
			<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
				<Button style={{ width: 100, height: 50 }} onPress={() => setOptionMenu(!optionMenu)} variant="bordered">
					{t('composer.poll.config')}
				</Button>
				<Dropdown data={expiresList} onSelect={(v) => setExpires(parseInt(v, 10))} modifiers={[]} style={{ width: 100, height: 50 }}>
					<SwiftButton variant="bordered" systemImage="clock">
						{t(expiresList.find((s) => s.value === expires.toString())?.title || '')}
					</SwiftButton>
				</Dropdown>
				<Button style={{ width: 100, height: 50 }} disabled={options.length === 4} onPress={() => setOptions((o) => [...o, ''])} variant="bordered" systemImage="plus">
					{t('composer.poll.addOption')}
				</Button>
			</View>
			{optionMenu && (
				<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
					<Text>{t('composer.poll.multiple')}</Text>
					<Switch value={isMultiple} onValueChange={(v) => setIsMultiple(v)} />
				</View>
			)}
			{optionMenu && (
				<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 }}>
					<Text>{t('composer.poll.hideTotals')}</Text>
					<Switch value={hideTotals} onValueChange={(v) => setHideTotals(v)} />
				</View>
			)}
			<View>
				<CustomedButton isPrimary={true} onPress={() => makeAddPoll()}>
					{t('ok')}
				</CustomedButton>
				<CustomedButton style={{ marginTop: 10 }} onPress={() => changeMode('compose')}>
					{t('cancel')}
				</CustomedButton>
				{defaultPoll && (
					<CustomedButton style={{ marginTop: 10 }} color="red" onPress={() => addPoll(null)}>
						{t('composer.remove')}
					</CustomedButton>
				)}
			</View>
		</View>
	)
}
const createStyles = ({ width }: { width: number }) =>
	StyleSheet.create({
		title: {
			fontSize: 20,
			fontWeight: '600',
			marginBottom: 20
		},
		input: {
			padding: 15,
			borderRadius: 10,
			backgroundColor: PlatformColor('systemGray5')
		},
		container: {
			minHeight: 350,
			display: 'flex',
			justifyContent: 'space-between'
		}
	})
