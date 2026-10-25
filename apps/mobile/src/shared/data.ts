// Where the app's published data lives (UploadThing, one base URL for everything: the food database, Unrot's cards,
// the ambient tracks). The upload scripts in packages/ print it. The older per-feature names still work.
export const DATA_URL = (process.env.EXPO_PUBLIC_DATA_URL || process.env.EXPO_PUBLIC_FOOD_DATA_URL || process.env.EXPO_PUBLIC_UNROT_DATA_URL || '').replace(/\/$/, '') || null;
