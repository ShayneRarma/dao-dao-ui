const generateColorClass = (variable, opacity) =>
  `rgba(var(--${variable}), ${opacity})`

const colors = {
  // Constant colors.
  vanta: generateColorClass('vanta', 1),
  black: generateColorClass('black', 1),
  dark: generateColorClass('dark', 1),
  light: generateColorClass('light', 1),
  white: generateColorClass('white', 1),
  brand: generateColorClass('brand', 1),
  active: generateColorClass('active', 1),
  error: generateColorClass('error', 1),
  valid: generateColorClass('valid', 1),

  // Text colors.
  'text-primary': generateColorClass('white', 1),
  'text-body': generateColorClass('light', 0.95),
  'text-secondary': generateColorClass('light', 0.7),
  'text-tertiary': generateColorClass('light', 0.5),
  'text-brand': generateColorClass('brand', 0.95),
  'text-interactive-disabled': generateColorClass('light', 0.2),
  'text-interactive-active': generateColorClass('active', 0.95),
  'text-interactive-error': generateColorClass('error', 0.95),
  'text-interactive-valid': generateColorClass('valid', 0.95),
  'text-button-primary': generateColorClass('black', 0.95),
  'text-button-disabled': generateColorClass('dark', 0.75),

  // Icon colors.
  'icon-primary': generateColorClass('light', 0.9),
  'icon-secondary': generateColorClass('light', 0.6),
  'icon-tertiary': generateColorClass('light', 0.45),
  'icon-brand': generateColorClass('brand', 0.9),
  'icon-interactive-disabled': generateColorClass('light', 0.15),
  'icon-interactive-active': generateColorClass('active', 0.9),
  'icon-interactive-error': generateColorClass('error', 0.9),
  'icon-interactive-valid': generateColorClass('valid', 0.9),
  'icon-button-primary': generateColorClass('dark', 0.95),
  'icon-button-disabled': generateColorClass('dark', 0.7),

  // Border colors.
  'border-base': generateColorClass('vanta', 1),
  'border-primary': generateColorClass('light', 0.1),
  'border-secondary': generateColorClass('light', 0.05),
  'border-interactive-hover': generateColorClass('light', 0.15),
  'border-interactive-selected': generateColorClass('light', 0.2),
  'border-interactive-focus': generateColorClass('focus', 0.2),

  // Background colors.
  'background-primary': generateColorClass('light', 0.08),
  'background-secondary': generateColorClass('light', 0.05),
  'background-tertiary': generateColorClass('light', 0.03),
  'background-button': generateColorClass('light', 0.9),
  'background-base': generateColorClass('black', 1),
  'background-overlay': generateColorClass('vanta', 0.7),
  'background-interactive-hover': generateColorClass('light', 0.1),
  'background-interactive-selected': generateColorClass('light', 0.15),
  'background-interactive-pressed': generateColorClass('light', 0.15),
  'background-interactive-disabled': generateColorClass('light', 0.03),
  'background-interactive-active': generateColorClass('brand', 0.15),
  'background-interactive-error': generateColorClass('error', 0.9),
  'background-button-hover': generateColorClass('white', 0.95),
  'background-button-pressed': generateColorClass('white', 1),
  'background-button-progress': generateColorClass('light', 0.75),
  'background-button-disabled': generateColorClass('light', 0.4),
  'background-button-active': generateColorClass('brand', 0.9),
  'background-button-disabled': generateColorClass('dark', 0.4),

  // Component colors.
  'component-modal': generateColorClass('black'),
  'component-dropdown': 'rgba(29, 30, 31, 1)',
  'component-tooltip': 'rgba(15, 15, 16, 1)',
  'component-toast': 'rgba(12, 12, 13, 1)',
  'component-widget': generateColorClass('dark', 0.2),
  'component-badge-primary': generateColorClass('light', 0.25),
  'component-badge-brand': generateColorClass('brand', 0.4),
  'component-badge-valid': generateColorClass('valid', 0.45),
  'component-badge-error': generateColorClass('error', 0.45),

  // Button colors.
  'button-secondary-default': generateColorClass('dark', 0.08),
  'button-secondary-hover': generateColorClass('dark', 0.12),
  'button-secondary-pressed': generateColorClass('dark', 0.15),
  'button-secondary-disabled': generateColorClass('dark', 0.03),

  // OLD COLORS. DO NOT USE. REMOVE BEFORE V2 MERGE.
  btn: generateColorClass('dark', 0.95),
  'btn-secondary': generateColorClass('dark', 0.1),
  'btn-hover': generateColorClass('black', 1),
  'btn-pressed': generateColorClass('dark', 0.85),
  'btn-disabled': generateColorClass('dark', 0.3),

  'btn-secondary-hover': generateColorClass('dark', 0.15),
  'btn-secondary-pressed': generateColorClass('dark', 0.05),
  'btn-active': generateColorClass('active', 0.1),
}

// OLD COLORS. DO NOT USE. REMOVE BEFORE V2 MERGE.
const textColor = {
  primary: generateColorClass('black', 1),
  body: generateColorClass('dark', 0.95),
  secondary: generateColorClass('dark', 0.8),
  tertiary: generateColorClass('dark', 0.6),
  disabled: generateColorClass('dark', 0.4),
  accent: generateColorClass('accent', 1),
}

// OLD COLORS. DO NOT USE. REMOVE BEFORE V2 MERGE.
const backgroundColor = {
  base: generateColorClass('white', 1),
  disabled: generateColorClass('dark', 0.03),
  primary: generateColorClass('dark', 0.05),
  secondary: generateColorClass('dark', 0.2),
  tertiary: generateColorClass('dark', 0.3),
  toast: generateColorClass('dark', 0.85),
  card: generateColorClass('dark', 0.08),
  'accent-transparent': generateColorClass('accent', 0.08),
  'very-light': generateColorClass('very-light', 1),
  tab: generateColorClass('light', 0.7),
  'tab-hover': generateColorClass('brand', 0.2),
  'brand-active': generateColorClass('brand-active', 0.15),
}

// OLD COLORS. DO NOT USE. REMOVE BEFORE V2 MERGE.
const borderColor = {
  disabled: generateColorClass('dark', 0.03),
  inactive: generateColorClass('dark', 0.05),
  default: generateColorClass('dark', 0.15),
  focus: generateColorClass('dark', 0.25),
  selected: generateColorClass('dark', 0.25),
  error: generateColorClass('error', 0.6),
}

module.exports = {
  generateColorClass,
  colors,
  textColor,
  backgroundColor,
  borderColor,
}
