import { Host, Button as SwiftButton, type ButtonProps, type HostProps } from '@expo/ui/swift-ui'
import type React from 'react'

interface Props extends ButtonProps {
    style?: HostProps['style']
}
export function Button({ style, ...props }: Props) {
	return (
		<Host style={style}>
			<SwiftButton {...props} />
		</Host>
	)
}
