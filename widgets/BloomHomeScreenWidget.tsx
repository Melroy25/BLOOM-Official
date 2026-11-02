import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface BloomHomeScreenWidgetProps {
  screenTimeText?: string;
  healBubbleStatus?: string;
}

/**
 * Bloom Native Android Home Screen Widget
 * Provides 3 quick-action shortcuts:
 *  - 🆘 SOS: Red/Coral badge (#E06D53) -> direct shortcut to /sos
 *  - ⏳ Screen Time: Sage Green badge (#789B83) -> displays daily screen time metric -> /tasks/screen-time
 *  - 🫧 Heal Bubble: Light Sage badge (#E8F1E8) -> direct shortcut to /heal-bubble
 * Styled using BLOOM design tokens (Background: #FAF8F2, Accent: #789B83, Card: #FFFFFF, Text: #29332E).
 */
export function BloomHomeScreenWidget({
  screenTimeText = '1h 45m today',
  healBubbleStatus = 'Breathe & Calm',
}: BloomHomeScreenWidgetProps) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#FAF8F2',
        borderRadius: 24,
        padding: 12,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Top Header Row */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
          marginBottom: 6,
          paddingHorizontal: 4,
        }}
      >
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <TextWidget
            text="🌿 BLOOM"
            style={{
              color: '#365B45',
              fontSize: 13,
              fontWeight: 'bold',
            }}
          />
          <TextWidget
            text=" • Mindful Daily Actions"
            style={{
              color: '#7B857F',
              fontSize: 10,
              fontWeight: 'normal',
            }}
          />
        </FlexWidget>

        <TextWidget
          text="Quick Access"
          style={{
            color: '#789B83',
            fontSize: 10,
            fontWeight: 'bold',
          }}
        />
      </FlexWidget>

      {/* 3 Quick-Action Shortcuts Grid */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
          flex: 1,
        }}
      >
        {/* SHORTCUT 1: SOS (Red/Coral Badge #E06D53 -> /sos) */}
        <FlexWidget
          clickAction="OPEN_URI"
          clickActionData={{ uri: 'bloom://sos' }}
          style={{
            flex: 1,
            height: 'match_parent',
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 8,
            marginRight: 4,
            borderWidth: 1,
            borderColor: '#F8D7DA',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Coral Badge */}
          <FlexWidget
            style={{
              backgroundColor: '#E06D53',
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 3,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TextWidget
              text="🆘 SOS"
              style={{
                color: '#FFFFFF',
                fontSize: 10,
                fontWeight: 'bold',
              }}
            />
          </FlexWidget>

          <FlexWidget
            style={{
              alignItems: 'center',
              marginTop: 4,
            }}
          >
            <TextWidget
              text="SOS Help"
              style={{
                color: '#E06D53',
                fontSize: 11,
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            />
            <TextWidget
              text="Emergency"
              style={{
                color: '#7B857F',
                fontSize: 9,
                textAlign: 'center',
              }}
            />
          </FlexWidget>
        </FlexWidget>

        {/* SHORTCUT 2: Screen Time (Sage Green Badge #789B83 -> metric -> /tasks) */}
        <FlexWidget
          clickAction="OPEN_URI"
          clickActionData={{ uri: 'bloom://tasks/screen-time' }}
          style={{
            flex: 1,
            height: 'match_parent',
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 8,
            marginHorizontal: 4,
            borderWidth: 1,
            borderColor: '#E8ECE9',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Sage Green Badge */}
          <FlexWidget
            style={{
              backgroundColor: '#789B83',
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 3,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TextWidget
              text="⏳ Usage"
              style={{
                color: '#FFFFFF',
                fontSize: 10,
                fontWeight: 'bold',
              }}
            />
          </FlexWidget>

          <FlexWidget
            style={{
              alignItems: 'center',
              marginTop: 4,
            }}
          >
            <TextWidget
              text={screenTimeText}
              style={{
                color: '#29332E',
                fontSize: 11,
                fontWeight: 'bold',
                textAlign: 'center',
              }}
              maxLines={1}
            />
            <TextWidget
              text="Screen Time"
              style={{
                color: '#7B857F',
                fontSize: 9,
                textAlign: 'center',
              }}
            />
          </FlexWidget>
        </FlexWidget>

        {/* SHORTCUT 3: Heal Bubble (Light Sage Badge #E8F1E8 -> /heal-bubble) */}
        <FlexWidget
          clickAction="OPEN_URI"
          clickActionData={{ uri: 'bloom://heal-bubble' }}
          style={{
            flex: 1,
            height: 'match_parent',
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 8,
            marginLeft: 4,
            borderWidth: 1,
            borderColor: '#D9EEE5',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Light Sage Badge */}
          <FlexWidget
            style={{
              backgroundColor: '#E8F1E8',
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 3,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TextWidget
              text="🫧 Heal"
              style={{
                color: '#365B45',
                fontSize: 10,
                fontWeight: 'bold',
              }}
            />
          </FlexWidget>

          <FlexWidget
            style={{
              alignItems: 'center',
              marginTop: 4,
            }}
          >
            <TextWidget
              text="Heal Bubble"
              style={{
                color: '#29332E',
                fontSize: 11,
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            />
            <TextWidget
              text={healBubbleStatus}
              style={{
                color: '#789B83',
                fontSize: 9,
                textAlign: 'center',
              }}
              maxLines={1}
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
