import { staticStyles } from "@/utils/theme";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useState } from "react";

export const TextInputMulti = ({ onBlur, placeholder, isDark, defaultValue, ref }: { onBlur: (value: string) => void; placeholder: string; isDark: boolean; defaultValue: string; ref?: any }) => {
    const [value, setValue] = useState(defaultValue)
    return (
        <BottomSheetTextInput
            ref={ref}
            value={value}
            onChangeText={(t) => setValue(t)}
            onBlur={() => onBlur(value)}
            style={[staticStyles.input, { flexGrow: 1, color: isDark ? 'white' : 'black', textAlignVertical: 'top' }]}
            placeholder={placeholder}
            placeholderTextColor={isDark ? 'lightgray' : 'gray'}
        />
    )
}
