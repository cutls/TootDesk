import type { ComposeMode } from '@/utils/type'
import DateTimePicker from '@react-native-community/datetimepicker'
import { addMinutes, compareAsc, parseISO } from 'date-fns'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformColor, StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native'
import { Text } from '../themed/Text'
import { CustomedButton } from '../ui/CustomedButton'

interface Props {
	changeMode: (m: ComposeMode) => void
	addSchedule: (date: Date | null) => void
    defaultSchedule?: string | null
}
export default function Schedule({ changeMode, addSchedule, defaultSchedule }: Props) {
	const { t } = useTranslation()
	const { width } = useWindowDimensions()
	const styles = createStyles({ width })
	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	const textColor = PlatformColor('label')
	const [date, setDate] = useState(defaultSchedule ? parseISO(defaultSchedule) : addMinutes(new Date(), 5))
	const isInvalid = compareAsc(date, addMinutes(new Date(), 4)) === -1
	return (
		<View style={styles.container}>
            <Text style={styles.title}>{t('composer.menu.schedule')}</Text>
			<DateTimePicker testID="dateTimePicker" value={date} mode="datetime" onChange={(_e, d) => setDate(d || new Date())} />
				<View style={[styles.invalid, { opacity: isInvalid ? 1 : 0 }]}>
					<Text style={{ color: 'white' }}>{t('composer.schedule.invalid')}</Text>
				</View>
			<View>
				<CustomedButton isPrimary={true} onPress={() => addSchedule(isInvalid ? null : date)}>
					{t('ok')}
				</CustomedButton>
				<CustomedButton style={{ marginTop: 10 }} onPress={() => changeMode('compose')}>
					{t('cancel')}
				</CustomedButton>
				{defaultSchedule && <CustomedButton  color="red" style={{ marginTop: 10 }} onPress={() => addSchedule(null)}>
					{t('composer.remove')}
				</CustomedButton>}
			</View>
		</View>
	)
}
const createStyles = ({ width }: { width: number }) =>
	StyleSheet.create({
        title: {
            fontSize: 20,
            fontWeight: '600',
            marginBottom: 20,
        },
        invalid: {
            backgroundColor: PlatformColor('systemRed'),
            padding: 10,
            borderRadius: 8
        },
		container: { 
            minHeight: 250,
            display: 'flex',
            justifyContent: 'space-between'
         }
	})
