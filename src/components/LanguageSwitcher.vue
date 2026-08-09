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
  locale.value = nextLocale
  setLocale(nextLocale)
}
</script>

<template>
  <VBtn
    variant="text"
    density="comfortable"
    icon
    :aria-label="$t('common.language')"
    :title="$t('common.language')"
    @click="toggleLocale"
  >
    <span class="text-subtitle-2 font-weight-bold">
      {{ currentLocale.toUpperCase() }}
    </span>
  </VBtn>
</template>
