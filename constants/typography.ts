import { TextStyle } from 'react-native';
import { Colors } from './colors';

export const Typography: Record<string, TextStyle> = {
  h1: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.darkText,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.darkText,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.darkText,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.mutedText,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.darkText,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.mutedText,
    lineHeight: 18,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.mutedText,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.mutedText,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  button: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  stat: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.darkText,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.mutedText,
  },
};
