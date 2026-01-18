// 全局设计规范 - 统一应用到所有页面
// 使用与主题融合的深色背景设计
export const globalDesign = {
  // 颜色规范
  colors: {
    primary: '#1890ff',
    danger: '#ff4d4f',
    success: '#52c41a',
    warning: '#faad14',
    info: '#1890ff',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    background: 'rgba(255, 255, 255, 0.05)',
    cardBackground: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.15)',
    inputBackground: 'rgba(255, 255, 255, 0.1)',
  },

  // 字体规范
  typography: {
    fontSizeXLarge: '24px',
    fontSizeLarge: '20px',
    fontSizeNormal: '14px',
    fontSizeSmall: '12px',
    fontWeightBold: '500',
  },

  // 间距规范
  spacing: {
    padding: '20px',
    marginBottom: '20px',
    cardPadding: '20px',
    buttonPadding: '12px 24px',
  },

  // 边框和圆角
  borders: {
    borderRadius: '8px',
    borderWidth: '1px',
    borderStyle: 'solid',
  },

  // 按钮样式
  button: {
    padding: '12px 24px',
    fontSize: '14px',
    borderRadius: '8px',
    fontWeight: '500',
    cursor: 'pointer' as const,
  },

  // 布局规范
  layout: {
    maxWidth: '400px',
    margin: '0 auto',
    textAlign: 'center' as const,
  },
};

// 预设样式类
export const globalStyles = {
  // 页面容器样式
  pageContainer: {
    padding: globalDesign.spacing.padding,
    backgroundColor: globalDesign.colors.background,
    minHeight: '100vh',
    color: globalDesign.colors.text,
  },

  // 卡片样式
  card: {
    padding: globalDesign.spacing.cardPadding,
    backgroundColor: globalDesign.colors.cardBackground,
    borderRadius: globalDesign.borders.borderRadius,
    border: `${globalDesign.borders.borderWidth} ${globalDesign.borders.borderStyle} ${globalDesign.colors.border}`,
    margin: `${globalDesign.layout.margin}`,
    maxWidth: globalDesign.layout.maxWidth,
  },

  // 标题样式
  title: {
    fontSize: globalDesign.typography.fontSizeXLarge,
    marginBottom: globalDesign.spacing.marginBottom,
    textAlign: globalDesign.layout.textAlign,
    color: globalDesign.colors.text,
  },

  // 副标题样式
  subtitle: {
    fontSize: globalDesign.typography.fontSizeLarge,
    marginBottom: '4px',
    color: globalDesign.colors.text,
  },

  // 文本样式
  text: {
    fontSize: globalDesign.typography.fontSizeNormal,
    color: globalDesign.colors.text,
  },

  // 辅助文本样式
  textSecondary: {
    fontSize: globalDesign.typography.fontSizeSmall,
    color: globalDesign.colors.textSecondary,
  },

  // 按钮样式
  button: {
    padding: globalDesign.button.padding,
    fontSize: globalDesign.button.fontSize,
    borderRadius: globalDesign.borders.borderRadius,
    fontWeight: globalDesign.typography.fontWeightBold,
    cursor: globalDesign.button.cursor,
    border: 'none',
    color: globalDesign.colors.text,
  },

  // 主要按钮样式
  buttonPrimary: {
    ...globalDesign.button,
    backgroundColor: globalDesign.colors.primary,
    color: globalDesign.colors.text,
  },

  // 危险按钮样式
  buttonDanger: {
    ...globalDesign.button,
    backgroundColor: globalDesign.colors.danger,
    color: globalDesign.colors.text,
  },
  
  // 次要按钮样式
  buttonSecondary: {
    ...globalDesign.button,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: globalDesign.colors.text,
    border: `${globalDesign.borders.borderWidth} ${globalDesign.borders.borderStyle} ${globalDesign.colors.border}`,
  },
};
