import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import {
  generateReportPdf,
  shareReportPdf,
  downloadReportPdfWeb,
  uploadReportPdfToStorage,
} from './pdfReportGenerator';
import { WellnessReportDocument, UserProfile } from '../types';

/**
 * Unified PDF Export Service for BLOOM.
 * Guarantees proper file:// scheme, cacheDirectory copy, and mimeType application
 * to prevent ExpoSharing.shareAsync permission rejection on Android.
 */
export async function exportReportPdf(
  report: WellnessReportDocument,
  userProfile?: UserProfile | null,
  dialogTitle: string = 'Export Wellness Report'
): Promise<string> {
  if (Platform.OS === 'web') {
    await downloadReportPdfWeb(report, userProfile);
    return 'web_download';
  }

  // 1. Generate local PDF file
  const generatedUri = await generateReportPdf(report, userProfile);

  // 2. Format with file:// scheme
  const formattedUri = generatedUri.startsWith('file://') ? generatedUri : `file://${generatedUri}`;

  // 3. Share with Expo Sharing
  await shareReportPdf(formattedUri, dialogTitle);

  return formattedUri;
}

export {
  generateReportPdf,
  shareReportPdf,
  downloadReportPdfWeb,
  uploadReportPdfToStorage,
};
