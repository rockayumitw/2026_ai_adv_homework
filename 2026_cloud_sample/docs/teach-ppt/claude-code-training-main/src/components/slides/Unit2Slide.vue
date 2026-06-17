<script setup lang="ts">
/**
 * 單元 2：CLAUDE.md 與專案設定（對照實驗）
 */
import { ref, computed, watch, onMounted } from 'vue'
import InteractiveSlideTemplate from './InteractiveSlideTemplate.vue'

defineProps<{ isMobile?: boolean }>()
const emit = defineEmits<{ (e: 'complete'): void }>()

type StepView = 'intro' | 'control' | 'structure' | 'claudeMd' | 'experiment' | 'settings' | 'compare' | 'summary'
type Step = { id: number; view: StepView; title: string; desc: string }

const STEPS: Step[] = [
  { id: 0, view: 'intro',      title: '單元 2：讓 Claude 照你的規矩走', desc: '今天用對照實驗：無設定 vs 有設定，親眼看 Claude 的差別。' },
  { id: 1, view: 'control',    title: '對照組：什麼都不設定',         desc: '直接叫 Claude 做 BMI 網頁 —— 每個人拿到的風格都不同。' },
  { id: 2, view: 'structure',  title: '.claude 資料夾長這樣',         desc: 'settings.json 管權限、CLAUDE.md 管風格 —— 今天就用這兩個。' },
  { id: 3, view: 'claudeMd',   title: 'CLAUDE.md = 開發規範',         desc: '每次啟動自動被讀進去，像給新同事的風格指南。' },
  { id: 4, view: 'experiment', title: '實驗組：帶規範再做一次',        desc: '同樣的一句話，產出完全跟著你的規範走。' },
  { id: 5, view: 'settings',   title: 'settings.json = 權限',        desc: '信任的就放寬（Edit/Write），不信任的保留確認。' },
  { id: 6, view: 'compare',    title: '兩份設定檔的分工',             desc: 'CLAUDE.md 管「怎麼寫」、settings.json 管「能不能做」。' },
  { id: 7, view: 'summary',    title: '本單元重點',                  desc: '設定檔不是附加，而是 Claude 產出品質的決定因素。' },
]

const currentStep = ref(0)
const animState = ref(0)
const stepData = computed(() => STEPS[currentStep.value])

let timers: number[] = []
function clearTimers() { timers.forEach(t => clearTimeout(t)); timers = [] }
function schedule(fn: () => void, ms: number) { timers.push(window.setTimeout(fn, ms)) }
onMounted(() => triggerStepAnimation())
watch(currentStep, () => {
  clearTimers()
  animState.value = 0
  triggerStepAnimation()
})
function triggerStepAnimation() {
  animState.value = 1
  for (let i = 2; i <= 5; i++) schedule(() => { animState.value = i }, (i - 1) * 120)
}

function nextStep() { if (currentStep.value < STEPS.length - 1) currentStep.value++ }
function prevStep() { if (currentStep.value > 0) currentStep.value-- }

const fileTree = [
  { name: '.claude/',        icon: '📁', depth: 0, hint: '所有設定的家' },
  { name: 'settings.json',   icon: '🔐', depth: 1, hint: '權限：Claude 可以做什麼' },
  { name: 'CLAUDE.md',       icon: '📜', depth: 0, hint: '風格規範：Claude 怎麼做' },
]
</script>

