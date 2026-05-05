import { Platform } from 'react-native';

export const AppColors = {
  navy: '#020617',
  navySoft: '#0f172a',
  cyan: '#24c3ff',
  cyanBright: '#5ad7ff',
  sky: '#d7f2ff',
  white: '#ffffff',
  textPrimary: '#ebf5ff',
  textSecondary: '#9db7cc',
  card: '#0b1324',
  cardAlt: '#111c34',
  border: 'rgba(110, 198, 255, 0.25)',
  field: 'rgba(15, 23, 42, 0.84)',
  success: '#38d39f',
  danger: '#ff7f7f',
};

export const Colors = {
  light: {
    text: AppColors.textPrimary,
    background: AppColors.navy,
    tint: AppColors.cyan,
    icon: AppColors.textSecondary,
    tabIconDefault: AppColors.textSecondary,
    tabIconSelected: AppColors.cyan,
  },
  dark: {
    text: AppColors.textPrimary,
    background: AppColors.navy,
    tint: AppColors.cyan,
    icon: AppColors.textSecondary,
    tabIconDefault: AppColors.textSecondary,
    tabIconSelected: AppColors.cyan,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const AppTheme = {
  dark: true,
  colors: {
    primary: AppColors.cyan,
    background: AppColors.navy,
    card: AppColors.navySoft,
    text: AppColors.textPrimary,
    border: AppColors.border,
    notification: AppColors.cyanBright,
  },
  fonts: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700' as const,
    },
    heavy: {
      fontFamily: 'System',
      fontWeight: '800' as const,
    },
  },
};

export const Shadows = {
  card: {
    shadowColor: '#001329',
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    elevation: 10,
  },
};
