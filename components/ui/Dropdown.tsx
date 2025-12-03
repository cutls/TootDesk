import { ContextMenu, Host, Button as SwiftButton, type ButtonProps, type ContextMenuProps, type HostProps } from '@expo/ui/swift-ui'
import type React from 'react'
import { useTranslation } from 'react-i18next'

interface Props extends ContextMenuProps {
	style?: HostProps['style']
	data: {
		title: string
		systemImage: ButtonProps['systemImage']
	}[]
	onSelect: (title: string) => void
}
export function Dropdown({ style, children, data, onSelect, ...props }: Props) {
	const { t } = useTranslation()
	return (
		<Host style={style}>
			<ContextMenu activationMethod="singlePress" {...props}>
				<ContextMenu.Items>
					{data.map((item) => (
						<SwiftButton key={item.title} systemImage={item.systemImage} onPress={() => onSelect(item.title)}>
							{t(item.title)}
						</SwiftButton>
					))}
				</ContextMenu.Items>
				<ContextMenu.Trigger>{children}</ContextMenu.Trigger>
			</ContextMenu>
		</Host>
	)
}
