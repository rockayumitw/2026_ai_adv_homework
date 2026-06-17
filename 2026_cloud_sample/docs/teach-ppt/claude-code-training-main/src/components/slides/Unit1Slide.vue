<script setup lang="ts">
/**
 * 單元 1：認識 Claude Code 特性與原理
 */
import { ref, computed, watch, onMounted } from 'vue'
import InteractiveSlideTemplate from './InteractiveSlideTemplate.vue'

defineProps<{ isMobile?: boolean }>()
const emit = defineEmits<{ (e: 'complete'): void }>()

type StepView = 'intro' | 'terminal' | 'launch' | 'commands' | 'practice' | 'token' | 'canCant' | 'summary'
type Step = { id: number; view: StepView; title: string; desc: string }

const STEPS: Step[] = [
  { id: 0, view: 'intro',    title: '單元 1：認識 Claude Code', desc: '今天你要親手操作，不是看 Demo。目標：會指令、會操作、懂原理。' },
  { id: 1, view: 'terminal', title: '三個終端機指令 + 一個小技巧', desc: 'ls 看東西、mkdir 建資料夾、cd 移動，&& 把指令串起來一次跑。' },
  { id: 2, view: 'launch',   title: '啟動 Claude Code',        desc: '在乾淨資料夾裡輸入 claude，建立你的第一次對話。' },
  { id: 3, view: 'commands', title: '四個核心指令',             desc: '日常 80% 的操作就靠這四個：/model、/clear、Ctrl+C、Escape。' },
  { id: 4, view: 'practice', title: '親手寫一隻 ASCII 貓',      desc: '同一個指令，每個人的貓都不一樣 —— 為什麼？' },
  { id: 5, view: 'token',    title: 'Token 預測',              desc: 'LLM 是一個字一個字「猜」出來的，所以每次結果都可能不同。' },
  { id: 6, view: 'canCant',  title: '能與不能',                 desc: 'Claude Code 是助手，不是駭客。它只能碰你給它的資料夾。' },
  { id: 7, view: 'summary',  title: '本單元重點',               desc: '終端機操作、核心指令、Token 原理、安全邊界。' },
]

const currentStep = ref(0)
const animState = ref(0)
const stepData = computed(() => STEPS[currentStep.value])

// 互動狀態
const activeTerm = ref<string | null>(null)
const terminalCmds = [
  { cmd: 'ls',                  out: 'Desktop  Documents  Downloads', note: '列出目前資料夾的東西' },
  { cmd: 'mkdir claude-test',   out: '（建立 claude-test 資料夾）',    note: '建一個新資料夾' },
  { cmd: 'cd claude-test',      out: '→ ~/claude-test',                note: '走進那個資料夾' },
  { cmd: 'A && B',              out: 'A 成功才會跑 B',                  note: '把多個指令串起來一次跑' },
]

const commands = [
  { key: '/model',  icon: '🧠', title: '換模型',  desc: 'Sonnet 快又便宜，Opus 更能推理' },
  { key: '/clear',  icon: '🧹', title: '清對話',  desc: '開新主題前必清，避免 context 污染' },
  { key: 'Ctrl+C',  icon: '✋', title: '中斷',    desc: 'Claude 跑太久想停，直接按' },
  { key: 'Escape',  icon: '↩️', title: '取消',    desc: '打到一半不想送，按 Esc' },
]

const tokenWords = ['一隻', '黑色', '的', '小貓', '在', '屋頂上', '睡覺']
const tokenShown = ref(0)

let timers: number[] = []
function clearTimers() { timers.forEach(t => clearTimeout(t)); timers = [] }
function schedule(fn: () => void, ms: number) { timers.push(window.setTimeout(fn, ms)) }
onMounted(() => triggerStepAnimation())
watch(currentStep, () => {
  clearTimers()
  animState.value = 0
  tokenShown.value = 0
  triggerStepAnimation()
})

function triggerStepAnimation() {
  animState.value = 1
  schedule(() => { animState.value = 2 }, 120)
  schedule(() => { animState.value = 3 }, 240)
  schedule(() => { animState.value = 4 }, 360)
  if (stepData.value.view === 'token') {
    tokenWords.forEach((_, i) => schedule(() => { tokenShown.value = i + 1 }, 200 + i * 200))
  }
}

