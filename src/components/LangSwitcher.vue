<script lang="ts">
import Vue from "vue";

interface LangObject {
  code: string;
  name: string;
  uuid: string;
  isDefault: boolean;
}

export default Vue.extend({
  name: "LangSwitcher",

  props: {
    withConfirm: {
      type: Boolean,
      required: false,
      default: false
    }
  },

  data: () => ({
    model: "",

    items: [] as Array<LangObject>
  }),
  watch: {
    lang: {
      immediate: true,
      handler() {
        this.model = this.lang;
      }
    }
  },
  computed: {
    lang(): string {
      return this.$store.getters["localization/lang"];
    }
  },
  async mounted() {
    await this.loadLocales();
    const defaultLang: LangObject = this.items.find(item => item.isDefault) || {
      code: "",
      isDefault: false,
      name: "",
      uuid: ""
    };

    this.$store.dispatch("localization/setDefault", defaultLang.code);

    if (this.lang) {
      this.$store.dispatch("localization/set", this.lang);
      return;
    }
    if (this.items.length) {
      this.$store.dispatch("localization/set", defaultLang && defaultLang.code);
    }
  },

  methods: {
    async loadLocales() {
      try {
        const response = await this.$http.get("/language");
        this.items = response.data || [];
      } catch (e) {
        await this.$store.dispatch("alerts/show", {
          text: e,
          color: "error"
        });
      }
    },
    async setLang(): Promise<any> {
      if (this.withConfirm) {
        this.$emit("save", async () => {
          const currentPath = this.$route.path;
          await this.$router.push("/reload");
          await this.$store.dispatch("localization/set", this.model);
          await this.$router.push(currentPath);
        });
        return;
      }
      const currentPath = this.$route.path;
      await this.$router.push("/reload");
      await this.$store.dispatch("localization/set", this.model);
      await this.$router.push(currentPath);
    }
  }
});
</script>

<template>
  <div class="select-width">
    <v-select
      v-model="model"
      :items="items"
      background-color="transparent"
      class="select"
      dense
      item-text="name"
      item-value="code"
      flat
      hide-details
      solo
      @change="setLang"
    ></v-select>
    <div v-show="false">
      {{ lang }}
    </div>
  </div>
</template>

<style scoped>
.select-width {
  width: 130px;
}

.select {
  font-size: 17px;
}
</style>
