<script setup lang="ts">
/**
 * 單元 5：綜合補充 — 實戰技巧與進階用法
 */
import { ref, computed, watch, onMounted } from 'vue'
import InteractiveSlideTemplate from './InteractiveSlideTemplate.vue'

defineProps<{ isMobile?: boolean }>()
const emit = defineEmits<{ (e: 'complete'): void }>()

type StepView = 'intro' | 'debug' | 'readCode' | 'context' | 'skillLevel' | 'cases' | 'mcp' | 'roadmap'
type Step = { id: number; view: StepView; title: string; desc: string }

const STEPS: Step[] = [
  { id: 0, view: 'intro',      title: '單元 5：綜合補充',            desc: '三個日常實戰技巧 + 六個 Skill 實案 + MCP 的世界。' },
  { id: 1, view: 'debug',      title: 'Debug 工作流',                desc: '貼錯誤訊息、給重現步驟、指向相關檔案 —— 這才是好的 debug 對話。' },
  { id: 2, view: 'readCode',   title: '讀懂別人的程式碼',            desc: '接手專案？讓 Claude 帶你導覽，問它「這個函式在做什麼」。' },
  { id: 3, view: 'context',    title: 'Context 管理三原則',          desc: '換主題就 /clear、一次一件事、重要規範寫進 CLAUDE.md。' },
  { id: 4, view: 'skillLevel', title: 'Skill 的進階用法',            desc: 'Skill 不只能下指令，還能呼叫你寫的腳本 —— 能做的事就爆炸了。' },
  { id: 5, view: 'cases',      title: '六個真實案例',                desc: 'Word/Excel、API 串接、路線規劃、瀏覽器自動化、播報、電子發票。' },
  { id: 6, view: 'mcp',        title: 'MCP：別人已經幫你寫好了',      desc: 'Canva、Figma、GitHub、Slack —— 裝上就能用，不用自己寫腳本。' },
  { id: 7, view: 'roadmap',    title: '五單元總回顧',                desc: '從「隨便寫」到「規範寫」到「自動化」—— 你已經走完整條路。' },
]

const currentStep = ref(0)
const animState = ref(0)
const stepData = computed(() => STEPS[currentStep.value])
const caseIdx = ref(0)

const cases = [
  { icon: '📄', title: 'Word / Excel 產出', desc: 'Skill 呼叫 docx/xlsx 套件，一句話產會議紀錄' },
  { icon: '📅', title: 'Google 日曆',       desc: 'Skill 呼叫 Calendar API，自動找空檔安排' },
  { icon: '🗺️', title: '路線規劃',          desc: '「下週要去三家客戶」→ 自動排順序算時間' },
  { icon: '🌐', title: '瀏覽器自動化',      desc: '登入後台、填表、抓報表 —— 完全自動跑' },
  { icon: '📢', title: '晨報播報到 Discord', desc: '每天早上八點自動推：昨天 commit / 今日進度' },
  { icon: '🧾', title: '電子發票 CSV',       desc: '「這張發票 5000 元」→ 產出財政部格式' },
]

let timers: number[] = []
function clearTimers() { timers.forEach(t => clearTimeout(t)); timers = [] }
function schedule(fn: () => void, ms: number) { timers.push(window.setTimeout(fn, ms)) }
onMounted(() => triggerStepAnimation())
watch(currentStep, () => {
  clearTimers()
  animState.value = 0
  caseIdx.value = 0
  triggerStepAnimation()
})
function triggerStepAnimation() {
  animState.value = 1
  for (let i = 2; i <= 6; i++) schedule(() => { animState.value = i }, (i - 1) * 110)
}
function nextStep() { if (currentStep.value < STEPS.length - 1) currentStep.value++ }
function prevStep() { if (currentStep.value > 0) currentStep.value-- }
</script>