<template>
  <InteractiveSlideTemplate
    title="單元 2｜CLAUDE.md 與專案設定"
    subtitle="對照實驗帶你看差異"
    :totalSteps="STEPS.length"
    :currentStep="currentStep"
    :stepTitle="stepData.title"
    :stepDesc="stepData.desc"
    themeColor="sky"
    @prev="prevStep"
    @next="nextStep"
    @goto="(s) => (currentStep = s)"
    @complete="emit('complete')"
  >
    <template #icon><span class="text-2xl md:text-3xl">⚙️</span></template>

    <div class="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute left-[12%] top-[20%] h-64 w-64 rounded-full bg-sky-500/10 blur-3xl"></div>
      </div>

      <!-- INTRO -->
      <div v-if="stepData.view === 'intro'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center p-6">
        <div class="rounded-3xl border-2 border-sky-500/40 bg-slate-900/90 px-10 py-8 text-center shadow-2xl">
          <div class="text-6xl">⚙️</div>
          <div class="mt-3 text-4xl font-black text-white">單元 <span class="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">2</span></div>
          <div class="mt-2 text-lg text-slate-300">CLAUDE.md 與專案設定</div>
          <div class="mt-1 text-sm text-slate-500">對照實驗法 · BMI 網頁 · 親眼見證</div>
        </div>
        <div class="mt-6 flex items-center gap-4">
          <div class="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">🧪 對照組（沒設定）</div>
          <div class="text-xl text-slate-500">VS</div>
          <div class="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">🧪 實驗組（有設定）</div>
        </div>
      </div>

      <!-- CONTROL -->
      <div v-if="stepData.view === 'control'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6">
        <div class="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-900 p-4">
          <div class="text-xs text-slate-500">你對 Claude 說：</div>
          <div class="mt-1 font-mono text-sm text-sky-300">「幫我做一個 BMI 計算網頁」</div>
        </div>
        <div class="grid w-full max-w-4xl grid-cols-3 gap-3">
          <div v-for="(s, i) in [
            { title: '同事 A 的版本', bg: 'from-pink-500/20 to-pink-500/5',  label: '粉紅 · 英文' },
            { title: '同事 B 的版本', bg: 'from-slate-700/40 to-slate-700/0', label: '深色 · 中文' },
            { title: '同事 C 的版本', bg: 'from-amber-500/20 to-amber-500/5', label: '淺色 · 簡體' },
          ]" :key="s.title"
            class="rounded-xl border border-slate-700 p-3 transition-all duration-500"
            :class="[`bg-gradient-to-br ${s.bg}`, animState >= i + 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0']"
          >
            <div class="mb-2 text-xs text-slate-400">{{ s.title }}</div>
            <div class="flex h-20 items-center justify-center rounded bg-slate-950/60 text-xs text-slate-300">
              BMI 頁面
            </div>
            <div class="mt-2 text-center text-xs text-slate-400">{{ s.label }}</div>
          </div>
        </div>
        <div class="rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-3 text-center text-sm text-amber-200">
          😵 每個人都不一樣 —— 一致性？沒有。
        </div>
      </div>

      <!-- STRUCTURE -->
      <div v-if="stepData.view === 'structure'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center p-6">
        <div class="w-full max-w-2xl rounded-2xl border border-sky-500/30 bg-slate-950 p-5 font-mono text-sm">
          <div v-for="(f, i) in fileTree" :key="f.name"
            class="flex items-center justify-between border-b border-slate-800 py-2 transition-all duration-500"
            :class="animState >= i + 1 ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'"
          >
            <div class="flex items-center gap-2">
              <span :style="{ paddingLeft: f.depth * 20 + 'px' }">{{ f.icon }}</span>
              <span class="text-sky-300">{{ f.name }}</span>
            </div>
            <span class="text-xs text-slate-500">{{ f.hint }}</span>
          </div>
        </div>
      </div>

      <!-- CLAUDE.md -->
      <div v-if="stepData.view === 'claudeMd'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center p-6">
        <div class="w-full max-w-2xl overflow-hidden rounded-2xl border-2 border-sky-500/50 bg-slate-950 shadow-2xl">
          <div class="flex items-center gap-2 border-b border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-400">
            📜 CLAUDE.md
          </div>
          <pre class="p-5 font-mono text-sm leading-7 text-slate-300"># 開發規範
