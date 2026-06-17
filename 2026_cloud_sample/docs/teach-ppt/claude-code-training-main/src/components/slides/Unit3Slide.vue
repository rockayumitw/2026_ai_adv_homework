<script setup lang="ts">
/**
 * 單元 3：單元測試與 Plan Mode
 */
import { ref, computed, watch, onMounted } from 'vue'
import InteractiveSlideTemplate from './InteractiveSlideTemplate.vue'

defineProps<{ isMobile?: boolean }>()
const emit = defineEmits<{ (e: 'complete'): void }>()

type StepView = 'intro' | 'why' | 'plan' | 'tests' | 'redGreen' | 'git' | 'evolve' | 'summary'
type Step = { id: number; view: StepView; title: string; desc: string }

const STEPS: Step[] = [
  { id: 0, view: 'intro',    title: '單元 3：把品質顧住',          desc: 'Plan Mode 先想清楚 + 單元測試 + Git commit，走完整的開發一輪。' },
  { id: 1, view: 'why',      title: '為什麼要測試？',              desc: 'BMI 網頁能算數字，但你怎麼知道算得是對的？' },
  { id: 2, view: 'plan',     title: '/plan —— 先規劃再動手',        desc: '讓 Claude 列出測試清單，你審核完再放它做。' },
  { id: 3, view: 'tests',    title: '瀏覽器就是測試機',             desc: 'console.assert + bmi.test.html，打開瀏覽器就能跑。' },
  { id: 4, view: 'redGreen', title: '紅綠循環',                   desc: '先看到紅（失敗），改程式看到綠（通過），就是測試的節奏。' },
  { id: 5, view: 'git',      title: 'Git 整合',                  desc: '測試過 → commit。Claude 幫你跑完整的 git init / add / commit。' },
  { id: 6, view: 'evolve',   title: '三單元的演進',                desc: '從「讓 AI 隨便寫」到「讓 AI 按流程寫」—— 這才是正確姿勢。' },
  { id: 7, view: 'summary',  title: '本單元重點',                  desc: 'Plan → 寫測試 → 紅 → 改 → 綠 → commit，開發節奏成形。' },
]

const currentStep = ref(0)
const animState = ref(0)
const stepData = computed(() => STEPS[currentStep.value])
const testStatus = ref<'red' | 'fixing' | 'green'>('red')

let timers: number[] = []
function clearTimers() { timers.forEach(t => clearTimeout(t)); timers = [] }
function schedule(fn: () => void, ms: number) { timers.push(window.setTimeout(fn, ms)) }
onMounted(() => triggerStepAnimation())
watch(currentStep, () => {
  clearTimers()
  animState.value = 0
  testStatus.value = 'red'
  triggerStepAnimation()
})
function triggerStepAnimation() {
  animState.value = 1
  for (let i = 2; i <= 5; i++) schedule(() => { animState.value = i }, (i - 1) * 120)
}
function nextStep() { if (currentStep.value < STEPS.length - 1) currentStep.value++ }
function prevStep() { if (currentStep.value > 0) currentStep.value-- }
function toggleTest() {
  if (testStatus.value === 'red') testStatus.value = 'fixing'
  else if (testStatus.value === 'fixing') testStatus.value = 'green'
  else testStatus.value = 'red'
}
</script>

