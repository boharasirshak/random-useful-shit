// Every tool on the home screen. Add a tool: create src/tools/<id>/ and src/app/<id>/, then list it here.
import type Ionicons from '@expo/vector-icons/Ionicons';
import type { Href } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ImageSourcePropType } from 'react-native';

export type Tool = {
  id: string;
  name: string; // icon label, keep short
  title: string; // full name
  href: Href;
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string; // icon background
  logo?: ImageSourcePropType; // a drawn icon instead of the glyph
};

export const TOOLS: Tool[] = [
  {
    id: 'calories',
    name: 'Calories',
    title: 'Calorie Tracker',
    href: '/calories',
    icon: 'flame',
    color: '#FF9500',
  },
  {
    id: 'unrot',
    name: 'Unrot',
    title: 'Unrot',
    href: '/unrot',
    icon: 'leaf',
    color: '#12261C',
    logo: require('@/assets/tools/unrot.png'),
  },
  {
    id: 'reader',
    name: 'Reader',
    title: 'PDF Reader',
    href: '/reader',
    icon: 'book',
    color: '#5856D6',
  },
];
