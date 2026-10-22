import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Light tap feedback on phones; nothing on web.
export const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};
export const success = () => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};
