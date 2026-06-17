<script setup lang="ts">
/**
 * 課程頁面：按分區顯示簡報列表
 */
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { courses, getTotalSlides } from '../data/courses'
import SlideModal from '../components/SlideModal.vue'

const route = useRoute()
const router = useRouter()

const courseId = computed(() => route.params.courseId as string)
const course = computed(() => courses.find(c => c.id === courseId.value))
const totalSlides = computed(() => course.value ? getTotalSlides(course.value) : 0)

const previewSlide = ref<{ id: string; title: string } | null>(null)

function openPreview(slide: { id: string; title: string }) {
  previewSlide.value = slide
}

function closePreview() {
  previewSlide.value = null
}

function backToHome() {
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="min-h-screen bg-slate-900 p-8">
    <div class="mx-auto max-w-4xl">
      <!-- 找不到課程 -->
      <div v-if="!course" class="flex min-h-[60vh] items-center justify-center">
        <div class="text-center">
          <p class="text-lg text-slate-400">找不到課程：{{ courseId }}</p>
          <button
            class="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
            @click="backToHome"
          >
            返回目錄
          </button>
        </div>
      </div>

      <!-- 課程內容 -->
      <template v-else>
        <div class="mb-8 flex items-center justify-between">
          <div>
            <button
              class="mb-3 flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-white"
              @click="backToHome"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              返回目錄
            </button>
            <h1 class="text-2xl font-bold text-white">{{ course.title }}</h1>
            <p class="mt-1 text-slate-400">{{ course.description }}</p>
          </div>
          <span class="rounded-full bg-slate-700 px-3 py-1 text-sm text-slate-300">
            {{ totalSlides }} 份簡報
          </span>
        </div>

        <!-- 按分區顯示簡報 -->
        <template v-if="course.sections.length > 0">
          <section
            v-for="section in course.sections"
            :key="section.title"
            class="mb-8"
          >
            <h2 class="mb-4 flex items-center gap-3 text-lg font-bold text-white">
              {{ section.title }}
              <span class="rounded-full bg-slate-700 px-2 py-0.5 text-xs font-normal text-slate-400">
                {{ section.slides.length }}
              </span>
            </h2>

            <!-- 該分區有簡報 -->
            <div v-if="section.slides.length > 0" class="grid gap-4 md:grid-cols-2">
              <div
                v-for="slide in section.slides"
                :key="slide.id"
                class="group cursor-pointer rounded-xl border border-slate-700 bg-slate-800 p-5 transition-all hover:border-blue-500"
                @click="openPreview(slide)"
              >
                <div class="mb-2">
                  <h3 class="font-bold text-white group-hover:text-blue-400">{{ slide.title }}</h3>
                </div>
                <p class="text-sm text-slate-400">{{ slide.description }}</p>
                <div class="mt-4 flex items-center gap-2 text-sm text-blue-400 opacity-0 transition-opacity group-hover:opacity-100">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm48.24-94.78-64-40A8,8,0,0,0,100,88v80a8,8,0,0,0,12.24,6.78l64-40a8,8,0,0,0,0-13.56ZM116,153.57V102.43L156.91,128Z"/>
                  </svg>
                  點擊預覽
                </div>
              </div>
            </div>

            <!-- 該分區無簡報 -->
            <div v-else class="rounded-xl border border-dashed border-slate-700 p-8 text-center">
              <p class="text-sm text-slate-500">簡報製作中，敬請期待</p>
            </div>
          </section>
        </template>

        <!-- 完全空狀態（連 section 都沒有） -->
        <div v-else class="flex min-h-[40vh] items-center justify-center">
          <div class="text-center">
            <p class="text-5xl">📚</p>
            <p class="mt-4 text-lg text-slate-400">尚無簡報</p>
            <p class="mt-1 text-sm text-slate-500">簡報製作中，敬請期待</p>
          </div>
        </div>
      </template>
    </div>

    <!-- 簡報預覽 Modal -->
    <SlideModal
      v-if="previewSlide"
      :slideId="previewSlide.id"
      :title="previewSlide.title"
      @close="closePreview"
    />
  </div>
</template>
