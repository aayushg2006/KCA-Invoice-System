import { startTransition, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppColors, Shadows } from '@/constants/theme';
import AppTextField from '@/src/components/app-text-field';
import CourseRowEditor from '@/src/components/course-row-editor';
import { createInvoice } from '@/src/lib/api';
import { saveInvoicePdf } from '@/src/lib/download-invoice';
import type { CourseDetail } from '@/src/types/invoice';

const paymentModes = ['Cash', 'UPI', 'Bank Transfer'] as const;

const emptyCourseRow = (): CourseDetail => ({
  title: '',
  amount: '',
});

function formatToday() {
  return new Date().toISOString().slice(0, 10);
}

function totalAmount(rows: CourseDetail[]) {
  return rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
}

export default function CreateInvoiceScreen() {
  const router = useRouter();
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [age, setAge] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [gmailId, setGmailId] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(formatToday());
  const [paymentMode, setPaymentMode] = useState<(typeof paymentModes)[number]>('Cash');
  const [courseDetails, setCourseDetails] = useState<CourseDetail[]>([emptyCourseRow()]);
  const [submitting, setSubmitting] = useState(false);

  const total = totalAmount(courseDetails);

  const handleCourseChange = (index: number, field: keyof CourseDetail, value: string) => {
    setCourseDetails((currentRows) =>
      currentRows.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  };

  const addCourseRow = () => {
    setCourseDetails((currentRows) => [...currentRows, emptyCourseRow()]);
  };

  const removeCourseRow = (index: number) => {
    setCourseDetails((currentRows) => currentRows.filter((_, rowIndex) => rowIndex !== index));
  };

  const validateBeforeSubmit = () => {
    if (!studentName || !parentName || !age || !mobileNumber || !gmailId || !createdBy) {
      Alert.alert('Missing details', 'Please complete all student, parent, and creator details.');
      return false;
    }

    const hasValidCourse = courseDetails.some((row) => row.title.trim() && Number(row.amount) > 0);

    if (!hasValidCourse) {
      Alert.alert('Course details required', 'Please add at least one course row with a title and amount.');
      return false;
    }

    return true;
  };

  const resetForm = () => {
    startTransition(() => {
      setStudentName('');
      setParentName('');
      setAge('');
      setMobileNumber('');
      setGmailId('');
      setCreatedBy('');
      setInvoiceDate(formatToday());
      setPaymentMode('Cash');
      setCourseDetails([emptyCourseRow()]);
    });
  };

  const handleSubmit = async () => {
    if (!validateBeforeSubmit()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await createInvoice({
        age,
        courseDetails,
        createdBy,
        gmailId,
        invoiceDate,
        mobileNumber,
        parentName,
        paymentMode,
        studentName,
      });

      let localUri = '';

      try {
        const downloadResult = await saveInvoicePdf(response.invoice);
        localUri = downloadResult.localUri || '';
      } catch {
        localUri = '';
      }

      resetForm();
      router.push({
        pathname: '../invoice-preview',
        params: {
          invoiceNumber: response.invoice.invoiceNumber,
          localUri,
          message: response.message,
          pdfUrl: response.invoice.pdfUrl,
        },
      });
    } catch (error) {
      Alert.alert(
        'Could not create invoice',
        error instanceof Error ? error.message : 'Please check the backend connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={['#020617', '#08111f', '#0f1f38']} style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardShell}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.delay(50).springify()} style={[styles.heroCard, Shadows.card]}>
            <View style={styles.heroTop}>
              <View style={styles.heroBrand}>
                <Image
                  contentFit="contain"
                  source={require('../../assets/branding/kca-logo.png')}
                  style={styles.logo}
                />
                <View>
                  <View style={styles.heroBadge}>
                    <MaterialCommunityIcons color={AppColors.cyanBright} name="file-document-edit-outline" size={18} />
                    <Text style={styles.heroBadgeText}>Create Invoice</Text>
                  </View>
                  <Link href="/modal" style={styles.helpLink}>
                    Need setup help?
                  </Link>
                </View>
              </View>
            </View>
            <Text style={styles.heroTitle}>Invoice / Fee Receipt Creator</Text>
            <Text style={styles.heroCopy}>
              Exact KCA branding, automatic academy signature and stamp, invoice numbering, PDF
              generation, Firebase storage, and email delivery in one flow.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Student & Parent Details</Text>
            <View style={styles.grid}>
              <AppTextField
                label="Student Name"
                onChangeText={setStudentName}
                placeholder="Student full name"
                value={studentName}
              />
              <AppTextField
                label="Parent Name"
                onChangeText={setParentName}
                placeholder="Parent full name"
                value={parentName}
              />
              <AppTextField
                keyboardType="number-pad"
                label="Age"
                onChangeText={setAge}
                placeholder="12"
                value={age}
              />
              <AppTextField
                keyboardType="phone-pad"
                label="Mobile Number"
                onChangeText={setMobileNumber}
                placeholder="9876543210"
                value={mobileNumber}
              />
              <AppTextField
                keyboardType="email-address"
                label="Gmail ID"
                onChangeText={setGmailId}
                placeholder="student@gmail.com"
                value={gmailId}
              />
              <AppTextField
                label="Invoice Date"
                onChangeText={setInvoiceDate}
                placeholder="YYYY-MM-DD"
                value={invoiceDate}
              />
              <AppTextField
                label="Created By"
                onChangeText={setCreatedBy}
                placeholder="Coach or team member name"
                value={createdBy}
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Course Details</Text>
              <Pressable onPress={addCourseRow} style={styles.inlineAction}>
                <Text style={styles.inlineActionText}>Add Row</Text>
              </Pressable>
            </View>
            <View style={styles.courseList}>
              {courseDetails.map((row, index) => (
                <CourseRowEditor
                  index={index}
                  key={`course-${index}`}
                  onChange={handleCourseChange}
                  onRemove={removeCourseRow}
                  row={row}
                  showRemove={courseDetails.length > 1}
                />
              ))}
            </View>
            <View style={styles.totalBar}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>Rs. {total.toLocaleString('en-IN')}</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Payment Mode & Finalization</Text>
            <View style={styles.paymentRow}>
              {paymentModes.map((mode) => {
                const active = paymentMode === mode;
                return (
                  <Pressable
                    key={mode}
                    onPress={() => setPaymentMode(mode)}
                    style={[styles.paymentChip, active && styles.paymentChipActive]}>
                    <Text style={[styles.paymentChipText, active && styles.paymentChipTextActive]}>
                      {mode}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.infoBanner}>
              <MaterialCommunityIcons color={AppColors.cyanBright} name="shield-check-outline" size={20} />
              <Text style={styles.infoBannerText}>
                Every invoice now uses the built-in academy signature in black ink and the default
                KCA authorized stamp automatically.
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.submitCard}>
            <Pressable
              disabled={submitting}
              onPress={handleSubmit}
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}>
              {submitting ? (
                <ActivityIndicator color={AppColors.navy} />
              ) : (
                <Text style={styles.submitText}>Create Invoice and Open Preview</Text>
              )}
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 18,
    padding: 18,
    paddingBottom: 42,
  },
  courseList: {
    gap: 12,
  },
  grid: {
    gap: 14,
  },
  helpLink: {
    color: AppColors.cyanBright,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  heroBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  heroBadgeText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  heroBrand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  heroCard: {
    backgroundColor: 'rgba(7, 15, 29, 0.92)',
    borderColor: AppColors.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    overflow: 'hidden',
    padding: 22,
  },
  heroCopy: {
    color: AppColors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
  },
  heroTitle: {
    color: AppColors.white,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  heroTop: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inlineAction: {
    backgroundColor: 'rgba(36, 195, 255, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineActionText: {
    color: AppColors.cyan,
    fontSize: 13,
    fontWeight: '800',
  },
  infoBanner: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(36, 195, 255, 0.08)',
    borderColor: AppColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 14,
  },
  infoBannerText: {
    color: AppColors.textSecondary,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
  },
  keyboardShell: {
    flex: 1,
  },
  logo: {
    height: 70,
    width: 70,
  },
  paymentChip: {
    backgroundColor: AppColors.cardAlt,
    borderColor: AppColors.border,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 96,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  paymentChipActive: {
    backgroundColor: AppColors.cyan,
    borderColor: AppColors.cyan,
  },
  paymentChipText: {
    color: AppColors.white,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  paymentChipTextActive: {
    color: AppColors.navy,
  },
  paymentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  screen: {
    flex: 1,
  },
  sectionCard: {
    backgroundColor: 'rgba(9, 18, 35, 0.86)',
    borderColor: AppColors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: AppColors.white,
    fontSize: 22,
    fontWeight: '800',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: AppColors.cyan,
    borderRadius: 20,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: 18,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitCard: {
    marginTop: 4,
    paddingBottom: 12,
  },
  submitText: {
    color: AppColors.navy,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  totalBar: {
    alignItems: 'center',
    backgroundColor: 'rgba(36, 195, 255, 0.1)',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  totalLabel: {
    color: AppColors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  totalValue: {
    color: AppColors.cyanBright,
    fontSize: 20,
    fontWeight: '900',
  },
});
