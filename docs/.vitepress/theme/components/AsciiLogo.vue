<template>
  <div class="ascii-logo-wrapper">
    <pre class="ascii-logo">{{ logo }}</pre>
  </div>
</template>

<script setup lang="ts">
const logo = `
 ██╗   ██╗██╗████████╗
 ██║   ██║██║╚══██╔══╝
 ██║   ██║██║   ██║
 ╚██╗ ██╔╝██║   ██║
  ╚████╔╝ ██║   ██║
   ╚═══╝  ╚═╝   ╚═╝`
</script>

<style scoped>
.ascii-logo-wrapper {
  display: flex;
  justify-content: center;
  padding-top: 2rem;
}

.ascii-logo {
  font-family: 'Courier New', Courier, monospace;
  font-size: 1.1rem;
  line-height: 1.2;
  text-align: center;
  white-space: pre;
  color: var(--vp-c-brand-1);
  margin: 0;
  padding: 0;
  background: none;
  border: none;
}

@media (max-width: 640px) {
  .ascii-logo {
    font-size: 0.7rem;
  }
}
</style>
