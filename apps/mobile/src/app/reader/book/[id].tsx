import { useLocalSearchParams } from 'expo-router';
import { BookScreen } from '@/tools/reader/features/BookScreen';

export default function Book() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BookScreen id={id} />;
}
