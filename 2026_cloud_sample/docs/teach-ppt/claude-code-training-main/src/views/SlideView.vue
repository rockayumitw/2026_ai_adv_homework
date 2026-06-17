<script setup lang="ts">
/**
 * 獨立簡報頁面
 * 透過 URL 直接開啟某張簡報，例如 /course/backend-camp/slide/api-intro
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { courses, findSlide } from '../data/courses'
import SlideModal from '../components/SlideModal.vue'

const route = useRoute()
const router = useRouter()

const courseId = computed(() => route.params.courseId as string)
const slideId = computed(() => route.params.id as string)
const course = computed(() => courses.find(c => c.id === courseId.value))
const slideInfo = computed(() => course.value ? findSlide(course.value, slideId.value) : undefined)

function handleClose() {
  router.push({ name: 'course', params: { courseId: courseId.value } })
}
</script>

<template>
  <div class="min-h-screen bg-slate-900">
    <SlideModal
      v-if="slideInfo"
      :slideId="slideInfo.id"
      :title="slideInfo.title"
      @close="handleClose"
    />
    <div v-else class="flex min-h-screen items-center justify-center">
      <div class="text-center">
        <p class="text-lg text-slate-400">找不到簡報：{{ slideId }}</p>
        <button
          class="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
          @click="router.push({ name: 'home' })"
        >
          返回目錄
        </button>
      </div>
    </div>
  </div>
</template>
