import Ionicons from '@expo/vector-icons/Ionicons';
import { Picker } from '@expo/ui/community/picker';
import { ActionSheetIOS, Platform, Pressable, Text, View } from 'react-native';
import { MEALS, type Meal } from '@/tools/calories/lib/log';
import { select } from '@/ui/haptics';
import { type, useColors } from '@/ui/theme';

const KEYS = Object.keys(MEALS) as Meal[];

// "Lunch ⌄": which meal you're adding to. iPhone: action sheet. Web: native <select> (a wheel on iPhone Safari).
export function MealTitle({ meal, onChange }: { meal: Meal; onChange: (m: Meal) => void }) {
  const c = useColors();
  const label = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Text style={[type.title2, { color: c.label }]}>{MEALS[meal]}</Text>
      <Ionicons name="chevron-down" size={18} color={c.tint} />
    </View>
  );

  if (Platform.OS === 'web') {
    return (
      <View accessibilityLabel={`Adding to ${MEALS[meal]}. Change meal.`}>
        {label}
        <Picker selectedValue={meal} onValueChange={v => onChange(v as Meal)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 }}>
          {KEYS.map(k => <Picker.Item key={k} label={MEALS[k]} value={k} />)}
        </Picker>
      </View>
    );
  }

  const open = () => {
    select();
    if (Platform.OS !== 'ios') return onChange(KEYS[(KEYS.indexOf(meal) + 1) % KEYS.length]);
    ActionSheetIOS.showActionSheetWithOptions(
      { title: 'Add to', options: [...KEYS.map(k => MEALS[k]), 'Cancel'], cancelButtonIndex: KEYS.length },
      i => { if (i < KEYS.length) { select(); onChange(KEYS[i]); } },
    );
  };
  return (
    <Pressable onPress={open} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Adding to ${MEALS[meal]}. Change meal.`}>
      {label}
    </Pressable>
  );
}
