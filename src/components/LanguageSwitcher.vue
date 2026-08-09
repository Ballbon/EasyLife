<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale, type SupportedLocale } from '@/i18n'

const { locale } = useI18n()

const currentLocale = computed({
  get: () => locale.value as SupportedLocale,
  set: (val: SupportedLocale) => {
    setLocale(val)
  },
})

function toggleLocale() {
  const nextLocale = currentLocale.value === 'th' ? 'en' : 'th'
  setLocale(nextLocale)
}
</script>

<template>
  <v-btn
    variant="text"
    density="comfortable"
    icon
    @click="toggleLocale"
    title="Change Language / เปลี่ยนภาษา"
  >
    <span class="text-subtitle-2 font-weight-bold">
      {{ currentLocale.toUpperCase() }}
    </span>
  </v-btn>
</template>