<template>
  <InteractiveSlideTemplate
    title="單元 3｜單元測試與 Plan Mode"
    subtitle="把品質顧住的一輪流程"
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
    <template #icon><span class="text-2xl md:text-3xl">🧪</span></template>

    <div class="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute left-[10%] top-[15%] h-64 w-64 rounded-full bg-sky-500/10 blur-3xl"></div>
      </div>

      <!-- INTRO -->
      <div v-if="stepData.view === 'intro'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center p-6">
        <div class="rounded-3xl border-2 border-sky-500/40 bg-slate-900/90 px-10 py-8 text-center shadow-2xl">
          <div class="text-6xl">🧪</div>
          <div class="mt-3 text-4xl font-black text-white">單元 <span class="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">3</span></div>
          <div class="mt-2 text-lg text-slate-300">單元測試與 Plan Mode</div>
        </div>
        <div class="mt-6 flex items-center gap-2 text-sm">
          <div class="rounded-full bg-slate-800 px-3 py-1 text-sky-300">Plan</div>
          <span class="text-slate-500">→</span>
          <div class="rounded-full bg-slate-800 px-3 py-1 text-red-300">測試失敗</div>
          <span class="text-slate-500">→</span>
          <div class="rounded-full bg-slate-800 px-3 py-1 text-emerald-300">通過</div>
          <span class="text-slate-500">→</span>
          <div class="rounded-full bg-slate-800 px-3 py-1 text-amber-300">commit</div>
        </div>
      </div>

      <!-- WHY -->
      <div v-if="stepData.view === 'why'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6">
        <div class="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
          <div class="text-sm text-slate-400">BMI 網頁能算：</div>
          <div class="mt-2 grid grid-cols-2 gap-2 text-center text-sm">
            <div class="rounded bg-slate-950 p-2 text-emerald-300">身高 170 / 體重 60 → 20.8 ✓</div>
            <div class="rounded bg-slate-950 p-2 text-red-300">身高 0 → ?</div>
            <div class="rounded bg-slate-950 p-2 text-red-300">體重 -5 → ?</div>
            <div class="rounded bg-slate-950 p-2 text-red-300">身高 "abc" → ?</div>
          </div>
        </div>
        <div class="max-w-xl rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-3 text-center text-sm text-amber-200">
          😱 手測很快忘記。<span class="font-bold text-white">寫一次、跑無數次</span> —— 這就是單元測試。
        </div>
      </div>

      <!-- PLAN -->
      <div v-if="stepData.view === 'plan'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center p-6">
        <div class="w-full max-w-2xl overflow-hidden rounded-2xl border-2 border-sky-500/50 bg-slate-950 shadow-2xl">
          <div class="border-b border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-400">Terminal</div>
          <div class="p-5 font-mono text-sm">
            <div class="text-slate-500">＞ <span class="text-sky-300">/plan 幫我規劃 BMI 測試案例</span></div>
            <div class="mt-4 space-y-1 text-slate-300">
              <div v-for="(line, i) in [
                '📋 計畫草稿：',
                '  1. 正常值：身高 170 / 體重 60',
                '  2. 邊界值：BMI = 18.5 / 24',
                '  3. 錯誤輸入：負數、零、空值',
                '  4. 非數字：「abc」、null',
              ]" :key="i" :class="animState >= i + 1 ? 'opacity-100' : 'opacity-0'" class="transition-all">{{ line }}</div>
              <div class="mt-3 rounded border border-amber-500/40 bg-amber-500/10 p-2 text-amber-300">
                ⚠️ 等你確認才會動手寫程式
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TESTS -->
      <div v-if="stepData.view === 'tests'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center p-6">
        <div class="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">
          <div class="border-b border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-400">bmi.test.html （瀏覽器開就能跑）</div>
          <pre class="p-5 font-mono text-xs text-slate-300">&lt;script src="bmi.js"&gt;&lt;/script&gt;
