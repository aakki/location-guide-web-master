<script lang="ts">
import Vue from "vue";
import { Application } from "@/interfaces/Application";
import { Guide } from "@/interfaces/Guide";
import store from "@/store";
import Requests from "@/services/api/Requests";

interface OriginalGuides {
  [uuid: string]: Guide;
}

export default Vue.extend({
  name: "Application",

  data: () => ({
    createMode: false as boolean,
    application: {
      descriptionLocalized: "",
      marketingURLLocalized: "",
      nameLocalized: "",
      sort: 100,
      supportURLLocalized: ""
    } as Application,
    guides: [] as Array<Guide>,
    valid: true,
    originalGuides: {} as OriginalGuides,
    formChanged: false as boolean,
    required: [(v: string) => !!v || "Field is required"]
  }),


  watch: {
    application: {
      deep: true,
      handler(): void {
        this.formChanged = true;
        this.$store.dispatch("breadcrumbs/showSave");
      }
    }
  },

  computed: {
    isDefaultLang() {
      return this.$store.getters["localization/isDefault"];
    },
    defaultLang() {
      return this.$store.getters["localization/default"];
    }
  },

  async beforeRouteEnter(to, from, next) {
    if (!to.params.edit) {
      next((vm: any) => {
        vm.checkExistBreadcrumbs();
        vm.setCreateMode();
      });
      return;
    }
    try {
      const application: Application = await Requests.get(
        `application/${to.params.application_id}`
      );      
      const guides: Array<Guide> =
        (await Requests.get(`guide?applicationUUID=${application.uuid}`))
          .data || [];
      next((vm: any) => {
        vm.checkExistBreadcrumbs();
        vm.setData(application, guides);
      });
    } catch (e) {
      await store.dispatch("alerts/show", {
        text: e,
        color: "error"
      });
    }
  },

  async beforeRouteLeave(to, from, next) {
    if (!this.formChanged) {
      next();
      return;
    }
    (this as any).$dialog
      .confirm({
        title: "Do you want to save?",
        okText: "Discard",
        cancelText: "Cancel"
      })
      .then(async () => {
        try {
          await this.saveChanges();
          if (this.createMode && to.name === "guide") {
            next(`/guide/${this.application.uuid}`);
          } else {
            next();
          }
        } catch (e) {
          await this.$store.dispatch("alerts/show", {
            text: e,
            color: "error"
          });
        }
      })
      .catch(() => {
        if (this.createMode && to.name === "guide") {
          return;
        }
        next();
      });
  },

  methods: {
    setCreateMode(): void {
      this.createMode = true;
    },
    setData(application: Application, guides: Array<Guide>): void {
      this.application = application;
      this.guides = guides;
      (this.$refs.form as any).resetValidation();
      if (!this.isDefaultLang) {
        this.loadDefaultLangGuides();
      }
      this.$nextTick(() => {
        this.formChanged = false;
        this.$store.dispatch("breadcrumbs/hideSave");
      });
    },
    async loadDefaultLangGuides(): Promise<void> {
      try {
        const guides: Array<Guide> =
          (
            await this.$http.get(`guide`, {
              headers: {
                "Accept-Language": this.defaultLang
              }
            })
          ).data || [];

        const originalGuides: OriginalGuides = {};

        for (const item of guides) {
          originalGuides[item.uuid] = item;
        }

        this.originalGuides = { ...originalGuides };
      } catch (e) {
        this.formChanged = false;
        await this.$store.dispatch("breadcrumbs/hideSave");
        await this.$store.dispatch("alerts/show", {
          text: e,
          color: "error"
        });
      }
    },
    checkExistBreadcrumbs(): void {
      if (!this.$store.getters["breadcrumbs/length"]) {
        this.$store.dispatch("breadcrumbs/set", [
          {
            text: "Profile",
            to: "/profile"
          },
          {
            text: "Application",
            to: `/application/${this.$route.params.company_id}`
          }
        ]);
      } else {
        this.$store.dispatch("breadcrumbs/removeAfter", 2);
      }
    },
    async saveChanges(): Promise<any> {
      try {
        this.formChanged = true;
        if (await (this.$refs.form as any).validate()) {
          await this.$store.dispatch("breadcrumbs/showSave");
          if (this.createMode) {
            await this.createApp();
            await this.$store.dispatch("breadcrumbs/splice", {
              index: 1,
              item: {
                text: "Application",
                to: `/application/${this.$route.params.company_id}/edit/${this.application.uuid}`
              }
            });
          } else {
            await this.updateApp();
          }
        } else {
          throw "Please fill required fields";
        }
      } catch (e) {
        await this.$store.dispatch("alerts/show", {
          text: e,
          color: "error"
        });
        throw e;
      }
      this.formChanged = false;
      await this.$store.dispatch("breadcrumbs/hideSave");
    },
    async createApp(): Promise<any> {
      this.application = await this.$http.post("application", {
        ...this.application,
        name: this.application.nameLocalized
      });
      await this.$store.dispatch("alerts/show", {
        text: "Application saved successfully!",
        color: "success"
      });
    },
    async updateApp(): Promise<any> {
      if (this.formChanged) {
        this.application = await this.$http.put(
          `application/${this.$route.params.application_id}`,
          {
            ...this.application,
            name: this.application.nameLocalized
          }
        );
        await this.$store.dispatch("alerts/show", {
          text: "Application updated successfully!",
          color: "success"
        });
      }
    },
    async addNewGuide(): Promise<any> {
      try {
        if (this.createMode) {
          this.formChanged = true;
          await this.$store.dispatch("breadcrumbs/showSave");
        }
        try {
          await this.$router.push(`/guide/${this.application.uuid}`);
        } catch {
          await Promise.resolve();
        }
        await this.$store.dispatch("breadcrumbs/push", {
          text: "Guide",
          to: `/guide/${this.application.uuid}`
        });
      } catch (e) {
        this.formChanged = false;
        await this.$store.dispatch("breadcrumbs/hideSave");
        await this.$store.dispatch("alerts/show", {
          text: e,
          color: "error"
        });
      }
    },
    async editGuide(uuid: string): Promise<any> {
      try {
        if (this.createMode) {
          this.formChanged = true;
          await this.$store.dispatch("breadcrumbs/showSave");
        }
        await this.$router.push(`/guide/${this.application.uuid}/edit/${uuid}`);
        await this.$store.dispatch("breadcrumbs/push", {
          text: "Guide",
          to: `/guide/${this.application.uuid}/edit/${uuid}`
        });
      } catch (e) {
        this.formChanged = false;
        await this.$store.dispatch("breadcrumbs/hideSave");
        await this.$store.dispatch("alerts/show", {
          text: e,
          color: "error"
        });
      }
    }
  }
});
</script>

