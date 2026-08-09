import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";
import "@/styles/main.scss";

import { createApp } from "vue";

import App from "@/App.vue";
import { router } from "@/router";
import { vuetify } from "@/plugins/vuetify";
import { i18n } from "@/i18n";

createApp(App).use(i18n).use(router).use(vuetify).mount("#app");
