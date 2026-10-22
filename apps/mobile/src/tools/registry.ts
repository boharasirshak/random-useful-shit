// Every tool on the home screen. Add a tool: create src/tools/<id>/ and src/app/<id>/, then list it here.
import type Ionicons from '@expo/vector-icons/Ionicons';
import type { Href } from 'expo-router';
import type { ComponentProps } from 'react';

export type Tool = {
  id: string;
  name: string; // icon label, keep short
  title: string; // full name
  blurb: string;
  href: Href;
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string; // icon background
};

export const TOOLS: Tool[] = [
  {
    id: 'calories',
    name: 'Calories',
    title: 'Calorie Tracker',
    blurb: 'Chick-fil-A, Panda & shakes. BMR, deficit, weight trend.',
    href: '/calories',
    icon: 'flame',
    color: '#FF9500',
  },
];
