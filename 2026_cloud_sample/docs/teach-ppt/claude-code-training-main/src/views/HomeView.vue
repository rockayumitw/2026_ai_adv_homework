<script setup lang="ts">
/**
 * 首頁：課程目錄
 */
import { useRouter } from 'vue-router'
import { courses, getTotalSlides } from '../data/courses'

const router = useRouter()

function goToCourse(courseId: string) {
  router.push({ name: 'course', params: { courseId } })
}
</script>

<template>
  <div class="min-h-screen bg-slate-900 p-8">
    <div class="mx-auto max-w-4xl">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-white">
          六角學院 — 互動式簡報
        </h1>
        <p class="mt-2 text-slate-400">選擇課程查看簡報</p>
      </div>

      <!-- 課程目錄 -->
      <div class="grid gap-6 md:grid-cols-2">
        <div
          v-for="course in courses"
          :key="course.id"
          class="group cursor-pointer rounded-xl border border-slate-700 bg-slate-800 p-6 transition-all hover:border-blue-500"
          @click="goToCourse(course.id)"
        >
          <h2 class="text-xl font-bold text-white group-hover:text-blue-400">
            {{ course.title }}
          </h2>
          <p class="mt-2 text-sm text-slate-400">{{ course.description }}</p>
          <div class="mt-4 flex items-center justify-between">
            <span class="rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-300">
              {{ getTotalSlides(course) }} 份簡報
            </span>
            <span class="text-sm text-blue-400 opacity-0 transition-opacity group-hover:opacity-100">
              進入課程 →
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
