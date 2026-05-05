import { Pressable, StyleSheet, Text, View } from 'react-native';

import AppTextField from '@/src/components/app-text-field';
import { AppColors } from '@/constants/theme';
import type { CourseDetail } from '@/src/types/invoice';

type CourseRowEditorProps = {
  index: number;
  onChange: (index: number, field: keyof CourseDetail, value: string) => void;
  onRemove: (index: number) => void;
  row: CourseDetail;
  showRemove: boolean;
};

export default function CourseRowEditor({
  index,
  onChange,
  onRemove,
  row,
  showRemove,
}: CourseRowEditorProps) {
  return (
    <View style={styles.card}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowTitle}>Course {index + 1}</Text>
        {showRemove ? (
          <Pressable onPress={() => onRemove(index)}>
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        ) : null}
      </View>
      <AppTextField
        label="Course Title"
        onChangeText={(value) => onChange(index, 'title', value)}
        placeholder="For example: Monthly coaching"
        value={String(row.title)}
      />
      <AppTextField
        keyboardType="number-pad"
        label="Amount"
        onChangeText={(value) => onChange(index, 'amount', value)}
        placeholder="3000"
        value={String(row.amount)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(10, 18, 34, 0.7)',
    borderColor: AppColors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  rowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowTitle: {
    color: AppColors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  removeText: {
    color: AppColors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
});
