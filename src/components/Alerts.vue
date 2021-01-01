<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "Preloader",

  computed: {
    show(): boolean {
      return this.$store.getters["alerts/show"];
    },
    message(): any {
      return this.$store.getters["alerts/message"];
    }
  },

  watch: {
    show() {
      try {
        if (this.show) {
          if (
            this.message &&
            this.message.text &&
            !this.message.text.includes("file")
          ) {
            setTimeout(() => {
              this.hide();
            }, 4000);
          } else if (
            this.message &&
            this.message.text &&
            this.message.text.includes("Image file was uploaded successfully!")
          ) {
            setTimeout(() => {
              this.hide();
            }, 4000);
          }
        }
      } catch {
        Promise.resolve();
      }
    }
  },

  methods: {
    hide(): void {
      this.$store.dispatch("alerts/hide");
    }
  }
});
</script>

<template>
  <div>
    <v-snackbar
      v-if="typeof message.text === 'string'"
      v-model="show"
      :color="message.color"
      :timeout="0"
      bottom
      multi-line
      right
    >
      <div v-if="message.text && message.text.includes(';')">
        <div v-for="(item, index) in message.text.split(';')" :key="index">
          {{ item }}
        </div>
      </div>
      <div v-else-if="message.text">
        {{ message.text }}
      </div>
      <div class="text-right">
        <v-btn bottom dark right text @click="hide()">
          Close
        </v-btn>
      </div>
    </v-snackbar>
  </div>
</template>

<style lang="scss" scoped></style>
