import { startTransition, useDeferredValue, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppColors } from '@/constants/theme';
import AppTextField from '@/src/components/app-text-field';
import { fetchRecentInvoices } from '@/src/lib/api';
import { saveInvoicePdf, shareInvoicePdf } from '@/src/lib/download-invoice';
import type { InvoiceRecord } from '@/src/types/invoice';

function formatInvoiceDate(value: string | null) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function RecentInvoicesScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [sharingInvoiceId, setSharingInvoiceId] = useState('');
  const deferredQuery = useDeferredValue(query);

  const filteredInvoices = invoices.filter((invoice) =>
    [invoice.invoiceNumber, invoice.studentName, invoice.parentName, invoice.gmailId]
      .join(' ')
      .toLowerCase()
      .includes(deferredQuery.trim().toLowerCase())
  );

  const loadInvoices = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const items = await fetchRecentInvoices();
      startTransition(() => {
        setInvoices(items);
      });
    } catch (error) {
      Alert.alert(
        'Could not load invoices',
        error instanceof Error ? error.message : 'Please check the backend connection and try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadInvoices();
    }
  }, [isFocused]);

  const handleOpenInvoice = async (invoice: InvoiceRecord) => {
    let localUri = '';

    try {
      const result = await saveInvoicePdf(invoice);
      localUri = result.localUri || '';
    } catch {
      localUri = '';
    }

    router.push({
      pathname: '../invoice-preview',
      params: {
        invoiceNumber: invoice.invoiceNumber,
        localUri,
        pdfUrl: invoice.pdfUrl,
      },
    });
  };

  const handleShareInvoice = async (invoice: InvoiceRecord) => {
    try {
      setSharingInvoiceId(invoice.id);
      const result = await saveInvoicePdf(invoice);

      if (!result.localUri) {
        throw new Error('The invoice PDF could not be prepared for sharing.');
      }

      await shareInvoicePdf(result.localUri);
    } catch (error) {
      Alert.alert(
        'Share unavailable',
        error instanceof Error ? error.message : 'The invoice could not be shared from this device.'
      );
    } finally {
      setSharingInvoiceId('');
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#020617', '#08111f']} style={styles.loadingScreen}>
        <ActivityIndicator color={AppColors.cyan} size="large" />
        <Text style={styles.loadingText}>Loading recent invoices...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#020617', '#091426', '#0f1d34']} style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        data={filteredInvoices}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No invoices found</Text>
            <Text style={styles.emptyCopy}>
              Create the first invoice from the Create tab and it will appear here.
            </Text>
          </View>
        }
        ListHeaderComponent={
          <Animated.View entering={FadeInDown.springify()} style={styles.headerBlock}>
            <View style={styles.headerBrand}>
              <Image
                contentFit="contain"
                source={require('../../assets/branding/kca-logo.png')}
                style={styles.logo}
              />
              <View style={styles.headerBadge}>
                <MaterialCommunityIcons color={AppColors.cyanBright} name="history" size={20} />
                <Text style={styles.headerBadgeText}>Recent Invoices</Text>
              </View>
            </View>
            <Text style={styles.title}>Recent Invoices</Text>
            <Text style={styles.copy}>
              Everyone using the app can review the latest invoices here, open the PDF inside the
              app, and share it again whenever needed.
            </Text>
            <AppTextField
              label="Search"
              onChangeText={setQuery}
              placeholder="Invoice number, student, parent, or Gmail"
              value={query}
            />
          </Animated.View>
        }
        refreshControl={
          <RefreshControl
            onRefresh={() => loadInvoices(true)}
            refreshing={refreshing}
            tintColor={AppColors.cyan}
          />
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={styles.invoiceCard}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
                <Text style={styles.studentName}>{item.studentName}</Text>
              </View>
              <View style={styles.amountBadge}>
                <Text style={styles.amountValue}>Rs. {item.totalAmount.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Parent</Text>
              <Text style={styles.metaValue}>{item.parentName}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{formatInvoiceDate(item.invoiceDate)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Payment</Text>
              <Text style={styles.metaValue}>{item.paymentMode}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Email</Text>
              <Text style={styles.metaValue}>{item.gmailId}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Mail Status</Text>
              <Text
                style={[
                  styles.metaValue,
                  item.emailStatus === 'sent' ? styles.successText : styles.warningText,
                ]}>
                {item.emailStatus}
              </Text>
            </View>

            <View style={styles.actionRow}>
              <Pressable onPress={() => handleOpenInvoice(item)} style={styles.downloadButton}>
                <Text style={styles.downloadText}>Open PDF</Text>
              </Pressable>

              <Pressable
                disabled={sharingInvoiceId === item.id}
                onPress={() => handleShareInvoice(item)}
                style={[styles.shareButton, sharingInvoiceId === item.id && styles.shareButtonDisabled]}>
                {sharingInvoiceId === item.id ? (
                  <ActivityIndicator color={AppColors.white} size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons color={AppColors.white} name="share-variant-outline" size={18} />
                    <Text style={styles.shareText}>Share PDF</Text>
                  </>
                )}
              </Pressable>
            </View>
          </Animated.View>
        )}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  amountBadge: {
    backgroundColor: 'rgba(36, 195, 255, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  amountValue: {
    color: AppColors.cyanBright,
    fontSize: 13,
    fontWeight: '900',
  },
  cardTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  content: {
    gap: 16,
    padding: 18,
    paddingBottom: 42,
  },
  copy: {
    color: AppColors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  downloadButton: {
    alignItems: 'center',
    backgroundColor: AppColors.cyan,
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
  },
  downloadText: {
    color: AppColors.navy,
    fontSize: 15,
    fontWeight: '900',
  },
  emptyCard: {
    backgroundColor: 'rgba(9, 18, 35, 0.86)',
    borderColor: AppColors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 22,
  },
  emptyCopy: {
    color: AppColors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  emptyTitle: {
    color: AppColors.white,
    fontSize: 22,
    fontWeight: '800',
  },
  headerBlock: {
    gap: 12,
    marginBottom: 8,
  },
  headerBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  headerBadgeText: {
    color: AppColors.white,
    fontSize: 17,
    fontWeight: '800',
  },
  headerBrand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  invoiceCard: {
    backgroundColor: 'rgba(9, 18, 35, 0.88)',
    borderColor: AppColors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 18,
  },
  invoiceNumber: {
    color: AppColors.cyanBright,
    fontSize: 15,
    fontWeight: '900',
  },
  loadingScreen: {
    alignItems: 'center',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
  },
  loadingText: {
    color: AppColors.textSecondary,
    fontSize: 15,
  },
  logo: {
    height: 56,
    width: 56,
  },
  metaLabel: {
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaValue: {
    color: AppColors.white,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingLeft: 16,
    textAlign: 'right',
  },
  screen: {
    flex: 1,
  },
  shareButton: {
    alignItems: 'center',
    backgroundColor: AppColors.cardAlt,
    borderColor: AppColors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 50,
  },
  shareButtonDisabled: {
    opacity: 0.7,
  },
  shareText: {
    color: AppColors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  studentName: {
    color: AppColors.white,
    fontSize: 21,
    fontWeight: '800',
    marginTop: 6,
  },
  successText: {
    color: AppColors.success,
  },
  title: {
    color: AppColors.white,
    fontSize: 30,
    fontWeight: '900',
  },
  warningText: {
    color: '#fdbb74',
  },
});
