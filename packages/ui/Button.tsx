'use client';

import { CSSProperties, ReactNode } from 'react';
import { tokens } from './tokens';

// ============================================================
// Button — 사장님 취향 #1: 사각 둥근 모서리 8-12px (원형 ❌)
// ============================================================

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  style?: CSSProperties;
}

const variantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    backgroundColor: tokens.color.primary,
    color: '#FFFFFF',
    border: 'none',
  },
  secondary: {
    backgroundColor: tokens.color.neutral[100],
    color: tokens.color.neutral[900],
    border: 'none',
  },
  outline: {
    backgroundColor: 'transparent',
    color: tokens.color.primary,
    border: `1px solid ${tokens.color.neutral[200]}`,
  },
  ghost: {
    backgroundColor: 'transparent',
    color: tokens.color.primary,
    border: 'none',
  },
};

const sizeStyles: Record<ButtonSize, CSSProperties> = {
  sm: { padding: `${tokens.spacing.sm} ${tokens.spacing.md}`, fontSize: '14px', borderRadius: tokens.radius.button },
  md: { padding: `${tokens.spacing.md} ${tokens.spacing.lg}`, fontSize: '16px', borderRadius: tokens.radius.button },
  lg: { padding: `${tokens.spacing.lg} ${tokens.spacing.xl}`, fontSize: '18px', borderRadius: tokens.radius.buttonLg },
};

export function Button({ variant = 'primary', size = 'md', children, onClick, disabled, type = 'button', style }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
        fontFamily: tokens.font.sans,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: tokens.transition.fast,
      }}
    >
      {children}
    </button>
  );
}
