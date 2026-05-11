<template>
  <div class="sc">
    <span class="sc__label">{{ label }}</span>
    <span class="sc__value">{{ value }}</span>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], required: true },
})
</script>

<style scoped>
.sc {
  padding: 28px 32px;
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}
.sc__label {
  display: block;
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}
.sc__value {
  font-family: var(--font-title);
  font-size: 36px;
  font-weight: 400;
  color: var(--color-black);
}
</style>
