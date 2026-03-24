/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly GROQ_API_KEY_1: string;
  readonly GROQ_API_KEY_2: string;
  readonly GROQ_API_KEY_3: string;
  readonly GROQ_API_KEY_4: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
