import { useEffect } from "react";
import { useUI } from "@/lib/uiStore";

export function ThemeController() {
  const isDark = useUI((s) => s.isDark);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);
  return null;
}
