import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { File } from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

import { AppColors } from '@/constants/theme';
import { saveInvoicePdf, shareInvoicePdf } from '@/src/lib/download-invoice';

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function buildPdfPreviewHtml(pdfBase64: string) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes"
    />
    <title>KCA Invoice Preview</title>
    <style>
      :root {
        color-scheme: dark;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #111827;
        color: #e2e8f0;
        font-family: Arial, Helvetica, sans-serif;
      }

      .status {
        position: sticky;
        top: 0;
        z-index: 10;
        padding: 12px 16px;
        background: rgba(2, 6, 23, 0.92);
        border-bottom: 1px solid rgba(56, 189, 248, 0.2);
        font-size: 14px;
        text-align: center;
      }

      .pages {
        padding: 12px;
      }

      .page {
        margin: 0 auto 12px;
        width: fit-content;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 18px 36px rgba(15, 23, 42, 0.32);
      }

      canvas {
        display: block;
        background: #ffffff;
      }

      .error {
        color: #fca5a5;
      }
    </style>
  </head>
  <body>
    <div class="status" id="status">Rendering invoice preview...</div>
    <div class="pages" id="pages"></div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>
      const postMessage = (payload) => {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      };

      const updateStatus = (message, isError = false) => {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = isError ? 'status error' : 'status';
      };

      const base64ToUint8Array = (base64) => {
        const binary = window.atob(base64);
        const length = binary.length;
        const bytes = new Uint8Array(length);

        for (let index = 0; index < length; index += 1) {
          bytes[index] = binary.charCodeAt(index);
        }

        return bytes;
      };

      window.addEventListener('error', (event) => {
        const message = event && event.message ? event.message : 'Unexpected preview error.';
        updateStatus(message, true);
        postMessage({ type: 'error', message });
      });

      const renderPdf = async () => {
        if (!window.pdfjsLib) {
          throw new Error('PDF renderer could not be loaded on this device.');
        }

        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const pdfData = base64ToUint8Array('${pdfBase64}');
        const pdf = await window.pdfjsLib.getDocument({
          data: pdfData,
          isEvalSupported: false,
          useWorkerFetch: true,
        }).promise;

        const pagesContainer = document.getElementById('pages');
        const targetWidth = Math.max(window.innerWidth - 24, 280);

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const initialViewport = page.getViewport({ scale: 1 });
          const scale = targetWidth / initialViewport.width;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          const pageWrapper = document.createElement('div');

          pageWrapper.className = 'page';
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          pageWrapper.appendChild(canvas);
          pagesContainer.appendChild(pageWrapper);

          await page.render({
            canvasContext: context,
            viewport,
          }).promise;
        }

        updateStatus('Invoice preview ready');
        postMessage({ type: 'loaded' });
      };

      renderPdf().catch((error) => {
        const message = error && error.message ? error.message : 'Invoice preview could not be rendered.';
        updateStatus(message, true);
        postMessage({ type: 'error', message });
      });
    </script>
  </body>
