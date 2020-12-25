<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "Preloader",

  computed: {
    show(): boolean {
      return this.$store.getters["preloader/show"];
    }
  }
});
</script>

<template>
  <div class="linear">
    <v-progress-linear
      v-if="show"
      color="primary"
      height="3"
      indeterminate
    ></v-progress-linear>
  </div>
</template>

<style lang="scss" scoped>
.linear {
  position: fixed;
  height: 3px;
  width: 100%;
  top: 0;
  left: 0;
  z-index: 1000;
}
</style>
