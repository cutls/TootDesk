/*
  Waseef Shawkat<awshawka12@gmail.com> (http://awshawka.github.io)
  MIT LICENSE: git+https://github.com/awshawka/react-native-double-click.git
*/
import React, { Component } from 'react'
import { TouchableOpacity, ViewProps, PanResponder, View, Animated } from 'react-native'

interface PropsProp extends ViewProps {
	singleTap?: () => void
	swipeUp?: () => void
	children?: JSX.Element
}

export default class DoubleTap extends Component {
	props: PropsProp
	state: any

	constructor(props: any) {
		super(props)
		const position = new Animated.ValueXY()
		const panResponder = PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onPanResponderMove: (event, gesture) => {
				if (gesture.dy > -20 && gesture.dy < 0) {
					position.setValue({ x: 0, y: gesture.dy })
				}
			},
			onPanResponderRelease: (event, gesture) => {
				if (gesture.dy < -20) {
					this.props.swipeUp ? this.props.swipeUp() : null
				} else {
					this.props.singleTap ? this.props.singleTap() : null
				}
				position.setValue({ x: 0, y: 0 })
			},
		})
		this.state = { panResponder, position }
	}

	render() {
		const { style, ...otherProps } = this.props
		let handles = this.state.panResponder.panHandlers

		return (
			<View style={[style]} {...handles} {...otherProps}>
				<Animated.View style={this.state.position.getLayout()}>{this.props.children}</Animated.View>
			</View>
		)
	}
}
