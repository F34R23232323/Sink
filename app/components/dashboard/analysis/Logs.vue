<script setup lang="ts">
import type { LogEvent } from '@/types'

const id = inject(LINK_ID_KEY, computed(() => undefined))
const analysisStore = useDashboardAnalysisStore()
const { t } = useI18n()
const { locale } = useI18n()

const loading = shallowRef(false)
const error = shallowRef(false)
const hasLoaded = shallowRef(false)
const logs = ref<LogEvent[]>([])

async function loadLogs() {
  const controller = new AbortController()
  loading.value = true
  error.value = false
  try {
    const data = await useAPI<LogEvent[]>('/api/logs/events', {
      signal: controller.signal,
      query: {
        ...analysisStore.filters,
        id: id.value,
        startAt: analysisStore.dateRange.startAt,
        endAt: analysisStore.dateRange.endAt,
        limit: 100
      },
    })
    if (!controller.signal.aborted) {
      logs.value = data
      hasLoaded.value = true
    }
  }
  catch (e) {
    if (!controller.signal.aborted)
      error.value = true
  }
  finally {
    if (!controller.signal.aborted)
      loading.value = false
  }
}

watch([() => analysisStore.dateRange, () => analysisStore.filters], () => {
  void loadLogs()
}, { immediate: true })

function formatTime(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString(locale.value, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}
</script>

<template>
  <Card class="flex flex-col">
    <CardHeader>
      <CardTitle><h2>{{ $t('dashboard.logs.title', 'Request Logs') }}</h2></CardTitle>
    </CardHeader>
    <CardContent class="relative flex-1 min-h-[300px]" :aria-busy="loading">
      <div
        v-if="error"
        class="absolute inset-0 flex flex-col items-center justify-center gap-4 text-sm text-destructive"
        role="alert"
      >
        <span>{{ $t('dashboard.realtime.stats_error') }}</span>
        <Button
          type="button"
          variant="link"
          size="sm"
          class="text-destructive"
          @click="loadLogs"
        >
          {{ $t('common.try_again') }}
        </Button>
      </div>
      <div
        v-else-if="loading && !hasLoaded"
        class="absolute inset-0 flex items-center justify-center"
      >
        <span class="text-sm text-muted-foreground">{{ $t('dashboard.loading') }}</span>
      </div>
      <div
        v-else-if="hasLoaded && !logs.length"
        class="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground"
      >
        {{ $t('dashboard.no_data') }}
      </div>
      <div v-else-if="hasLoaded" class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ $t('dashboard.logs.time', 'Time') }}</TableHead>
              <TableHead>{{ $t('dashboard.logs.ip', 'IP Address') }}</TableHead>
              <TableHead>{{ $t('dashboard.logs.location', 'Location') }}</TableHead>
              <TableHead>{{ $t('dashboard.logs.browser', 'Browser') }}</TableHead>
              <TableHead>{{ $t('dashboard.logs.os', 'OS') }}</TableHead>
              <TableHead>{{ $t('dashboard.logs.referer', 'Referer') }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="log in logs" :key="log.id">
              <TableCell class="whitespace-nowrap">{{ formatTime(log.timestamp) }}</TableCell>
              <TableCell class="font-mono text-xs">{{ log.ip || '-' }}</TableCell>
              <TableCell>{{ [log.city, log.country].filter(Boolean).join(', ') || '-' }}</TableCell>
              <TableCell>{{ log.browser || '-' }}</TableCell>
              <TableCell>{{ log.os || '-' }}</TableCell>
              <TableCell class="max-w-[200px] truncate" :title="log.referer">
                {{ log.referer || '-' }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
</template>