&lt;script&gt;
<span class="text-sky-300">console.assert</span>(calcBMI(170, 60) === 20.8, '正常值')
<span class="text-sky-300">console.assert</span>(calcBMI(0, 60) === null,  '身高 0 應回 null')
<span class="text-sky-300">console.assert</span>(calcBMI(170, -5) === null, '體重負數')
&lt;/script&gt;</pre>
        </div>
        <div class="mt-4 max-w-xl rounded-xl border border-sky-500/30 bg-slate-900/80 px-5 py-3 text-center text-sm text-slate-300">
          ✨ 不用裝 Jest、不用 Node，打開 HTML 就能跑
        </div>
      </div>

      <!-- RED / GREEN -->
      <div v-if="stepData.view === 'redGreen'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6">
        <button
          class="group flex h-32 w-32 items-center justify-center rounded-full border-4 text-5xl font-bold transition-all duration-500 hover:scale-105"
          :class="{
            'border-red-500 bg-red-500/20 text-red-300 shadow-[0_0_60px_rgba(239,68,68,0.4)]': testStatus === 'red',
            'border-amber-500 bg-amber-500/20 text-amber-300 shadow-[0_0_60px_rgba(245,158,11,0.4)]': testStatus === 'fixing',
            'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-[0_0_60px_rgba(16,185,129,0.4)]': testStatus === 'green',
          }"
          @click="toggleTest"
        >
          {{ testStatus === 'red' ? '✗' : testStatus === 'fixing' ? '🔧' : '✓' }}
        </button>
        <div class="text-center">
          <div class="text-lg font-bold text-white">
            {{ testStatus === 'red' ? '紅：測試失敗' : testStatus === 'fixing' ? '修：改程式' : '綠：測試通過' }}
          </div>
          <div class="mt-1 text-sm text-slate-400">
            {{ testStatus === 'red' ? '看到紅是好事 —— 代表測試在工作' : testStatus === 'fixing' ? '讓 Claude 修邏輯...' : '✨ 可以 commit 了！' }}
          </div>
        </div>
        <button class="rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-xs text-sky-300 hover:bg-sky-500/20" @click="toggleTest">
          👆 點圓圈看下一階段
        </button>
      </div>

      <!-- GIT -->
      <div v-if="stepData.view === 'git'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center p-6">
        <div class="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">
          <div class="border-b border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-400">Terminal</div>
          <div class="p-5 font-mono text-xs text-slate-300">
            <div v-for="(line, i) in [
              { t: '$ git init',                                    c: 'text-sky-300' },
              { t: 'Initialized empty Git repository',              c: 'text-slate-500' },
              { t: '$ git add .',                                   c: 'text-sky-300' },
              { t: '$ git commit -m「feat(bmi): 加上輸入驗證」',     c: 'text-sky-300' },
              { t: '[main a3f8c12] feat(bmi): 加上輸入驗證',         c: 'text-emerald-300' },
              { t: ' 2 files changed, 18 insertions(+)',            c: 'text-slate-500' },
            ]" :key="i" :class="[line.c, animState >= i + 1 ? 'opacity-100' : 'opacity-0']" class="transition-all">{{ line.t }}</div>
          </div>
        </div>
        <div class="mt-4 text-sm text-slate-400">Claude 跑整套，你只要說「commit 這次的修改」</div>
      </div>

      <!-- EVOLVE -->
      <div v-if="stepData.view === 'evolve'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center p-6">
        <div class="grid w-full max-w-4xl gap-3 md:grid-cols-3">
          <div v-for="(c, i) in [
            { u: '單元 1', t: '讓 AI 隨便寫', d: '直接叫它做東西，接受它的風格', c: 'slate' },
            { u: '單元 2', t: '讓 AI 按規矩寫', d: 'CLAUDE.md 定風格，settings 放權限', c: 'sky' },
            { u: '單元 3', t: '讓 AI 按流程寫', d: 'Plan → 測試 → 紅綠 → commit', c: 'emerald' },
          ]" :key="c.u"
            class="rounded-2xl border border-slate-700 bg-slate-900/80 p-5 transition-all duration-700"
            :class="[animState >= i + 1 ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0', i === 2 ? 'ring-2 ring-emerald-500/50' : '']"
          >
            <div class="text-xs text-slate-500">{{ c.u }}</div>
            <div class="mt-1 text-base font-bold text-white">{{ c.t }}</div>
            <div class="mt-2 text-xs text-slate-400">{{ c.d }}</div>
          </div>
        </div>
        <div class="mt-6 max-w-xl rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-5 py-3 text-center text-sm text-emerald-200">
          👉 這才是 AI 輔助開發的正確姿勢
        </div>
      </div>

      <!-- SUMMARY -->
      <div v-if="stepData.view === 'summary'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6">
        <div class="rounded-3xl border-2 border-sky-500/50 bg-slate-900 p-6 text-center">
          <div class="text-6xl">🎯</div>
          <div class="mt-3 text-2xl font-bold text-white">一輪完整開發節奏</div>
        </div>
        <div class="flex items-center gap-2 text-sm font-bold">
          <span class="rounded-lg bg-sky-500/20 px-3 py-2 text-sky-300">Plan</span>
          <span class="text-slate-500">→</span>
          <span class="rounded-lg bg-red-500/20 px-3 py-2 text-red-300">紅</span>
          <span class="text-slate-500">→</span>
          <span class="rounded-lg bg-emerald-500/20 px-3 py-2 text-emerald-300">綠</span>
          <span class="text-slate-500">→</span>
          <span class="rounded-lg bg-amber-500/20 px-3 py-2 text-amber-300">commit</span>
        </div>
      </div>
    </div>
  </InteractiveSlideTemplate>
</template>
