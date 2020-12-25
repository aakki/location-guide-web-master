<script lang="ts">
import { BreadcrumbsItem } from "@/interfaces/Breadcrumbs";
import Vue from "vue";

export default Vue.extend({
  name: "Breadcrumbs",

  computed: {
    items(): Array<BreadcrumbsItem> {
      return this.$store.getters["breadcrumbs/get"];
    },
    current(): string {
      return this.$route.path;
    }
  },

  methods: {
    clickHandler(item: BreadcrumbsItem): void {
      if (!item.disabled) {
        this.$router.push(item.to);
      }
    }
  }
});
</script>

<template>
  <v-breadcrumbs :items="items">
    <template v-slot:item="{ item }">
      <span
        v-if="!current.includes(item.to)"
        :class="{ 'cursor-pointer': !item.disabled }"
        @click="clickHandler(item)"
      >
        <span class="black--text">
          {{ item.text }}
        </span>
      </span>
      <span v-else class="font-weight-bold">
        {{ item.text }}
      </span>
    </template>
  </v-breadcrumbs>
</template>

<style scoped>
span {
  font-size: 18px;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
