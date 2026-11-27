// Tipo do import.meta.glob do Vite (usado pela tela Ajuda para carregar docs/manual/*.md).
interface ImportMeta {
  glob<T = unknown>(pattern: string | string[], options: { query?: string; import?: string; eager: true }): Record<string, T>;
  glob<T = unknown>(pattern: string | string[], options?: { query?: string; import?: string; eager?: false }): Record<string, () => Promise<T>>;
}
