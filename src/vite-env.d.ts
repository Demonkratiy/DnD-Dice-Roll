/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Флаг режима «prod-view» (см. `.env.prodview` и `npm run dev:prodview`). */
  readonly VITE_PROD_VIEW?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
