import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { View, type DimensionValue } from 'react-native';
import { CATALOG_IMAGES } from '@/tools/calories/data/catalogImages';
import { byId } from '@/tools/calories/data/menu';
import { IMAGES } from '@/tools/calories/data/images';
import { hasLocalPhoto, photoUri, useCatalog } from '@/tools/calories/store/catalog';
import { useColors } from '@/ui/theme';

// Menu photo on a white well. Product cutouts are contained; photos fill. Missing photo → icon.
// Bundled photos are static requires (legacy IMAGES, then the catalog); the downloaded catalog's come from the saved
// file when there is one, else by URL.
export function Thumb({ id, size, width, radius = 8 }: { id: string; size?: number; width?: DimensionValue; radius?: number }) {
  const c = useColors();
  useCatalog(s => s.version); // photos arriving
  const item = byId[id];
  const file = item?.image;
  const src = file ? IMAGES[file] ?? CATALOG_IMAGES[file] : item?.url ? { uri: hasLocalPhoto(id) ? photoUri(id) : item.url } : undefined;
  const cutout = item?.fit === 'contain' || (!!file && file.endsWith('.png'));
  return (
    <View style={{
      width: width ?? size, height: size, aspectRatio: size ? undefined : 4 / 3, borderRadius: radius,
      backgroundColor: c.imageWell, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    }}>
      {src ? (
        <Image source={src} contentFit={cutout ? 'contain' : 'cover'} style={{ width: '100%', height: '100%', padding: cutout ? 6 : 0 }} transition={150} cachePolicy="disk" />
      ) : (
        <Ionicons name={id === 'shake' ? 'nutrition' : 'restaurant'} size={size ? size * 0.4 : 28} color="#C7C7CC" />
      )}
    </View>
  );
}
