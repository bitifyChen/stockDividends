<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import openapi from '../../../docs/openapi.json'
import 'swagger-ui-dist/swagger-ui.css'

const swaggerRef = ref(null)
let swaggerInstance = null

onMounted(async () => {
  const [{ default: SwaggerUIBundle }, { default: SwaggerUIStandalonePreset }] =
    await Promise.all([
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
    <div ref="swaggerRef"></div>
</template>

<route>
{
  name: "Dashboard_Api",
  meta: {
    layout: "dashboard",
    requiresAuth: true
  }
}
</route>
