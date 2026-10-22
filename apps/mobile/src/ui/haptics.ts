import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// iOS haptic vocabulary. Nothing on web.
const on = Platform.OS !== 'web';
// Buttons and steppers.
export const tap = () => { if (on) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };
// Picking a value: segments, wheels, scrubbing a chart.
export const select = () => { if (on) Haptics.selectionAsync(); };
// Something saved or finished.
export const success = () => { if (on) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); };
// Went over the day's target.
export const warning = () => { if (on) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); };
// Removing something.
export const thud = () => { if (on) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid); };
