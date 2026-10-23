import { forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';
import type { RiveHandle, RiveViewProps } from './RiveView';

// Web: rive-react-native has no web build, so show the plain fallback instead.
export const RiveView = forwardRef<RiveHandle, RiveViewProps>(function RiveView({ size, fallback, pointerEvents }, ref) {
  useImperativeHandle(ref, () => ({ trigger: () => {} }), []);
  return <View pointerEvents={pointerEvents} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>{fallback}</View>;
});
