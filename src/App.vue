<script lang="ts">
import Vue from "vue";
import Alerts from "@/components/Alerts.vue";
import Preloader from "@/components/Preloader.vue";
import Breadcrumbs from "@/components/Breadcrumbs.vue";
import LangSwitcher from "@/components/LangSwitcher.vue";

export default Vue.extend({
  name: "App",

  components: {
    Alerts,
    Preloader,
    Breadcrumbs,
    LangSwitcher
  },
  computed: {
    hideNav(): boolean {
      return this.$route.meta.hideNav;
    },
    allowSave(): boolean {
      return (
        this.$route.name !== "locations" &&
        this.$store.getters["breadcrumbs/getSave"]
      );
    }
  },

  mounted() {
    if (localStorage.getItem("editedLoc") && this.$route.name !== "locations") {
      localStorage.removeItem("editedLoc");
    }
  },

  methods: {
    async save() {
      await (this.$refs.router as any).saveChanges();
    }
  }
});
</script>

<template>
  <v-app>
    <alerts></alerts>
    <preloader></preloader>
    <v-app-bar
      v-show="!hideNav"
      absolute
      class="px-2"
      color="grey lighten-2"
      flat
      height="54"
    >
      <div class="d-flex align-center wrapper">
        <breadcrumbs v-if="!hideNav"></breadcrumbs>
        <v-spacer></v-spacer>
        <span v-if="allowSave" class="list-button pr-6" @click="save()"
          >save</span
        >
        <lang-switcher ref="langSwitch"></lang-switcher>
      </div>
    </v-app-bar>
    <router-view ref="router" class="router-view wrapper"></router-view>
  </v-app>
</template>

<style lang="scss" scoped>


.router-view {
  margin-top: 54px !important;
}

.wrapper {
  width: 1002px;
  margin: 0 auto;
}
</style>