- 語言：<span class="text-sky-300">繁體中文台灣用語</span>
- CSS 風格：<span class="text-sky-300">深色主題（#0f172a）</span>
- 所有函式要加<span class="text-sky-300">中文註解</span>
- 網頁要<span class="text-sky-300">支援手機畫面</span></pre>
        </div>
        <div class="mt-5 max-w-xl rounded-xl border border-sky-500/30 bg-slate-900/80 px-5 py-3 text-center text-sm text-slate-300">
          開新對話時 Claude 會<span class="font-bold text-sky-300">載入一次</span>，像新同事拿到的 guideline
        </div>
        <div class="mt-3 max-w-xl rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-2 text-center text-xs text-amber-200">
          ⚠️ 寫得<span class="font-bold text-white">精準、簡短</span> —— 太長會吃掉 context 額度，後面對話容易失真
        </div>
      </div>

      <!-- EXPERIMENT -->
      <div v-if="stepData.view === 'experiment'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6">
        <div class="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-900 p-4">
          <div class="text-xs text-slate-500">同樣的指令：</div>
          <div class="mt-1 font-mono text-sm text-sky-300">「幫我做一個 BMI 計算網頁」</div>
        </div>
        <div class="grid w-full max-w-4xl grid-cols-3 gap-3">
          <div v-for="(s, i) in 3" :key="s"
            class="rounded-xl border-2 border-sky-500/40 bg-gradient-to-br from-slate-900 to-slate-800 p-3 transition-all duration-500"
            :class="animState >= i + 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
          >
            <div class="mb-2 text-xs text-slate-400">同事 {{ ['A','B','C'][i] }}</div>
            <div class="flex h-20 items-center justify-center rounded bg-slate-950 text-xs text-sky-300">
              深色 · 中文
            </div>
            <div class="mt-2 text-center text-xs text-sky-300">✓ 規範</div>
          </div>
        </div>
        <div class="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 text-center text-sm text-emerald-200">
          ✨ 三個人的產出一致 —— 這就是 CLAUDE.md 的威力
        </div>
      </div>

      <!-- SETTINGS -->
      <div v-if="stepData.view === 'settings'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center p-6">
        <div class="w-full max-w-2xl overflow-hidden rounded-2xl border-2 border-sky-500/50 bg-slate-950 shadow-2xl">
          <div class="border-b border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-400">🔐 .claude/settings.json</div>
          <pre class="p-5 font-mono text-xs text-slate-300">{
  "permissions": {
    "allow": [
      <span class="text-emerald-300">"Edit"</span>,
      <span class="text-emerald-300">"Write"</span>,
      <span class="text-emerald-300">"Bash(node:*)"</span>,
      <span class="text-emerald-300">"Bash(git add:*)"</span>,
      <span class="text-emerald-300">"Bash(git commit:*)"</span>
    ]
  }
}</pre>
        </div>
        <div class="mt-4 flex gap-3 text-xs">
          <div class="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-emerald-200">✅ 信任的放 allow</div>
          <div class="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-200">❌ 不寫 Bash(*) 通殺</div>
        </div>
      </div>

      <!-- COMPARE -->
      <div v-if="stepData.view === 'compare'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center p-6">
        <div class="grid w-full max-w-4xl gap-4 md:grid-cols-2">
          <div class="rounded-2xl border border-sky-500/40 bg-slate-900/80 p-5 transition-all duration-700"
            :class="animState >= 1 ? 'translate-x-0 opacity-100' : '-translate-x-6 opacity-0'"
          >
            <div class="text-3xl">📜</div>
            <div class="mt-2 text-lg font-bold text-sky-300">CLAUDE.md</div>
            <div class="mt-1 text-sm text-slate-400">管「<span class="text-white">怎麼寫</span>」</div>
            <div class="mt-3 text-xs text-slate-500">風格、命名、註解、框架</div>
            <div class="mt-2 text-xs text-sky-300">≈ coding guideline</div>
          </div>
          <div class="rounded-2xl border border-emerald-500/40 bg-slate-900/80 p-5 transition-all duration-700"
            :class="animState >= 2 ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'"
          >
            <div class="text-3xl">🔐</div>
            <div class="mt-2 text-lg font-bold text-emerald-300">settings.json</div>
            <div class="mt-1 text-sm text-slate-400">管「<span class="text-white">能不能做</span>」</div>
            <div class="mt-3 text-xs text-slate-500">編輯權限、Bash 白名單</div>
            <div class="mt-2 text-xs text-emerald-300">≈ 公司權限管理</div>
          </div>
        </div>
      </div>

      <!-- SUMMARY -->
      <div v-if="stepData.view === 'summary'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6">
        <div class="rounded-3xl border-2 border-sky-500/50 bg-slate-900 p-6 text-center">
          <div class="text-6xl">🎯</div>
          <div class="mt-3 text-2xl font-bold text-white">記住這句話</div>
          <div class="mt-2 text-sm text-slate-400">設定檔決定產出品質</div>
        </div>
        <div class="grid w-full max-w-3xl gap-3 md:grid-cols-3">
          <div v-for="(t, i) in ['CLAUDE.md → 風格','settings.json → 權限','每個專案都要寫']" :key="t"
            class="rounded-xl border border-sky-500/30 bg-slate-900/60 p-3 text-center text-sm text-sky-200 transition-all duration-500"
            :class="animState >= i + 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
          >✓ {{ t }}</div>
        </div>
      </div>
    </div>
  </InteractiveSlideTemplate>
</template>
