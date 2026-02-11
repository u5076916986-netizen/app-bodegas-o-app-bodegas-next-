export type ThemeTokens = {
  brand: {
    primary: string;
    secondary: string;
    accent: string;
  };
  surface: {
    bg: string;
    card: string;
    border: string;
  };
  text: {
    strong: string;
    normal: string;
    muted: string;
  };
  ui: {
    buttonRadius: string;
    cardRadius: string;
    shadow: string;
  };
  effects: {
    gradient: string;
    pattern?: string;
    logoGlow?: string;
  };
};

export type ThemeConfig = {
  bodegaId: string;
  name?: string;
  theme: ThemeTokens;
};
