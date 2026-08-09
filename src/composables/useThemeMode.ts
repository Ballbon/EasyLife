import { ref, watch, onMounted, onUnmounted } from "vue";
import { useTheme } from "vuetify";

export type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "easylife_theme_mode";

export function useThemeMode() {
  const theme = useTheme();
  const initialMode =
    typeof window !== "undefined" && typeof localStorage !== "undefined"
      ? (localStorage.getItem(STORAGE_KEY) as ThemeMode) || "system"
      : "system";
  const mode = ref<ThemeMode>(initialMode);

  function getSystemTheme(): "materioDark" | "materioLight" {
    if (typeof window === "undefined" || !window.matchMedia) {
      return "materioLight";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "materioDark"
      : "materioLight";
  }

  function applyTheme(targetMode: ThemeMode) {
    let targetTheme: "materioDark" | "materioLight";
    if (targetMode === "system") {
      targetTheme = getSystemTheme();
    } else {
      targetTheme = targetMode === "dark" ? "materioDark" : "materioLight";
    }
    if (theme?.global?.name) {
      theme.global.name.value = targetTheme;
    }
  }

  function setMode(newMode: ThemeMode) {
    mode.value = newMode;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newMode);
    }
    applyTheme(newMode);
  }

  function toggleMode() {
    const nextMode: ThemeMode =
      mode.value === "light"
        ? "dark"
        : mode.value === "dark"
          ? "system"
          : "light";
    setMode(nextMode);
  }

  let mediaQueryList: MediaQueryList | null = null;
  function handleSystemChange() {
    if (mode.value === "system") {
      applyTheme("system");
    }
  }

  onMounted(() => {
    applyTheme(mode.value);
    if (typeof window !== "undefined" && window.matchMedia) {
      mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQueryList.addEventListener("change", handleSystemChange);
    }
  });

  onUnmounted(() => {
    if (mediaQueryList) {
      mediaQueryList.removeEventListener("change", handleSystemChange);
    }
  });

  watch(mode, (newMode) => {
    applyTheme(newMode);
  });

  return {
    mode,
    setMode,
    toggleMode,
  };
}
