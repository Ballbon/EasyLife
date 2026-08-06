<script setup lang="ts">
defineProps<{
  type?: "cards" | "list" | "table" | "chart" | "dashboard";
  count?: number;
}>();
</script>

<template>
  <div class="skeleton-wrapper">
    <template v-if="type === 'cards'">
      <VRow>
        <VCol
          v-for="n in (count || 3)"
          :key="n"
          cols="12"
          sm="6"
          md="4"
        >
          <VSkeletonLoader
            type="article"
            class="border rounded-lg"
            elevation="0"
          />
        </VCol>
      </VRow>
    </template>

    <template v-else-if="type === 'list'">
      <VCard class="border" elevation="0">
        <VList lines="two">
          <VSkeletonLoader
            v-for="n in (count || 4)"
            :key="n"
            type="list-item-avatar-two-line"
            class="px-4 py-2"
          />
        </VList>
      </VCard>
    </template>

    <template v-else-if="type === 'dashboard'">
      <VRow class="mb-6">
        <VCol v-for="n in 3" :key="n" cols="12" md="4">
          <VSkeletonLoader type="card" class="border rounded-lg" elevation="0" />
        </VCol>
      </VRow>
      <VRow>
        <VCol cols="12" md="8">
          <VSkeletonLoader type="image" class="border rounded-lg" elevation="0" height="280" />
        </VCol>
        <VCol cols="12" md="4">
          <VSkeletonLoader type="article" class="border rounded-lg" elevation="0" height="280" />
        </VCol>
      </VRow>
    </template>

    <template v-else>
      <VSkeletonLoader
        type="table-row-divider@4"
        class="border rounded-lg"
        elevation="0"
      />
    </template>
  </div>
</template>