</html>`;
}

export default function InvoicePreviewScreen() {
  const params = useLocalSearchParams<{
    invoiceNumber?: string;
    localUri?: string;
    message?: string;
    pdfUrl?: string;
  }>();
  const invoiceNumber = readParam(params.invoiceNumber);
  const pdfUrl = readParam(params.pdfUrl);
  const [localUri, setLocalUri] = useState(readParam(params.localUri));
  const [sharing, setSharing] = useState(false);
  const [preparingDownload, setPreparingDownload] = useState(false);
  const [preparingPreview, setPreparingPreview] = useState(false);
  const [previewBase64, setPreviewBase64] = useState('');
  const [previewError, setPreviewError] = useState('');
  const statusMessage = readParam(params.message);
  const previewHtml = useMemo(
    () => (previewBase64 ? buildPdfPreviewHtml(previewBase64) : ''),
    [previewBase64]
  );
  const isPreparing = preparingDownload || preparingPreview;

  useEffect(() => {
    if (Platform.OS === 'web' || localUri || !invoiceNumber || !pdfUrl) {
      return;
    }

    let cancelled = false;

    const prepare = async () => {
      try {
        setPreparingDownload(true);
        const result = await saveInvoicePdf({ invoiceNumber, pdfUrl });

        if (!cancelled) {
          setLocalUri(result.localUri || '');
        }
      } catch {
        if (!cancelled) {
          setLocalUri('');
        }
      } finally {
        if (!cancelled) {
          setPreparingDownload(false);
        }
      }
    };

    prepare();

    return () => {
      cancelled = true;
    };
  }, [invoiceNumber, localUri, pdfUrl]);

  useEffect(() => {
    if (Platform.OS === 'web' || !localUri) {
      return;
    }

    let cancelled = false;

    const preparePreview = async () => {
      try {
        setPreparingPreview(true);
        setPreviewError('');
        const pdfFile = new File(localUri);
        const base64Content = await pdfFile.base64();

        if (!cancelled) {
          setPreviewBase64(base64Content);
        }
      } catch (error) {
        if (!cancelled) {
          setPreviewBase64('');
          setPreviewError(
            error instanceof Error
              ? error.message
              : 'The invoice preview could not be prepared on this device.'
          );
        }
      } finally {
        if (!cancelled) {
          setPreparingPreview(false);
        }
      }
    };

    preparePreview();

    return () => {
      cancelled = true;
    };
  }, [localUri]);

  const handleShare = async () => {
    try {
      setSharing(true);

      let targetUri = localUri;

      if (!targetUri) {
        if (!invoiceNumber || !pdfUrl) {
          throw new Error('The invoice PDF details are incomplete.');
        }

        const result = await saveInvoicePdf({ invoiceNumber, pdfUrl });

        targetUri = result.localUri || '';
        setLocalUri(targetUri);
      }

      if (!targetUri) {
        throw new Error('The invoice PDF could not be prepared for sharing.');
      }

      await shareInvoicePdf(targetUri);
    } catch (error) {
      Alert.alert(
        'Share unavailable',
        error instanceof Error ? error.message : 'The invoice could not be shared from this device.'
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <LinearGradient colors={['#020617', '#08111f', '#0f1d34']} style={styles.screen}>
      <Stack.Screen
        options={{
          title: invoiceNumber || 'Invoice Preview',
          headerStyle: { backgroundColor: AppColors.navy },
          headerTintColor: AppColors.cyanBright,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: AppColors.navy },
        }}
      />

      <View style={styles.content}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.eyebrow}>Invoice Preview</Text>
              <Text style={styles.invoiceNumber}>{invoiceNumber || 'KCA Invoice'}</Text>
            </View>

            <Pressable
              disabled={sharing || isPreparing}
              onPress={handleShare}
              style={[styles.shareButton, (sharing || isPreparing) && styles.shareButtonDisabled]}>
              {sharing ? (
                <ActivityIndicator color={AppColors.navy} size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons color={AppColors.navy} name="share-variant-outline" size={18} />
                  <Text style={styles.shareButtonText}>Share PDF</Text>
                </>
              )}
            </Pressable>
          </View>

          <Text style={styles.summaryCopy}>
            The invoice opens inside the app. Use Share PDF to send it to WhatsApp, Gmail, or any
            other supported app on the phone.
          </Text>

          {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}
          {isPreparing ? <Text style={styles.preparingText}>Preparing the invoice preview...</Text> : null}
          {previewError ? <Text style={styles.errorText}>{previewError}</Text> : null}
        </View>

        <View style={styles.viewerCard}>
          {Platform.OS === 'web' && pdfUrl ? (
            <WebView
              originWhitelist={['*']}
              source={{ uri: pdfUrl }}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loader}>
                  <ActivityIndicator color={AppColors.cyan} size="large" />
                  <Text style={styles.loaderText}>Opening invoice preview...</Text>
                </View>
              )}
              style={styles.webview}
            />
          ) : previewHtml ? (
            <WebView
              originWhitelist={['*']}
              javaScriptEnabled
              source={{ html: previewHtml }}
              startInLoadingState
              onMessage={(event) => {
                try {
                  const payload = JSON.parse(event.nativeEvent.data) as {
                    message?: string;
                    type?: string;
                  };

                  if (payload.type === 'error') {
                    setPreviewError(payload.message || 'Invoice preview could not be rendered.');
                  }
                } catch {
                  setPreviewError('Invoice preview could not be rendered.');
                }
              }}
              renderLoading={() => (
                <View style={styles.loader}>
                  <ActivityIndicator color={AppColors.cyan} size="large" />
                  <Text style={styles.loaderText}>Rendering invoice preview...</Text>
                </View>
              )}
              style={styles.webview}
            />
          ) : isPreparing ? (
            <View style={styles.loader}>
              <ActivityIndicator color={AppColors.cyan} size="large" />
              <Text style={styles.loaderText}>Preparing invoice preview...</Text>
            </View>
          ) : previewError ? (
            <View style={styles.loader}>
              <MaterialCommunityIcons color={AppColors.cyanBright} name="file-alert-outline" size={30} />
              <Text style={styles.loaderText}>{previewError}</Text>
            </View>
          ) : (
            <View style={styles.loader}>
              <MaterialCommunityIcons color={AppColors.cyanBright} name="file-alert-outline" size={30} />
              <Text style={styles.loaderText}>The invoice preview is not available yet.</Text>
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: 16,
    padding: 16,
    paddingBottom: 18,
  },
  eyebrow: {
    color: AppColors.cyanBright,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
  },
  invoiceNumber: {
    color: AppColors.white,
    fontSize: 26,
    fontWeight: '900',
    marginTop: 6,
  },
  loader: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 24,
  },
  loaderText: {
    color: AppColors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  preparingText: {
    color: AppColors.cyanBright,
    fontSize: 13,
    fontWeight: '700',
  },
  screen: {
    flex: 1,
  },
  shareButton: {
    alignItems: 'center',
    backgroundColor: AppColors.cyan,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 18,
  },
  shareButtonDisabled: {
    opacity: 0.7,
  },
  shareButtonText: {
    color: AppColors.navy,
    fontSize: 14,
    fontWeight: '900',
  },
  statusText: {
    color: AppColors.success,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: 'rgba(9, 18, 35, 0.9)',
    borderColor: AppColors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 18,
  },
  summaryCopy: {
    color: AppColors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  summaryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  viewerCard: {
    backgroundColor: AppColors.white,
    borderColor: AppColors.border,
    borderRadius: 26,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
});
