export type SlideInfo = {
  id: string
  title: string
  description: string
}

export type Section = {
  title: string
  slides: SlideInfo[]
}

export type Course = {
  id: string
  title: string
  description: string
  sections: Section[]
}

/** 計算課程總簡報數 */
export function getTotalSlides(course: Course): number {
  return course.sections.reduce((sum, s) => sum + s.slides.length, 0)
}

/** 在所有 section 中找到指定 slide */
export function findSlide(course: Course, slideId: string): SlideInfo | undefined {
  for (const section of course.sections) {
    const slide = section.slides.find(s => s.id === slideId)
    if (slide) return slide
  }
}

export const courses: Course[] = [
  {
    id: 'claude-code-training',
    title: 'Claude Code 企業培訓',
    description: '五單元完整學習路徑：從零開始，到把重複工作自動化',
    sections: [
      {
        title: '全五單元',
        slides: [
          { id: 'unit-1', title: '單元 1：認識 Claude Code 特性與原理', description: '終端機指令、核心操作、Token 預測、能與不能' },
          { id: 'unit-2', title: '單元 2：CLAUDE.md 與專案設定', description: '對照實驗帶你看設定檔如何左右 Claude 的產出' },
          { id: 'unit-3', title: '單元 3：單元測試與 Plan Mode', description: 'Plan Mode 規劃、紅綠循環、Git 整合完整流程' },
          { id: 'unit-4', title: '單元 4：Skills 封裝與重複利用', description: '把工作流寫成可觸發的 SOP 檔案' },
          { id: 'unit-5', title: '單元 5：綜合補充 — 實戰技巧與進階用法', description: 'Debug / Context / Skill 串腳本 / MCP' },
        ],
      },
    ],
  },
]
