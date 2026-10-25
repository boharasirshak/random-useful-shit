import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { View } from 'react-native';
import type { Restaurant } from '@/tools/calories/data/menu';
import { useColors } from '@/ui/theme';
import { placeLook } from './places';

// A place's square badge: logo on white (like a menu photo), or a colored icon.
export function PlaceBadge({ place, size = 44 }: { place: Restaurant; size?: number }) {
  const c = useColors();
  const look = placeLook(place);
  const r = size * 0.23;
  if ('logo' in look) {
    return (
      <View style={{ width: size, height: size, borderRadius: r, backgroundColor: c.imageWell, padding: size * look.pad, borderWidth: 0.5, borderColor: c.separator }}>
        <Image source={look.logo} contentFit="contain" style={{ flex: 1 }} accessibilityIgnoresInvertColors />
      </View>
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: r, backgroundColor: look.color, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={look.icon} size={size * 0.55} color="#fff" />
    </View>
  );
}
