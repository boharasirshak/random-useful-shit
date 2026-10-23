import { Platform } from 'react-native';

// Book type for the words themselves; the iOS kit font for everything around them.
export const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Iowan Old Style", "Times New Roman", serif' });
export const INK = '#F5F1E8'; // warm off-white text on dark cards
export const INK_DIM = 'rgba(245,241,232,0.62)';
