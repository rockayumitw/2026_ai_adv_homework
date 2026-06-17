<script setup lang="ts">
/**
 * CodeEditor — CodeMirror 6 共用編輯器元件
 * 提供 JS 語法高亮、行號、括號匹配、Tab 縮排、autocomplete
 * 使用 One Dark 主題確保 WCAG 對比度
 */
import CodeMirror from 'vue-codemirror6'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { autocompletion } from '@codemirror/autocomplete'
import type { Extension } from '@codemirror/state'
import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete'

defineProps<{
  modelValue: string
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const lang = javascript()

/** 陣列方法補全 — 輸入 `.` 後提示 push/pop 等常用方法 */
function arrayMethodCompletion(ctx: CompletionContext): CompletionResult | null {
  // 匹配 `xxx.` 或 `xxx.p` 等 dot-access 模式
  const word = ctx.matchBefore(/\.\w*/)
  if (!word) return null

  const typed = word.text.slice(1) // 去掉開頭的 `.`

  const methods = [
    { label: 'push', type: 'method', detail: '(item) → 加到最後面', boost: 10 },
    { label: 'pop', type: 'method', detail: '() → 取出最後一個', boost: 9 },
    { label: 'length', type: 'property', detail: '陣列長度', boost: 5 },
    { label: 'shift', type: 'method', detail: '() → 取出第一個' },
    { label: 'unshift', type: 'method', detail: '(item) → 加到最前面' },
    { label: 'includes', type: 'method', detail: '(item) → 是否包含' },
    { label: 'indexOf', type: 'method', detail: '(item) → 找到位置' },
    { label: 'splice', type: 'method', detail: '(start, count) → 刪除/插入' },
    { label: 'slice', type: 'method', detail: '(start, end) → 截取子陣列' },
    { label: 'reverse', type: 'method', detail: '() → 反轉陣列' },
    { label: 'join', type: 'method', detail: '(sep) → 合併成字串' },
    { label: 'map', type: 'method', detail: '(fn) → 轉換每個元素' },
    { label: 'filter', type: 'method', detail: '(fn) → 過濾元素' },
    { label: 'reduce', type: 'method', detail: '(fn, init) → 累加' },
    { label: 'forEach', type: 'method', detail: '(fn) → 逐一執行' },
  ]

  return {
    from: word.from + 1, // 從 `.` 後面開始補全
    options: methods.filter((m) => m.label.startsWith(typed)),
  }
}

const extensions: Extension[] = [
  oneDark,
  autocompletion({ override: [arrayMethodCompletion] }),
]

function onUpdate(v: unknown) {
  emit('update:modelValue', typeof v === 'string' ? v : String(v))
}
</script>

<template>
  <CodeMirror
    :model-value="modelValue"
    :lang="lang"
    :extensions="extensions"
    :readonly="readonly ?? false"
    :tab="true"
    :dark="true"
    basic
    class="code-editor"
    @update:model-value="onUpdate"
  />
</template>

<style scoped>
.code-editor :deep(.cm-editor) {
  border-radius: 0.75rem;
  overflow: hidden;
  max-height: 320px;
}
.code-editor :deep(.cm-scroller) {
  overflow: auto;
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 14px;
  line-height: 1.7;
}
</style>
