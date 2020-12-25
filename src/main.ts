import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import Requests from "@/services/api/Requests";
import confirm from "@/directives/confirm";
import "./style/main.scss";
import { Loader } from "google-maps";

const loader = new Loader("AIzaSyB1SpMpjZYjPiFX8289GrH4eNXd4ZUNy9w", {});

// @ts-ignore
import VuejsDialog from "vuejs-dialog";

// Tell Vue to install the plugin.
Vue.use(VuejsDialog);

Vue.directive("confirm", confirm);
Vue.config.productionTip = false;

Vue.prototype.$http = Requests;
Vue.prototype.$google = loader.load();

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount("#app");
