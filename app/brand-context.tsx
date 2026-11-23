"use client";

// Marca da empresa disponível em todas as telas. O servidor manda a marca já carregada (sem piscar)
// e a tela "Marca" atualiza aqui na hora, sem recarregar a página.
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DEFAULT_BRAND, brandCss } from "./brand-theme";

export type PublicBrand = { name: string; shortName: string; tagline: string; color: string; logoUrl: string | null; updatedAt: string | null };

export const DEFAULT_PUBLIC_BRAND: PublicBrand = { name: DEFAULT_BRAND.name, shortName: DEFAULT_BRAND.shortName, tagline: DEFAULT_BRAND.tagline, color: DEFAULT_BRAND.color, logoUrl: null, updatedAt: null };

type BrandState = { brand: PublicBrand; setBrand: (brand: PublicBrand) => void };
const BrandContext = createContext<BrandState>({ brand: DEFAULT_PUBLIC_BRAND, setBrand: () => undefined });

export const BRAND_STYLE_ID = "brand-theme";

/** Aplica as cores da marca na página (usado também na pré-visualização da tela "Marca"). */
export function applyBrandColor(color: string) {
  const style = document.getElementById(BRAND_STYLE_ID);
  if (style) style.textContent = brandCss(color);
}

export function BrandProvider({ initial, children }: { initial: PublicBrand; children: React.ReactNode }) {
  const [brand, setState] = useState(initial);
  const setBrand = useCallback((next: PublicBrand) => {
    setState((previous) => {
      if (document.title === previous.name || !document.title) document.title = next.name;
      return next;
    });
    applyBrandColor(next.color);
  }, []);
  const value = useMemo(() => ({ brand, setBrand }), [brand, setBrand]);
  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export const useBrand = () => useContext(BrandContext);

/** Só logo com partes transparentes ganha fundo branco (para não sumir no menu escuro); logo cheio fica sem contorno. */
function markLogoBackdrop(image: HTMLImageElement | null) {
  if (!image?.complete || !image.naturalWidth) return;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 24;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(image, 0, 0, 24, 24);
    const { data } = context.getImageData(0, 0, 24, 24);
    let transparent = false;
    for (let index = 3; index < data.length && !transparent; index += 4) transparent = data[index] < 245;
    if (transparent) image.dataset.backdrop = "1";
    else delete image.dataset.backdrop;
  } catch { /* sem leitura da imagem: fica sem fundo */ }
}

/** Logo da empresa, ou o ícone padrão quando não há logo. */
export function BrandLogo({ fallback, className }: { fallback: React.ReactNode; className?: string }) {
  const { brand } = useBrand();
  // eslint-disable-next-line @next/next/no-img-element
  return brand.logoUrl ? <img ref={markLogoBackdrop} onLoad={(event) => markLogoBackdrop(event.currentTarget)} className={className ? `${className} brand-logo-img` : "brand-logo-img"} src={brand.logoUrl} alt="" /> : <>{fallback}</>;
}
