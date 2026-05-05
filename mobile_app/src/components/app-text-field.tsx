import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AppColors } from '@/constants/theme';

type AppTextFieldProps = {
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'phone-pad';
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder?: string;
  value: string;
};

export default function AppTextField({
  keyboardType = 'default',
  label,
  multiline = false,
  onChangeText,
  placeholder,
  value,
}: AppTextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={AppColors.textSecondary}
        style={[styles.input, multiline && styles.multiline]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    color: AppColors.sky,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: AppColors.field,
    borderColor: AppColors.border,
    borderRadius: 18,
    borderWidth: 1,
    color: AppColors.white,
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: 16,
  },
  multiline: {
    minHeight: 92,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
});
