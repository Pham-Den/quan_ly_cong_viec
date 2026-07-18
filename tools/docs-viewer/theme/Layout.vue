<script setup>
import DefaultTheme from 'vitepress/theme'
import SidebarToggle from './components/SidebarToggle.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <!-- Add a "hide menu" toggle into the nav bar (next to the dark-mode switch). -->
    <template #nav-bar-content-after>
      <SidebarToggle />
    </template>
  </Layout>
</template>
