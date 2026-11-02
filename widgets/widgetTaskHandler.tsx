import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { BloomHomeScreenWidget } from './BloomHomeScreenWidget';
import { getWidgetData, WIDGET_NAME } from '../services/widgetDataService';

/**
 * Headless background task handler for Android widget events.
 * Triggered on WIDGET_ADDED, WIDGET_UPDATE, WIDGET_RESIZED, etc.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, widgetAction, renderWidget } = props;

  if (widgetInfo.widgetName === WIDGET_NAME) {
    switch (widgetAction) {
      case 'WIDGET_ADDED':
      case 'WIDGET_UPDATE':
      case 'WIDGET_RESIZED': {
        const data = await getWidgetData();
        renderWidget(
          <BloomHomeScreenWidget
            screenTimeText={data.screenTimeText}
            healBubbleStatus={data.healBubbleStatus}
          />
        );
        break;
      }
      default:
        break;
    }
  }
}
