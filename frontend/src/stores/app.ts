import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    selectedProjectId: null as string | null,
  }),
  actions: {
    selectProject(projectId: string | null) {
      this.selectedProjectId = projectId
    },
  },
})
