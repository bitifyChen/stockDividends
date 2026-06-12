<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import openapi from '../../../docs/openapi.json'
import 'swagger-ui-dist/swagger-ui.css'

const swaggerRef = ref(null)
let swaggerInstance = null

onMounted(async () => {
  const [{ default: SwaggerUIBundle }, { default: SwaggerUIStandalonePreset }] = await Promise.all([
    import('swagger-ui-dist/swagger-ui-bundle.js'),
    import('swagger-ui-dist/swagger-ui-standalone-preset.js')
  ])

  swaggerInstance = SwaggerUIBundle({
    domNode: swaggerRef.value,
    spec: openapi,
    deepLinking: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    showExtensions: true,
    showCommonExtensions: true,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    layout: 'StandaloneLayout'
  })
})

onBeforeUnmount(() => {
  if (swaggerInstance?.destroy) swaggerInstance.destroy()
  swaggerInstance = null
})
</script>

<template>
  <div ref="swaggerRef" class="api-docs-shell"></div>
</template>

<style scoped>
.api-docs-shell {
  max-width: 100%;
  overflow-x: auto;
}

.api-docs-shell :deep(.swagger-ui) {
  min-width: 0;
  color: #d7e1ed;
}

.api-docs-shell :deep(.swagger-ui .wrapper) {
  max-width: 100%;
  padding: 0;
}

.api-docs-shell :deep(.swagger-ui .information-container),
.api-docs-shell :deep(.swagger-ui .scheme-container),
.api-docs-shell :deep(.swagger-ui .opblock),
.api-docs-shell :deep(.swagger-ui .model-box),
.api-docs-shell :deep(.swagger-ui table) {
  max-width: 100%;
}

.api-docs-shell :deep(.swagger-ui .parameters-container),
.api-docs-shell :deep(.swagger-ui .responses-wrapper),
.api-docs-shell :deep(.swagger-ui .model-container),
.api-docs-shell :deep(.swagger-ui .highlight-code) {
  overflow-x: auto;
}

@media (max-width: 720px) {
  .api-docs-shell :deep(.swagger-ui .info .title) {
    font-size: 24px;
    line-height: 1.15;
  }

  .api-docs-shell :deep(.swagger-ui .opblock-summary) {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
}
</style>

<route>
{
  name: "Dashboard_Api",
  meta: {
    layout: "dashboard",
    requiresAuth: true
  }
}
</route>
