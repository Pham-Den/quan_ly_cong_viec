<script setup lang="ts">
import viVN from 'ant-design-vue/es/locale/vi_VN'
import { RouterView } from 'vue-router'
</script>

<template>
  <a-config-provider :locale="viVN">
    <RouterView />
  </a-config-provider>
</template>
