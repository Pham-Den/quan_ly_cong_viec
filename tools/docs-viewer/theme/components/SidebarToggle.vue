<script setup>
import { ref, onMounted } from 'vue'

// A nav-bar button that hides/shows the whole left sidebar (the file tree) to reclaim horizontal
// space. State is on <html> (so it persists across page navigations) + remembered in localStorage.
const hidden = ref(false)

function apply() {
  document.documentElement.classList.toggle('prism-hide-sidebar', hidden.value)
}
function toggle() {
  hidden.value = !hidden.value
  apply()
  try {
    localStorage.setItem('prism-hide-sidebar', hidden.value ? '1' : '0')
  } catch {
    /* private mode */
  }
}
onMounted(() => {
  try {
    hidden.value = localStorage.getItem('prism-hide-sidebar') === '1'
  } catch {
    /* ignore */
  }
  apply()
})
</script>

<template>
  <button
    class="prism-sb-toggle"
    type="button"
    :title="hidden ? 'Show the file menu' : 'Hide the file menu'"
    :aria-pressed="hidden"
    @click="toggle"
  >
    {{ hidden ? '☰ Menu' : '⟨ Hide menu' }}
  </button>
</template>

<style scoped>
.prism-sb-toggle {
  margin-left: 12px;
  padding: 4px 11px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid var(--vp-c-divider, #ccc);
  border-radius: 6px;
  background: transparent;
  color: var(--vp-c-text-2);
  white-space: nowrap;
}
.prism-sb-toggle:hover {
  color: var(--vp-c-brand-1, #3451b2);
  border-color: var(--vp-c-brand-1, #3451b2);
}
/* The sidebar only shows on desktop; the toggle is pointless on mobile (off-canvas menu). */
@media (max-width: 959px) {
  .prism-sb-toggle {
    display: none;
  }
}
</style>
