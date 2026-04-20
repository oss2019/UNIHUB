import { useEffect } from "react";
import { useStore } from "@/lib/store";

export function ThemeController() {
  const isDark = useStore((s) => s.isDark);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);
  return null;
}
