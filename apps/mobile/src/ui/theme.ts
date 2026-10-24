// iOS system colors and type scale (Apple HIG), used on every platform for the iPhone look.
import { Platform, useColorScheme, type TextStyle } from 'react-native';

const light = {
  bg: '#F2F2F7', // systemGroupedBackground
  card: '#FFFFFF',
  fill: 'rgba(120,120,128,0.12)',
  label: '#000000',
  secondary: 'rgba(60,60,67,0.6)',
  tertiary: 'rgba(60,60,67,0.3)',
  separator: 'rgba(60,60,67,0.29)',
  tint: '#007AFF',
  green: '#34C759',
  red: '#FF3B30',
  orange: '#FF9500',
  purple: '#AF52DE',
  imageWell: '#FFFFFF',
  segment: '#FFFFFF', // selected segment
};
const dark: typeof light = {
  bg: '#000000',
  card: '#1C1C1E',
  fill: 'rgba(118,118,128,0.24)',
  label: '#FFFFFF',
  secondary: 'rgba(235,235,245,0.6)',
  tertiary: 'rgba(235,235,245,0.3)',
  separator: 'rgba(84,84,88,0.65)',
  tint: '#0A84FF',
  green: '#30D158',
  red: '#FF453A',
  orange: '#FF9F0A',
  purple: '#BF5AF2',
  imageWell: '#FFFFFF', // menu photos are shot on white
  segment: '#636366',
};
export type Colors = typeof light;

export const useColors = () => (useColorScheme() === 'dark' ? dark : light);

const font = Platform.select({ web: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif' });
const t = (fontSize: number, fontWeight: TextStyle['fontWeight'], extra: TextStyle = {}): TextStyle => ({ fontSize, fontWeight, fontFamily: font, ...extra });

export const type = {
  largeTitle: t(34, '700', { letterSpacing: 0.4 }),
  title2: t(22, '700'),
  title3: t(20, '600'),
  headline: t(17, '600'),
  body: t(17, '400'),
  subhead: t(15, '400'),
  footnote: t(13, '400'),
  caption: t(12, '400'),
};
export const nums: TextStyle = { fontVariant: ['tabular-nums'] };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 32 };
export const radius = { sm: 8, md: 10, lg: 12 };
export const hairline = Platform.select({ web: 1, default: 0.5 }) as number;
