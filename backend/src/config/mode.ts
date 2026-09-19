/** Demo UI/data — only when explicitly enabled (never in LAMIX production mode). */
export function isDemoMode(): boolean {
  if (process.env.LAMIX_MODE === 'production') {
    return false;
  }
  return process.env.DEMO_MODE === 'true';
}

export function isProductionMode(): boolean {
  return process.env.LAMIX_MODE === 'production';
}

export function getAppMode(): 'production' | 'demo' | 'development' {
  if (isProductionMode()) return 'production';
  if (isDemoMode()) return 'demo';
  return 'development';
}