<template>
  <InteractiveSlideTemplate
    title="單元 5｜綜合補充"
    subtitle="實戰技巧與進階用法"
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
    <template #icon><span class="text-2xl md:text-3xl">🚀</span></template>

    <div class="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute left-[10%] top-[15%] h-64 w-64 rounded-full bg-sky-500/10 blur-3xl"></div>
        <div class="absolute right-[10%] top-[50%] h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl"></div>
      </div>

      <!-- INTRO -->
      <div v-if="stepData.view === 'intro'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center p-6">
        <div class="rounded-3xl border-2 border-sky-500/40 bg-slate-900/90 px-10 py-8 text-center shadow-2xl">
          <div class="text-6xl">🚀</div>
          <div class="mt-3 text-4xl font-black text-white">單元 <span class="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">5</span></div>
          <div class="mt-2 text-lg text-slate-300">綜合補充 · 實戰技巧</div>
        </div>
      </div>

      <!-- DEBUG -->
      <div v-if="stepData.view === 'debug'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6">
        <div class="grid w-full max-w-4xl gap-4 md:grid-cols-2">
          <div class="rounded-2xl border border-red-500/40 bg-red-500/5 p-4">
            <div class="text-3xl">❌</div>
            <div class="mt-2 text-sm font-bold text-red-300">壞範例</div>
            <div class="mt-2 rounded bg-slate-900 p-3 font-mono text-xs text-slate-400">
              「它壞了，幫我修」
            </div>
            <div class="mt-2 text-xs text-slate-500">Claude 不知道壞在哪</div>
          </div>
          <div class="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-4">
            <div class="text-3xl">✅</div>
            <div class="mt-2 text-sm font-bold text-emerald-300">好範例</div>
            <div class="mt-2 space-y-1 rounded bg-slate-900 p-3 font-mono text-xs text-slate-300">
              <div>1. 錯誤訊息：<span class="text-red-300">TypeError: x is null</span></div>
              <div>2. 步驟：點「計算」→ 填 0 → 跳錯</div>
              <div>3. 看 <span class="text-sky-300">src/utils/bmi.js</span></div>
            </div>
          </div>
        </div>
        <div class="text-sm text-slate-400">線索越多，Claude 修得越準</div>
      </div>

      <!-- READ CODE -->
      <div v-if="stepData.view === 'readCode'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6">
        <div class="w-full max-w-2xl rounded-2xl border border-sky-500/30 bg-slate-900/80 p-5">
          <div class="text-xs text-slate-500">對 Claude 說：</div>
          <div class="mt-1 font-mono text-sm text-sky-300">「幫我看一下這個專案的架構，主要進入點在哪？」</div>
        </div>
        <div class="text-3xl text-sky-400">↓</div>
        <div class="w-full max-w-2xl rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-5 text-sm text-slate-300">
          Claude 自動導覽：這是 Vue 專案，進入點 src/main.ts，路由在 src/router/...
        </div>
        <div class="text-xs text-slate-500">接手舊專案第一天：超好用</div>
      </div>

      <!-- CONTEXT -->
      <div v-if="stepData.view === 'context'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center p-6">
        <div class="grid w-full max-w-4xl gap-3 md:grid-cols-3">
          <div v-for="(p, i) in [
            { n: '1', t: '換主題就 /clear', d: '不要帶著 debug 的 context 去寫新功能', ic: '🧹' },
            { n: '2', t: '一次一件事',      d: '不要在同一段對話裡同時改 A、B、C',    ic: '🎯' },
            { n: '3', t: '規範寫進 CLAUDE.md', d: '別每次對話都重複「用繁體中文」',    ic: '📜' },
          ]" :key="p.n"
            class="rounded-2xl border border-sky-500/30 bg-slate-900/80 p-5 transition-all duration-500"
            :class="animState >= i + 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
          >
            <div class="text-3xl">{{ p.ic }}</div>
            <div class="mt-1 text-xs text-slate-500">原則 {{ p.n }}</div>
            <div class="text-base font-bold text-white">{{ p.t }}</div>
            <div class="mt-1 text-xs text-slate-400">{{ p.d }}</div>
          </div>
        </div>
      </div>

      <!-- SKILL LEVEL UP -->
      <div v-if="stepData.view === 'skillLevel'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6">
        <div class="grid w-full max-w-4xl gap-3 md:grid-cols-3">
          <div class="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-center">
            <div class="text-3xl">📝</div>
            <div class="mt-2 text-sm font-bold text-slate-300">純文字指引</div>
            <div class="mt-1 text-xs text-slate-500">（單元 4 的做法）</div>
          </div>
          <div class="flex items-center justify-center text-2xl text-sky-400">→</div>
          <div class="rounded-2xl border-2 border-sky-500/50 bg-sky-500/5 p-4 text-center">
            <div class="text-3xl">⚡</div>
            <div class="mt-2 text-sm font-bold text-sky-300">呼叫你的腳本</div>
            <div class="mt-1 text-xs text-slate-400">JS / Python / API</div>
          </div>
        </div>
        <div class="max-w-xl rounded-xl border border-sky-500/30 bg-slate-900/80 px-5 py-3 text-center text-sm text-slate-300">
          SKILL.md 寫：「第 3 步，跑 <span class="font-mono text-sky-300">scripts/fetch.js</span>」
          <br /><span class="text-xs text-slate-500">Claude 照說明書跑腳本 → 能做的事瞬間 × 100</span>
        </div>
      </div>

      <!-- CASES -->
      <div v-if="stepData.view === 'cases'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6">
        <div class="flex items-center gap-3">
          <button class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-300 hover:bg-slate-800"
            @click="caseIdx = (caseIdx - 1 + cases.length) % cases.length"
          >‹</button>
          <div class="w-80 rounded-2xl border-2 border-sky-500/50 bg-slate-900 p-6 text-center shadow-xl">
            <div class="text-5xl">{{ cases[caseIdx].icon }}</div>
            <div class="mt-3 text-lg font-bold text-white">{{ cases[caseIdx].title }}</div>
            <div class="mt-2 text-sm text-slate-400">{{ cases[caseIdx].desc }}</div>
          </div>
          <button class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-300 hover:bg-slate-800"
            @click="caseIdx = (caseIdx + 1) % cases.length"
          >›</button>
        </div>
        <div class="flex gap-2">
          <button v-for="(_, i) in cases" :key="i"
            class="h-2 rounded-full transition-all"
            :class="i === caseIdx ? 'w-8 bg-sky-400' : 'w-2 bg-slate-600'"
            @click="caseIdx = i"
          ></button>
        </div>
        <div class="text-xs text-slate-500">👆 這六個都是 Skill + 腳本的模式</div>
      </div>

      <!-- MCP -->
      <div v-if="stepData.view === 'mcp'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6">
        <div class="grid w-full max-w-4xl gap-4 md:grid-cols-2">
          <div class="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
            <div class="text-3xl">🛠️</div>
            <div class="mt-2 text-sm font-bold text-slate-300">Skill + 腳本</div>
            <div class="mt-1 text-xs text-slate-500">你自己寫，完全客製</div>
          </div>
          <div class="rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/5 p-5">
            <div class="text-3xl">🔌</div>
            <div class="mt-2 text-sm font-bold text-emerald-300">MCP</div>
            <div class="mt-1 text-xs text-slate-400">別人寫好，裝了就能用</div>
          </div>
        </div>
        <div class="flex flex-wrap justify-center gap-2">
          <div v-for="t in ['Canva','Figma','GitHub','Slack','Notion','資料庫']" :key="t"
            class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300"
          >{{ t }} MCP</div>
        </div>
        <div class="max-w-xl text-center text-sm text-slate-400">
          Claude 說「幫我做活動海報」→ 直接接 Canva 生圖
        </div>
      </div>

      <!-- ROADMAP -->
      <div v-if="stepData.view === 'roadmap'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center p-6">
        <div class="mb-4 text-3xl">🎓</div>
        <div class="w-full max-w-4xl space-y-2">
          <div v-for="(u, i) in [
            { n: 1, t: '認識工具',   d: '終端機、指令、Token 原理' },
            { n: 2, t: '設定規範',   d: 'CLAUDE.md + settings.json' },
            { n: 3, t: '專業流程',   d: 'Plan → 測試 → 紅綠 → commit' },
            { n: 4, t: '封裝重用',   d: 'Skill = 團隊 SOP' },
            { n: 5, t: '進階擴充',   d: 'Skill 串腳本 + MCP' },
          ]" :key="u.n"
            class="flex items-center gap-4 rounded-xl border border-sky-500/30 bg-slate-900/80 p-3 transition-all duration-500"
            :class="animState >= i + 1 ? 'translate-x-0 opacity-100' : '-translate-x-6 opacity-0'"
          >
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20 text-lg font-bold text-sky-300">{{ u.n }}</div>
            <div class="flex-1">
              <div class="text-sm font-bold text-white">{{ u.t }}</div>
              <div class="text-xs text-slate-400">{{ u.d }}</div>
            </div>
            <div class="text-emerald-400">✓</div>
          </div>
        </div>
        <div class="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-center text-sm text-emerald-200">
          🎉 五單元走完 —— 你已經會用 Claude Code 做真正的工作
        </div>
      </div>
    </div>
  </InteractiveSlideTemplate>
</template>