function nextStep() { if (currentStep.value < STEPS.length - 1) currentStep.value++ }
function prevStep() { if (currentStep.value > 0) currentStep.value-- }
</script>

<template>
  <InteractiveSlideTemplate
    title="單元 1｜認識 Claude Code"
    subtitle="從零開始，親手感受"
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
    <template #icon><span class="text-2xl md:text-3xl">🎓</span></template>

    <div class="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute left-[8%] top-[15%] h-64 w-64 rounded-full bg-sky-500/10 blur-3xl"></div>
        <div class="absolute right-[10%] top-[50%] h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl"></div>
      </div>

      <!-- INTRO -->
      <div v-if="stepData.view === 'intro'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center p-6">
        <div class="transition-all duration-700" :class="animState >= 1 ? 'scale-100 opacity-100' : 'scale-90 opacity-0'">
          <div class="rounded-3xl border-2 border-sky-500/40 bg-slate-900/90 px-10 py-8 text-center shadow-2xl shadow-sky-900/40">
            <div class="text-6xl">🎓</div>
            <div class="mt-3 text-4xl font-black text-white md:text-5xl">
              單元 <span class="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">1</span>
            </div>
            <div class="mt-2 text-lg text-slate-300">認識 Claude Code 特性與原理</div>
            <div class="mt-1 text-sm text-slate-500">40 分鐘 · 親手操作 · 從零開始</div>
          </div>
        </div>
        <div class="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4" >
          <div v-for="(g, i) in ['終端機指令','核心操作','寫 ASCII 貓','Token 原理']" :key="g"
            class="rounded-xl border border-sky-500/30 bg-slate-900/60 px-4 py-3 text-center text-sm text-sky-200 transition-all duration-500"
            :class="animState >= i + 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
          >{{ g }}</div>
        </div>
      </div>

      <!-- TERMINAL -->
      <div v-if="stepData.view === 'terminal'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6">
        <div class="grid w-full max-w-5xl gap-3 md:grid-cols-4">
          <button
            v-for="(t, i) in terminalCmds" :key="t.cmd"
            class="group rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-left transition-all duration-500 hover:border-sky-400 hover:bg-slate-800"
            :class="[
              animState >= i + 1 ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
              activeTerm === t.cmd ? 'border-sky-400 ring-2 ring-sky-400/40' : '',
            ]"
            @click="activeTerm = t.cmd"
          >
            <div class="font-mono text-lg font-bold text-sky-400">$ {{ t.cmd }}</div>
            <div class="mt-1 text-xs text-slate-400">{{ t.note }}</div>
            <div class="mt-2 rounded bg-slate-950 px-2 py-1 font-mono text-xs text-emerald-300">{{ t.out }}</div>
          </button>
        </div>
        <div class="text-sm text-slate-400">👆 點卡片看輸出 —— 記住這三個就能在終端機活下來</div>
      </div>

      <!-- LAUNCH -->
      <div v-if="stepData.view === 'launch'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center p-6">
        <div class="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
          <div class="flex items-center gap-2 border-b border-slate-800 bg-slate-900 px-4 py-2">
            <div class="h-3 w-3 rounded-full bg-red-500"></div>
            <div class="h-3 w-3 rounded-full bg-yellow-500"></div>
            <div class="h-3 w-3 rounded-full bg-green-500"></div>
            <span class="ml-2 text-xs text-slate-400">Terminal</span>
          </div>
          <div class="p-5 font-mono text-sm text-slate-300">
            <div :class="animState >= 1 ? 'opacity-100' : 'opacity-0'" class="transition-all">
              <span class="text-emerald-400">$</span> mkdir claude-test && cd claude-test
            </div>
            <div :class="animState >= 2 ? 'opacity-100' : 'opacity-0'" class="mt-1 transition-all">
              <span class="text-emerald-400">$</span> claude
            </div>
            <div :class="animState >= 3 ? 'opacity-100' : 'opacity-0'" class="mt-3 rounded border border-sky-500/30 bg-sky-500/5 p-3 transition-all">
              <div class="text-sky-400">? Do you trust this folder?</div>
              <div class="mt-1 text-slate-400">❯ <span class="text-emerald-400">Yes</span>，資料夾是自己建的，空的，安全。</div>
            </div>
            <div :class="animState >= 4 ? 'opacity-100' : 'opacity-0'" class="mt-3 transition-all">
              <div class="text-slate-500">＞ 你好，你是誰？</div>
              <div class="mt-1 text-sky-300">Claude：嗨！我是 Claude，可以幫你寫程式、建檔案...</div>
            </div>
          </div>
        </div>
        <div class="mt-4 text-sm text-slate-400">⚠️ 遇到 y/n 會停下來問 —— 這是安全機制，不是 Claude 手滑了</div>
      </div>

      <!-- COMMANDS -->
      <div v-if="stepData.view === 'commands'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center p-6">
        <div class="grid w-full max-w-4xl gap-4 md:grid-cols-2">
          <div v-for="(c, i) in commands" :key="c.key"
            class="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-slate-900/80 p-5 transition-all duration-500"
            :class="animState >= i + 1 ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'"
          >
            <div class="flex items-center gap-3">
              <div class="text-3xl">{{ c.icon }}</div>
              <div>
                <div class="font-mono text-lg font-bold text-sky-300">{{ c.key }}</div>
                <div class="text-sm font-bold text-white">{{ c.title }}</div>
              </div>
            </div>
            <div class="mt-2 text-sm text-slate-400">{{ c.desc }}</div>
          </div>
        </div>
      </div>

      <!-- PRACTICE -->
      <div v-if="stepData.view === 'practice'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6">
        <div class="w-full max-w-3xl rounded-2xl border border-sky-500/30 bg-slate-900/90 p-5">
          <div class="text-xs text-slate-500">對 Claude 說：</div>
          <div class="mt-1 font-mono text-sm text-sky-300">
            「幫我寫一個 cat.js，用 console.log 畫出一隻可愛的貓咪 ASCII art」
          </div>
        </div>
        <div class="grid w-full max-w-3xl gap-3 md:grid-cols-3">
          <pre v-for="(c, i) in [' /\\_/\\\n( o.o )\n &gt; ^ &lt;',' ／l、\n（ﾟ､ ｡ ７\n l  ~ヽ',' ∧＿∧\n(=•ω•=)\n / 　 づ']" :key="i"
            class="rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-emerald-300 transition-all duration-500"
            :class="animState >= i + 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
          >{{ c }}</pre>
        </div>
        <div class="rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-3 text-center text-sm text-amber-200">
          🤔 同一句話，為什麼每個人的貓都不一樣？下一頁解答
        </div>
      </div>

      <!-- TOKEN -->
      <div v-if="stepData.view === 'token'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-5 p-6">
        <div class="text-sm text-slate-400">LLM 是一個 token 一個 token 預測出來的：</div>
        <div class="flex flex-wrap items-center justify-center gap-2 text-2xl font-bold md:text-3xl">
          <span v-for="(w, i) in tokenWords" :key="i"
            class="rounded-lg border border-sky-500/40 bg-slate-900 px-3 py-2 text-sky-300 transition-all duration-500"
            :class="i < tokenShown ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
          >{{ w }}</span>
          <span v-if="tokenShown < tokenWords.length" class="animate-pulse text-slate-500">▊</span>
        </div>
        <div class="max-w-xl rounded-2xl border border-sky-500/30 bg-slate-900/80 p-4 text-center text-sm text-slate-300">
          每一步都有「很多可能」的下一個字。不同路徑 → 不同結果。<br />
          <span class="text-sky-300">這不是 bug，這就是 LLM。</span>
        </div>
      </div>

      <!-- CAN / CANNOT -->
      <div v-if="stepData.view === 'canCant'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center p-6">
        <div class="grid w-full max-w-4xl gap-4 md:grid-cols-2">
          <div class="rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/5 p-5 transition-all duration-700"
            :class="animState >= 1 ? 'translate-x-0 opacity-100' : '-translate-x-6 opacity-0'"
          >
            <div class="text-3xl">✅</div>
            <div class="mt-2 font-bold text-emerald-300">能做</div>
            <ul class="mt-2 space-y-1 text-sm text-slate-300">
              <li>• 讀寫你資料夾裡的檔案</li>
              <li>• 幫你跑指令、開伺服器</li>
              <li>• Debug、重構、寫文件</li>
            </ul>
          </div>
          <div class="rounded-2xl border-2 border-red-500/50 bg-red-500/5 p-5 transition-all duration-700"
            :class="animState >= 2 ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'"
          >
            <div class="text-3xl">🚫</div>
            <div class="mt-2 font-bold text-red-300">不能做</div>
            <ul class="mt-2 space-y-1 text-sm text-slate-300">
              <li>• 偷偷上網買東西</li>
              <li>• 動你系統檔案</li>
              <li>• 不會「自己有想法」做事</li>
            </ul>
          </div>
        </div>
        <div class="mt-5 rounded-xl border border-sky-500/30 bg-slate-900/80 px-5 py-3 text-center text-sm text-sky-200">
          它是<span class="font-bold text-white">助手</span>，不是駭客。每件重要的事都會停下來問你。
        </div>
      </div>

      <!-- SUMMARY -->
      <div v-if="stepData.view === 'summary'" class="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-4 md:p-6">
        <div class="text-center">
          <div class="text-4xl">📋</div>
          <div class="mt-2 text-xl font-bold text-white md:text-2xl">指令小抄（帶回家用）</div>
        </div>
        <div class="w-full max-w-3xl overflow-hidden rounded-2xl border border-sky-500/30 bg-slate-900/80 shadow-xl">
          <table class="w-full text-sm">
            <thead class="bg-slate-800/80 text-xs uppercase text-slate-400">
              <tr>
                <th class="px-4 py-2 text-left">類別</th>
                <th class="px-4 py-2 text-left">指令</th>
                <th class="px-4 py-2 text-left">用途</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 font-mono text-xs md:text-sm">
              <tr><td class="px-4 py-2 text-slate-500">終端機</td><td class="px-4 py-2 text-sky-300">ls</td><td class="px-4 py-2 text-slate-300">列出資料夾內容</td></tr>
              <tr><td class="px-4 py-2 text-slate-500">終端機</td><td class="px-4 py-2 text-sky-300">mkdir &lt;名稱&gt;</td><td class="px-4 py-2 text-slate-300">建立資料夾</td></tr>
              <tr><td class="px-4 py-2 text-slate-500">終端機</td><td class="px-4 py-2 text-sky-300">cd &lt;名稱&gt;</td><td class="px-4 py-2 text-slate-300">進入資料夾</td></tr>
              <tr><td class="px-4 py-2 text-slate-500">終端機</td><td class="px-4 py-2 text-sky-300">A &amp;&amp; B</td><td class="px-4 py-2 text-slate-300">前一個成功才跑下一個</td></tr>
              <tr><td class="px-4 py-2 text-slate-500">啟動</td><td class="px-4 py-2 text-emerald-300">claude</td><td class="px-4 py-2 text-slate-300">在當前資料夾啟動 Claude Code</td></tr>
              <tr><td class="px-4 py-2 text-slate-500">Claude</td><td class="px-4 py-2 text-emerald-300">/model</td><td class="px-4 py-2 text-slate-300">切換 Sonnet / Opus</td></tr>
              <tr><td class="px-4 py-2 text-slate-500">Claude</td><td class="px-4 py-2 text-emerald-300">/clear</td><td class="px-4 py-2 text-slate-300">清空對話、開新主題</td></tr>
              <tr><td class="px-4 py-2 text-slate-500">Claude</td><td class="px-4 py-2 text-emerald-300">Ctrl + C</td><td class="px-4 py-2 text-slate-300">中斷 Claude 正在做的事</td></tr>
              <tr><td class="px-4 py-2 text-slate-500">Claude</td><td class="px-4 py-2 text-emerald-300">Esc</td><td class="px-4 py-2 text-slate-300">取消正在輸入的訊息</td></tr>
            </tbody>
          </table>
        </div>
        <div class="text-xs text-slate-400">下一單元：讓 Claude 按你的風格寫 code →</div>
      </div>
    </div>
  </InteractiveSlideTemplate>
</template>
