export type AppEnv = {
  host: string
  port: number
  frontendOrigin: string
  databaseUrl: string
  jwtAccessSecret: string
  jwtRefreshSecret: string
  accessTokenMinutes: number
  refreshTokenDays: number
}

export function loadEnv(): AppEnv {
  return {
    host: process.env.BACKEND_HOST ?? '0.0.0.0',
    port: Number(process.env.BACKEND_PORT ?? 4000),
    frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
    databaseUrl: process.env.DATABASE_URL ?? 'file:./dev.db',
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access-secret',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh-secret',
    accessTokenMinutes: Number(process.env.JWT_ACCESS_MINUTES ?? 15),
    refreshTokenDays: Number(process.env.JWT_REFRESH_DAYS ?? 30),
  }
}
