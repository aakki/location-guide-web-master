import Vue from "vue";
import Vuex from "vuex";
import auth from "@/store/modules/auth";
import alerts from "@/store/modules/alerts";
import preloader from "@/store/modules/preloader";
import localization from "@/store/modules/localization";
import breadcrumbs from "@/store/modules/breadcrumbs";

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    auth,
    alerts,
    preloader,
    localization,
    breadcrumbs
  }
});
