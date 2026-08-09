import { onMounted, onUnmounted, ref } from "vue";

export function useNetworkStatus() {
  const isOnline = ref(typeof window !== "undefined" ? window.navigator.onLine : true);

  function updateOnlineStatus() {
    isOnline.value = window.navigator.onLine;
  }

  onMounted(() => {
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
  });

  onUnmounted(() => {
    window.removeEventListener("online", updateOnlineStatus);
    window.removeEventListener("offline", updateOnlineStatus);
  });

  return { isOnline };
}
