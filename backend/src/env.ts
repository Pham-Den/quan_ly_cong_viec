export type AppEnv = {
  host: string
  port: number
  frontendOrigin: string
  databaseUrl: string
}

export function loadEnv(): AppEnv {
  return {
    host: process.env.BACKEND_HOST ?? '0.0.0.0',
    port: Number(process.env.BACKEND_PORT ?? 4000),
    frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
    databaseUrl: process.env.DATABASE_URL ?? 'file:./dev.db',
  }
}
