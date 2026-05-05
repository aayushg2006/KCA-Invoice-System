import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/theme';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How This Works</Text>
      <Text style={styles.copy}>
        Fill the invoice, capture the academy signature, and submit. The backend generates the
        next invoice number, builds the PDF from the exact KCA design, emails it to the student,
        stores it in Firebase, and returns the PDF so the app can save it on the phone.
      </Text>
      <Text style={styles.copy}>
        For a physical Android device, set `EXPO_PUBLIC_API_BASE_URL` to your backend URL before
        building or starting Expo so the app can reach the server outside localhost.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.navy,
    gap: 16,
    padding: 24,
  },
  copy: {
    color: AppColors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    color: AppColors.white,
    fontSize: 28,
    fontWeight: '800',
  },
});
