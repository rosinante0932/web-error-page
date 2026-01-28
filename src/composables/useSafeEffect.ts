import { onMounted, onUnmounted } from 'vue';

export function useSafeEffect(callback: () => void) {
  let rafId: number | null = null;

  onMounted(() => {
    rafId = window.requestAnimationFrame(() => {
      try {
        callback();
      } catch (error) {
        // 错误会被全局拦截器捕获
        throw error;
      }
    });
  });

  onUnmounted(() => {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
    }
  });
}