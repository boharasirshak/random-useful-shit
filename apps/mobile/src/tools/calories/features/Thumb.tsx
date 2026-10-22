import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { View, type DimensionValue } from 'react-native';
import { byId } from '@/tools/calories/data/menu';
import { IMAGES } from '@/tools/calories/data/images';
import { useColors } from '@/ui/theme';

// Menu photo on a white well. Product cutouts are contained; photos fill. Missing photo → icon.
export function Thumb({ id, size, width, radius = 8 }: { id: string; size?: number; width?: DimensionValue; radius?: number }) {
  const c = useColors();
  const file = byId[id]?.image;
  const src = file ? IMAGES[file] : undefined;
  const photo = file?.endsWith('.jpg');
  return (
    <View style={{
      width: width ?? size, height: size, aspectRatio: size ? undefined : 4 / 3, borderRadius: radius,
      backgroundColor: c.imageWell, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    }}>
      {src ? (
        <Image source={src} contentFit={photo ? 'cover' : 'contain'} style={{ width: '100%', height: '100%', padding: photo ? 0 : 6 }} transition={150} />
      ) : (
        <Ionicons name={id === 'shake' ? 'nutrition' : 'restaurant'} size={size ? size * 0.4 : 28} color="#C7C7CC" />
      )}
    </View>
  );
}
