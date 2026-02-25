import type { Account } from '@/entities/account'
import type React from 'react'
import { useRef } from 'react'
import { StyleSheet } from 'react-native'

import RNBottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import { GlassView } from 'expo-glass-effect'
import Acct from '../composer/Acct'

interface Props {
	change: (acct: Account) => void
	isOpened: boolean
	setIsOpened: (v: boolean) => void
}

const GlassViewCustom = (props: React.ComponentProps<typeof GlassView>) => <GlassView {...props} style={[props.style, { borderRadius: 20 }]} />
export default function AcctSelector({ change, isOpened, setIsOpened }: Props) {
	const bottomSheetRef = useRef<RNBottomSheet>(null)
	if (!isOpened) return
	return (
		<RNBottomSheet
			handleComponent={null}
			keyboardBlurBehavior="none"
			detached={true}
			ref={bottomSheetRef}
			onChange={(e) => setIsOpened(e !== -1)}
			style={{ zIndex: 5 }}
			backgroundComponent={GlassViewCustom}
			enableBlurKeyboardOnGesture={true}
			backdropComponent={(props) => <BottomSheetBackdrop {...props} opacity={0.5} onPress={() => bottomSheetRef.current?.close()} disappearsOnIndex={-1} />}
		>
			<BottomSheetView style={styles.contentContainer}>
				<Acct
					change={(r) => {
						bottomSheetRef.current?.close()
                        setIsOpened(false)
						change(r)
					}}
				/>
			</BottomSheetView>
		</RNBottomSheet>
	)
}
const styles = StyleSheet.create({
	contentContainer: {
		backgroundColor: 'transparent',
		padding: 10,
		zIndex: 5
	}
})