<template>
  <div>
    <div class="mb-2">
      <v-form lazy-validation ref="form" v-model="valid">
        <ul class="custom-input-list mt-7">
          <li>
            <span class="input-header">
              Application name
              <span
                class="grey--text font-weight-regular pl-1"
                style="font-size: 14px"
                >(localized)</span
              >
            </span>
            <div>
              <v-text-field
                v-model="application.nameLocalized"
                class="custom-input"
                dense
                :rules="required"
                outlined
              />
            </div>
          </li>
          <li>
            <span class="input-header">
              Description
              <span
                class="grey--text font-weight-regular pl-1"
                style="font-size: 14px"
                >(localized)</span
              >
            </span>
            <div>
              <v-text-field
                v-model="application.descriptionLocalized"
                class="custom-input"
                dense
                outlined
                :rules="required"
              />
            </div>
          </li>
          <li>
            <span class="input-header  d-flex align-center">
              <span>Support URL</span>
              <span
                class="grey--text font-weight-regular pl-1 pr-2"
                style="font-size: 14px"
                >(localized)</span
              >
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon small v-bind="attrs" v-on="on">
                    mdi-help-circle
                  </v-icon>
                </template>
                <span
                  >A URL with marketing information about your app. <br />
                  This URL will be visible on the App Store and Google
                  Play.</span
                >
              </v-tooltip>
            </span>
            <div>
              <v-text-field
                v-model="application.supportURLLocalized"
                class="custom-input"
                dense
                :rules="required"
                outlined
              />
            </div>
          </li>
          <li>
            <span class="input-header d-flex align-center">
              <span>
                Marketing URL
              </span>
              <span
                class="grey--text font-weight-regular pl-1 pr-2"
                style="font-size: 14px"
                >(localized)</span
              >
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon small v-bind="attrs" v-on="on">
                    mdi-help-circle
                  </v-icon>
                </template>
                <span
                  >A URL with support information for your app. <br />
                  This URL will be visible on the App Store and Google
                  Play.</span
                >
              </v-tooltip>
            </span>
            <div>
              <v-text-field
                v-model="application.marketingURLLocalized"
                class="custom-input"
                dense
                :rules="required"
                outlined
              />
            </div>
          </li>
        </ul>
      </v-form>
    </div>
    <v-divider />
    <div class="mt-5">
      <span class="next-category-header">
        Guides
        <span class="px-0 ml-2 list-button" @click="addNewGuide()">
          add
        </span>
      </span>
      <ul v-if="isDefaultLang" class="mt-3">
        <li v-for="(item, index) in guides" :key="index">
          <div class="list-button" @click="editGuide(item.uuid)">
            <span v-if="item.nameLocalized">{{ item.nameLocalized }}</span>
            <span v-else class="caption grey--text">No guide name</span>
          </div>
        </li>
      </ul>
      <ul
        class="mt-3 application-list"
        v-else-if="Object.keys(originalGuides).length"
      >
        <li v-for="(item, index) in guides" :key="index">
          <div class="list-button" @click="editGuide(item.uuid)">
            <span v-if="item.nameLocalized">{{ item.nameLocalized }}</span>
            <span v-else class="caption grey--text">No guide name</span>
            <span> ({{ originalGuides[item.uuid].nameLocalized }}) </span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.guide-btn,
.add-btn {
  font-size: 18px;
  font-weight: 500;
  color: #0f98b6 !important;
}

.guide-btn {
  min-width: inherit !important;
  margin-bottom: 3px;
}
</style>
