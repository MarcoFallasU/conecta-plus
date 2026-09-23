// En Expo Go usa la IP local de tu PC (ej. http://192.168.1.10:4000), no localhost.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api'
