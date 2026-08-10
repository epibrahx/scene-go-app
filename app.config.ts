import { ExpoConfig, ConfigContext } from 'expo/config';
import appJson from './app.json';

export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV ?? 'development';
  const aiProxyUrl = process.env.EXPO_PUBLIC_AI_PROXY_URL ?? '';
  
  return {
    ...(appJson.expo as ExpoConfig),
    ...config,
    extra: {
      ...(appJson.expo.extra ?? {}),
      appEnv,
      aiProxyUrl,
    },
  };
};
