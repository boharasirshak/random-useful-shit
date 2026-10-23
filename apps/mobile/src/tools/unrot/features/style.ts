// Unrot's look: quiet black. Warm white type in the platform's own font; emphasis by brightness and weight, not colour.
// The only colours are the red of a like and Sprout's lime.
import { Platform, type TextStyle } from 'react-native';

export const C = {
  bg: '#0B0B0C',
  panel: '#121214',
  raised: '#1A1A1D',
  hairline: 'rgba(242,241,238,0.12)',
  ink: '#F2F1EE', // primary text
  body: 'rgba(242,241,238,0.74)', // card text around the key phrase
  dim: 'rgba(242,241,238,0.56)', // secondary text, ≥4.5:1 on bg
  faint: 'rgba(242,241,238,0.32)', // decoration only
  like: '#FF375F',
  lime: '#A6E35F',
};

const family = Platform.select({ web: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", sans-serif' });
export const sans = (fontSize: number, fontWeight: TextStyle['fontWeight'] = '400', extra: TextStyle = {}): TextStyle => ({
  fontFamily: family, fontSize, fontWeight, lineHeight: Math.round(fontSize * (fontSize >= 24 ? 1.2 : 1.45)),
  letterSpacing: fontSize >= 24 ? -0.02 * fontSize : 0, ...extra,
});
