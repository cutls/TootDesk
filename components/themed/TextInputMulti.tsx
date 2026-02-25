import { staticStyles } from "@/utils/theme";
import { useState } from "react";
import { TextInput } from "react-native";

export const TextInputMulti = ({ onBlur, placeholder, isDark, defaultValue }: { onBlur: (value: string) => void; placeholder: string; isDark: boolean; defaultValue: string }) => {
    const [value, setValue] = useState(defaultValue)
    return (
        <TextInput
            value={value}
            onChangeText={(t) => setValue(t)}
            onBlur={() => onBlur(value)}
            style={[staticStyles.input, { flexGrow: 1, color: isDark ? 'white' : 'black', textAlignVertical: 'top' }]}
            placeholder={placeholder}
            placeholderTextColor={isDark ? 'lightgray' : 'gray'}
        />
    )
}
