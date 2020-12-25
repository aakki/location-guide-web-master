<script lang="ts">
import Vue from "vue";
import store from "@/store/index";
import { User } from "@/interfaces/User";
import { Company } from "@/interfaces/Company";
import { Application } from "@/interfaces/Application";
import Requests from "@/services/api/Requests";
import logger from "vuex/dist/logger";

interface OriginalApplications {
  [uuid: string]: Application;
}

export default Vue.extend({
  name: "Profile",

  data: () => ({
    user: {} as User,
    company: {} as Company,
    applications: [] as Array<Application>,
    originalApplications: {} as OriginalApplications,
    formChanged: false as boolean,
    valid: true,
    required: [(v: string) => !!v || "Field is required"]
  }),

  watch: {
    user: {
      deep: true,
      handler(): void {
        this.formChanged = true;
        this.$store.dispatch("breadcrumbs/showSave");
      }
    },
    company: {
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
    try {
      const user: User = await Requests.get(`user/current`);
      const company: Company = await Requests.get(
        `company/${user.companyUUID}`
      );
      const applications: Array<Application> =
        (await Requests.get(`application`)).data || [];

      next((vm: any) => {
        vm.checkExistBreadcrumbs();
        vm.setData(user, company, applications);
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
          await this.updateProfile();
          next();
        } catch (e) {
          await this.$store.dispatch("alerts/show", {
            text: e,
            color: "error"
          });
        }
      })
      .catch(() => {
        next();
      });
  },

  methods: {
    async updateProfile(): Promise<any> {
      if (this.formChanged) {
        if (await (this.$refs.form as any).validate()) {
          this.user = await this.$http.put(`user/${this.user.uuid}`, this.user);
          this.company = await this.$http.put(
            `company/${this.company.uuid}`,
            this.company
          );
          await this.$store.dispatch("alerts/show", {
            text: "Profile updated successfully!",
            color: "success"
          });
        } else {
          throw "Please fill required fields";
        }
      }
    },
    setData(
      user: User,
      company: Company,
      applications: Array<Application>
    ): void {
      this.user = user;
      this.company = company;
      this.applications = applications;
      (this.$refs.form as any).resetValidation();
      if (!this.isDefaultLang) {
        this.loadDefaultLangApps();
      }
      this.$nextTick(() => {
        this.formChanged = false;
        this.$store.dispatch("breadcrumbs/hideSave");
      });
    },
    async loadDefaultLangApps(): Promise<void> {
      try {
        const applications: Array<Application> =
          (
            await this.$http.get(`application`, {
              headers: {
                "Accept-Language": this.defaultLang
              }
            })
          ).data || [];

        const originalApplications: OriginalApplications = {};

        for (const item of applications) {
          originalApplications[item.uuid] = item;
        }

        this.originalApplications = { ...originalApplications };
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
        this.$store.dispatch("breadcrumbs/push", {
          text: "Profile",
          to: "/profile"
        });
      } else {
        this.$store.dispatch("breadcrumbs/removeAfter", 1);
      }
    },
    async editApplication(uuid: string): Promise<any> {
      try {
        await this.$router.push(
          `application/${this.company.uuid}/edit/${uuid}`
        );
        await this.$store.dispatch("breadcrumbs/push", {
          text: "Application",
          to: `/application/${this.company.uuid}/edit/${uuid}`
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
    logout() {
      this.$store.dispatch("auth/logout");
      this.$router.push("/login");
      document.location.reload();
    },
    async saveChanges() {
      try {
        this.formChanged = true;
        await this.$store.dispatch("breadcrumbs/showSave");
        await this.updateProfile();
      } catch (e) {
        await this.$store.dispatch("alerts/show", {
          text: e,
          color: "error"
        });
      }
      this.formChanged = false;
      await this.$store.dispatch("breadcrumbs/hideSave");
    },
    async addNewApplication(): Promise<any> {
      try {
        await this.$router.push(`/application/${this.company.uuid}`);
        await this.$store.dispatch("breadcrumbs/push", {
          text: "Application",
          to: `/application/${this.company.uuid}`
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
              First name
            </span>
            <div>
              <v-text-field
                v-model="user.firstName"
                class="custom-input"
                dense
                outlined
              />
            </div>
          </li>
          <li>
            <span class="input-header">
              Last name
            </span>
            <div>
              <v-text-field
                v-model="user.lastName"
                class="custom-input"
                dense
                outlined
              />
            </div>
          </li>
          <li>
            <span class="input-header">
              Email
            </span>
            <div>
              <v-text-field
                v-model="user.email"
                class="custom-input"
                dense
                :rules="required"
                outlined
              />
            </div>
          </li>
          <li class="mb-2">
            <span class="input-header">
              Phone
            </span>
            <div>
              <v-text-field
                v-model="user.phone"
                class="custom-input"
                dense
                outlined
                type="number"
              />
            </div>
          </li>
          <v-divider />
          <li class="mt-4">
            <span class="input-header">
              Company name
            </span>
            <div>
              <v-text-field
                v-model="company.name"
                class="custom-input"
                dense
                outlined
                :rules="required"
              />
            </div>
          </li>
          <li>
            <span class="input-header">
              Company address
            </span>
            <div>
              <v-text-field
                v-model="company.address"
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
        Applications
        <span class="list-button ml-2" @click="addNewApplication()">
          add
        </span>
      </span>
      <ul class="mt-3 application-list" v-if="isDefaultLang">
        <li v-for="(item, index) in applications" :key="index">
          <div class="list-button" @click="editApplication(item.uuid)">
            <span v-if="item.nameLocalized">{{ item.nameLocalized }}</span>
            <span v-else class="caption grey--text">No application name</span>
          </div>
        </li>
      </ul>
      <ul
        class="mt-3 application-list"
        v-else-if="Object.keys(originalApplications).length"
      >
        <li v-for="(item, index) in applications" :key="index">
          <div class="list-button" @click="editApplication(item.uuid)">
            <span v-if="item.nameLocalized">{{ item.nameLocalized }}</span>
            <span v-else class="caption grey--text">No application name</span>
            <span> ({{ originalApplications[item.uuid].nameLocalized }}) </span>
          </div>
        </li>
      </ul>
    </div>

    <div class="mt-5 text-center">
      <v-divider></v-divider>
      <v-btn
        class="login-button my-11 text-capitalize"
        outlined
        width="303"
        @click="logout()"
      >
        Logout
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.profile-application {
  font-size: 18px;
  color: #0f98b6;
}

.application-list,
.application-btn {
  font-size: 18px !important;
}

.application-btn {
  margin-bottom: 3px;
  color: #0f98b6 !important;
}

.application {
  font-size: 18px;
  font-weight: 500;
  min-width: inherit !important;
  color: #0f98b6 !important;
}

.custom-input-list >>> input[type="number"]::-webkit-inner-spin-button,
.custom-input-list >>> input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.login-button {
  border: 1px solid #0f98b6 !important;
  background: #dff4f9;
  color: #0f98b6;
  font-size: 18px;
}
</style>
