<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { z } from "zod";

import { useAppNavigation } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";
import type { FieldErrors } from "@/types/finance";

type Mode = "login" | "register" | "forgot" | "reset";
const route = useRoute();
const router = useRouter();
const { goBack } = useAppNavigation();
const mode = computed(() => route.meta.mode as Mode);
const pending = ref(false);
const message = ref("");
const success = ref(false);
const showPassword = ref(false);
const errors = ref<FieldErrors>({});
const form = reactive({
  displayName: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const copy = computed(
  () =>
    ({
      login: {
        title: "ยินดีต้อนรับกลับ",
        description: "เข้าสู่ระบบเพื่อดูภาพรวมการเงินของคุณ",
        action: "เข้าสู่ระบบ",
      },
      register: {
        title: "เริ่มต้นใช้ EasyLife",
        description: "สร้างบัญชีเพื่อจัดการการเงินให้ง่ายขึ้น",
        action: "สร้างบัญชี",
      },
      forgot: {
        title: "ลืมรหัสผ่าน",
        description: "เราจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้ทางอีเมล",
        action: "ส่งลิงก์ตั้งรหัสผ่าน",
      },
      reset: {
        title: "ตั้งรหัสผ่านใหม่",
        description: "ใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร",
        action: "บันทึกรหัสผ่านใหม่",
      },
    })[mode.value],
);

watch(mode, () => {
  message.value = "";
  errors.value = {};
});

function validate() {
  const email = z.string().trim().email("กรุณากรอกอีเมลให้ถูกต้อง");
  const password = z
    .string()
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
    .max(72, "รหัสผ่านยาวเกินไป");
  const schemas = {
    login: z.object({
      email,
      password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
    }),
    register: z
      .object({
        displayName: z
          .string()
          .trim()
          .min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร")
          .max(80),
        email,
        password,
        confirmPassword: z.string(),
      })
      .refine((value) => value.password === value.confirmPassword, {
        path: ["confirmPassword"],
        message: "รหัสผ่านทั้งสองช่องไม่ตรงกัน",
      }),
    forgot: z.object({ email }),
    reset: z
      .object({ password, confirmPassword: z.string() })
      .refine((value) => value.password === value.confirmPassword, {
        path: ["confirmPassword"],
        message: "รหัสผ่านทั้งสองช่องไม่ตรงกัน",
      }),
  };
  const result = schemas[mode.value].safeParse(form);
  errors.value = {};
  if (result.success) return true;
  for (const issue of result.error.issues)
    errors.value[String(issue.path[0])] = issue.message;
  return false;
}

async function submit() {
  message.value = "";
  success.value = false;
  if (!validate()) return;
  pending.value = true;
  try {
    if (mode.value === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });
      if (error) throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      await router.replace(
        typeof route.query.redirect === "string" ? route.query.redirect : "/",
      );
    } else if (mode.value === "register") {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: { display_name: form.displayName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });
      if (error)
        throw new Error(
          error.code === "user_already_exists"
            ? "อีเมลนี้ถูกใช้งานแล้ว"
            : "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่",
        );
      if (data.session) await router.replace("/onboarding");
      else {
        success.value = true;
        message.value = "สมัครสำเร็จ กรุณาเปิดอีเมลเพื่อยืนยันบัญชี";
      }
    } else if (mode.value === "forgot") {
      await supabase.auth.resetPasswordForEmail(form.email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      success.value = true;
      message.value = "หากอีเมลอยู่ในระบบ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่แล้ว";
    } else {
      const { error } = await supabase.auth.updateUser({
        password: form.password,
      });
      if (error) throw new Error("ตั้งรหัสผ่านใหม่ไม่สำเร็จ");
      await supabase.auth.signOut();
      await router.replace({ path: "/login", query: { reset: "success" } });
    }
  } catch (error) {
    message.value =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด กรุณาลองใหม่";
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <main
    class="auth-gradient auth-page d-flex align-center justify-center pa-4 pa-md-8"
  >
    <div class="auth-grid w-100">
      <section
        class="auth-hero d-none d-md-flex flex-column justify-center pa-10"
      >
        <div class="d-flex align-center ga-3 mb-10">
          <VAvatar color="primary" rounded="lg" size="46"
            ><VIcon icon="mdi-sprout"
          /></VAvatar>
          <span class="text-h5 font-weight-bold">EasyLife</span>
        </div>
        <h1 class="text-h3 font-weight-bold mb-4">
          ชีวิตการเงินที่เบาขึ้น<br /><span class="text-primary"
            >เริ่มต้นได้วันนี้</span
          >
        </h1>
        <p class="text-h6 text-medium-emphasis">
          เห็นภาพรวมรายรับ รายจ่าย และทุกบัญชีในที่เดียว
        </p>
      </section>

      <VCard class="materio-card pa-6 pa-sm-9" max-width="480" width="100%">
        <div class="d-flex d-md-none align-center ga-2 mb-7">
          <VAvatar color="primary" rounded="lg"
            ><VIcon icon="mdi-sprout" /></VAvatar
          ><span class="text-h6 font-weight-bold">EasyLife</span>
        </div>
        <div v-if="mode !== 'login'" class="mb-4">
          <VBtn
            prepend-icon="mdi-arrow-left"
            variant="text"
            size="small"
            color="secondary"
            class="px-0"
            @click="goBack('/login')"
          >
            ย้อนกลับไปหน้าเข้าสู่ระบบ
          </VBtn>
        </div>
        <h2 class="text-h4 font-weight-semibold">{{ copy.title }}</h2>
        <p class="mt-2 mb-7 text-medium-emphasis">{{ copy.description }}</p>
        <VAlert
          v-if="route.query.reset === 'success' && mode === 'login'"
          type="success"
          variant="tonal"
          class="mb-5"
          >ตั้งรหัสผ่านใหม่สำเร็จแล้ว กรุณาเข้าสู่ระบบ</VAlert
        >
        <VAlert
          v-if="message"
          :type="success ? 'success' : 'error'"
          variant="tonal"
          class="mb-5"
          >{{ message }}</VAlert
        >
        <VForm @submit.prevent="submit">
          <VTextField
            v-if="mode === 'register'"
            v-model="form.displayName"
            label="ชื่อที่ใช้ในแอป"
            autocomplete="name"
            :error-messages="errors.displayName"
            class="mb-2"
          />
          <VTextField
            v-if="mode !== 'reset'"
            v-model="form.email"
            label="อีเมล"
            type="email"
            autocomplete="email"
            prepend-inner-icon="mdi-email-outline"
            :error-messages="errors.email"
            class="mb-2"
          />
          <VTextField
            v-if="mode === 'login' || mode === 'register' || mode === 'reset'"
            v-model="form.password"
            :label="mode === 'reset' ? 'รหัสผ่านใหม่' : 'รหัสผ่าน'"
            :type="showPassword ? 'text' : 'password'"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="
              showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'
            "
            :error-messages="errors.password"
            class="mb-2"
            @click:append-inner="showPassword = !showPassword"
          />
          <VTextField
            v-if="mode === 'register' || mode === 'reset'"
            v-model="form.confirmPassword"
            label="ยืนยันรหัสผ่าน"
            :type="showPassword ? 'text' : 'password'"
            prepend-inner-icon="mdi-lock-check-outline"
            :error-messages="errors.confirmPassword"
            class="mb-2"
          />
          <div v-if="mode === 'login'" class="mb-5 text-right">
            <RouterLink to="/forgot-password" class="text-primary text-body-2"
              >ลืมรหัสผ่าน?</RouterLink
            >
          </div>
          <VBtn
            type="submit"
            color="primary"
            block
            size="large"
            :loading="pending"
            >{{ copy.action }}</VBtn
          >
        </VForm>
        <p
          v-if="mode === 'login'"
          class="mt-6 text-center text-body-2 text-medium-emphasis"
        >
          ยังไม่มีบัญชี?
          <RouterLink to="/register" class="text-primary font-weight-medium"
            >สมัครสมาชิก</RouterLink
          >
        </p>
        <p
          v-else-if="mode === 'register'"
          class="mt-6 text-center text-body-2 text-medium-emphasis"
        >
          มีบัญชีแล้ว?
          <RouterLink to="/login" class="text-primary font-weight-medium"
            >เข้าสู่ระบบ</RouterLink
          >
        </p>
        <p v-else-if="mode === 'forgot'" class="mt-6 text-center">
          <RouterLink to="/login" class="text-primary text-body-2"
            >กลับไปหน้าเข้าสู่ระบบ</RouterLink
          >
        </p>
      </VCard>
    </div>
  </main>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
}
.auth-grid {
  display: grid;
  max-width: 1100px;
  grid-template-columns: minmax(0, 1fr) 480px;
  gap: 64px;
  align-items: center;
}
.auth-hero {
  min-height: 560px;
}
@media (max-width: 959px) {
  .auth-grid {
    display: flex;
    justify-content: center;
  }
}
</style>
