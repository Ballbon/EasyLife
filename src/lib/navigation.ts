import { useRouter } from "vue-router";

export function useAppNavigation() {
  const router = useRouter();

  function goBack(fallbackPath = "/dashboard") {
    if (window.history.state?.back) {
      router.back();
    } else {
      router.push(fallbackPath);
    }
  }

  return { goBack };
}
