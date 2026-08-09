import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { useThemeMode } from "./useThemeMode";

const mockThemeName = ref("materioLight");

vi.mock("vuetify", () => ({
  useTheme: () => ({
    global: {
      name: mockThemeName,
    },
  }),
}));

describe("useThemeMode", () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    mockThemeName.value = "materioLight";

    Object.defineProperty(window, "localStorage", {
      writable: true,
      value: {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value;
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
      },
    });

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("defaults to system mode", () => {
    const { mode } = useThemeMode();
    expect(mode.value).toBe("system");
  });

  it("toggles modes correctly: system -> light -> dark -> system", () => {
    const { mode, toggleMode } = useThemeMode();
    expect(mode.value).toBe("system");

    toggleMode();
    expect(mode.value).toBe("light");
    expect(localStorage.getItem("easylife_theme_mode")).toBe("light");

    toggleMode();
    expect(mode.value).toBe("dark");
    expect(localStorage.getItem("easylife_theme_mode")).toBe("dark");

    toggleMode();
    expect(mode.value).toBe("system");
  });

  it("applies theme mode explicitly via setMode", () => {
    const { mode, setMode } = useThemeMode();
    setMode("dark");
    expect(mode.value).toBe("dark");
    expect(mockThemeName.value).toBe("materioDark");
  });
});
