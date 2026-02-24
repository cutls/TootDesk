import { Text } from '@/components/themed/Text'
import type { Account } from '@/entities/account'
import type { Entity } from '@cutls/megalodon'
import { View } from 'react-native'
import { G, Path, Svg } from 'react-native-svg'
export const Tag = ({ acct, columnWidth, txtColor, tag }: { acct: Account; columnWidth: number; txtColor: string; tag: Entity.Tag }) => {
	return (
		<View style={{ flexDirection: 'row', padding: 5, alignItems: 'center', width: columnWidth }}>
			<View style={{ width: columnWidth - 50, marginLeft: 5 }}>
				<Text style={{ color: txtColor, fontSize: 18 }}>#{tag.name}</Text>
			</View>
			<GraphDraw his={tag.history} />
		</View>
	)
}
export function GraphDraw({ his }: { his: Entity.Tag['history'] }) {
	if (!his || !his[0]?.uses) return null
	const max = Math.max.apply(null, [
		parseInt(his[0].uses.toString(), 10),
		parseInt(his[1].uses.toString(), 10),
		parseInt(his[2].uses.toString(), 10),
		parseInt(his[3].uses.toString(), 10),
		parseInt(his[4].uses.toString(), 10),
		parseInt(his[5].uses.toString(), 10),
		parseInt(his[6].uses.toString(), 10)
	])
	const six = (50 - (parseInt(his[6].uses.toString(), 10) / max) * 50) || 50
	const five = (50 - (parseInt(his[5].uses.toString(), 10) / max) * 50) || 50
	const four = (50 - (parseInt(his[4].uses.toString(), 10) / max) * 50) || 50
	const three = (50 - (parseInt(his[3].uses.toString(), 10) / max) * 50) || 50
	const two = (50 - (parseInt(his[2].uses.toString(), 10) / max) * 50) || 50
	const one = (50 - (parseInt(his[1].uses.toString(), 10) / max) * 50) || 50
	const zero = (50 - (parseInt(his[0].uses.toString(), 10) / max) * 50) || 50
	const ratio = 30 / 25
	const height = 40
	return (
		<Svg viewBox="0 0 60 50" width={height * ratio} height={height}>
			<G>
				<Path d={`M0,${six} L10,${five} 20,${four} 30,${three} 40,${two} 50,${one} 60,${zero} 61,61 0,61`} stroke="#0f8c0c" fill="rgba(13,113,19,.25)" strokeWidth={1}></Path>
			</G>
		</Svg>
	)
}
