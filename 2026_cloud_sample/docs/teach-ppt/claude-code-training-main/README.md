# slide-template

互動式簡報專案的起始模板。基於 Vue 3 + Vite + Tailwind + Vue Router，
內建一張示範用 starter slide，複製本資料夾即可開始做新的簡報專案。

## 開始

```bash
npm install
npm run dev
```

預設打開 [http://localhost:5173/](http://localhost:5173/)。

## 新增一張 slide

1. 複製 `src/components/slides/_SlideStarterTemplate.vue` 為例如 `MyTopicSlide.vue`
2. 修改檔案內 `STEPS` 陣列與各 view 的內容
3. 在 `src/components/SlideModal.vue` 的 `slideComponents` 註冊：
   ```ts
   'my-topic': defineAsyncComponent(() => import('./slides/MyTopicSlide.vue')),
   ```
4. 在 `src/data/courses.ts` 的某個 section 加上：
   ```ts
   { id: 'my-topic', title: '我的主題', description: '...' }
   ```
5. 從首頁進入課程，點擊該 slide，或直接打開 `/course/<courseId>/slide/my-topic`

## 結構

- `src/components/slides/InteractiveSlideTemplate.vue` — 共用外框（Header / 進度條 / 上下步控制）
- `src/components/slides/_SlideStarterTemplate.vue` — 新 slide 的複製起點
- `src/components/SlideModal.vue` — slideId → 元件的對應表
- `src/data/courses.ts` — 課程與 slide 列表
- `src/views/` — Home / Course / Slide 三個頁面
