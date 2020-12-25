<script lang="ts">
import Vue from "vue";
import FileUploader from "@/components/FileUploader.vue";
import store from "@/store";
import { Guide } from "@/interfaces/Guide";
import Requests from "@/services/api/Requests";
import draggable from "vuedraggable";

export default Vue.extend({
  name: "Guide",

  components: {
    FileUploader,
    draggable
  },

  data: () => ({
    fileLoader: {
      show: false as boolean,
      noModal: false as boolean
    },
    guide: {
      bodyLocalized: "",
      nameLocalized: "",
      latitude: 0,
      longitude: 0,
      sort: 0,
      images: []
    } as Guide,
    valid: true,
    formChanged: false as boolean,
    fileBaseUrl: `${process.env.VUE_APP_API_SERVER_URL}/file` as string,
    dragging: false as boolean,
    required: [(v: string) => !!v || "Field is required"]
  }),

  watch: {
    guide: {
      deep: true,
      handler(): void {
        this.formChanged = true;
        this.$store.dispatch("breadcrumbs/showSave");
      }
    }
  },

  computed: {
    createMode(): boolean {
      return !this.$route.params.edit;
    },
    sortedImages(): Array<any> {
      if (this.guide.images) {
        return [...this.guide.images].sort((a, b) => a.sort - b.sort);
      }
      return [];
    }
  },

  async beforeRouteEnter(to, from, next) {
    try {
      if (!to.params.edit) {
        next((vm: any) => {
          vm.checkExistBreadcrumbs();
        });
        return;
      }
      const guide: Guide = await Requests.get(`guide/${to.params.guide_id}`);
      next((vm: any) => {
        vm.checkExistBreadcrumbs();
        vm.setData(guide);
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
          if (this.createMode && to.name === "locations") {
            next(`/location/${this.guide.uuid}`);
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
        if (this.createMode && to.name === "locations") {
          return;
        }
        next();
      });
  },

  methods: {
    async loadData() {
      try {
        const guide: Guide = await this.$http.get(
          `guide/${this.$route.params.guide_id}`
        );
        this.setData(guide);
      } catch (e) {
        await store.dispatch("alerts/show", {
          text: e,
          color: "error"
        });
      }
    },
    setData(guide: Guide): void {
      this.guide = guide;
      (this.$refs.form as any).resetValidation();
      this.$nextTick(() => {
        this.formChanged = false;
        this.$store.dispatch("breadcrumbs/hideSave");
      });
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
            to: `/application/${this.$route.params.id}`,
            disabled: true
          },
          {
            text: "Guide",
            to: `/guide/${this.$route.params.application_id}`
          }
        ]);
      } else {
        this.$store.dispatch("breadcrumbs/removeAfter", 3);
      }
    },
    async updateApp(): Promise<void> {
      if (this.formChanged) {
        this.guide = await this.$http.put(
          `guide/${this.$route.params.guide_id}`,
          {
            ...this.guide,
            applicationUUID: this.$route.params.application_id
          }
        );
        await this.$store.dispatch("alerts/show", {
          text: "Guide updated successfully!",
          color: "success"
        });
      }
    },
    async createApp(): Promise<void> {
      this.guide = await this.$http.post("guide", {
        ...this.guide,
        applicationUUID: this.$route.params.application_id
      });
      await this.$store.dispatch("breadcrumbs/splice", {
        index: 2,
        item: {
          text: "Guide",
          to: `/guide/${this.$route.params.application_id}/edit/${this.guide.uuid}`
        }
      });
      await this.$store.dispatch("alerts/show", {
        text: "Guide saved successfully!",
        color: "success"
      });
    },
    async editLocation(): Promise<void> {
      try {
        if (this.createMode) {
          this.formChanged = true;
          await this.$store.dispatch("breadcrumbs/showSave");
        }

        const appId = this.$route.params.application_id;

        try {
          await this.$router.push(`/location/${this.guide.uuid}`);
        } catch {
          await Promise.resolve();
        }

        if (this.createMode) {
          await this.$store.dispatch("breadcrumbs/splice", {
            index: 2,
            item: {
              text: "Guide",
              to: `/guide/${appId}/edit/${this.guide.uuid}`
            }
          });
        }
        await this.$store.dispatch("breadcrumbs/push", {
          text: "Location",
          to: `/location/${this.guide.uuid}`
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
    async saveChanges(): Promise<void> {
      try {
        this.formChanged = true;

        if (await (this.$refs.form as any).validate()) {
          await this.$store.dispatch("breadcrumbs/showSave");
          if (this.createMode) {
            await this.createApp();
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
    async addImage(e: any): Promise<void> {
      this.fileLoader.show = false;
      this.fileLoader.noModal = false;

      if (e && e.dataTransfer.effectAllowed === "move") {
        return;
      }
      try {
        if (this.createMode) {
          await this.createApp();
          await this.$router.push(
            `/guide/${this.$route.params.application_id}/edit/${this.guide.uuid}`
          );
          await this.$store.dispatch("breadcrumbs/splice", {
            index: 2,
            item: {
              text: "Guide",
              to: `/guide/${this.$route.params.application_id}/edit/${this.guide.uuid}`
            }
          });
        }
        this.fileLoader.show = true;
        if (!e) {
          this.fileLoader.noModal = true;
          this.$nextTick(() => {
            (this.$refs.fileUploader as any).pickFile();
          });
        }
      } catch (e) {
        await this.$store.dispatch("alerts/show", {
          text: e,
          color: "error"
        });
      }
    },
    closeFileDialog(): void {
      this.fileLoader.noModal = false;
      this.fileLoader.show = false;
      this.loadData();
    },
    async deleteImage(index: number) {
      try {
        await this.$http.delete(`file/${this.sortedImages[index].uuid}`);
        await this.loadData();
      } catch (e) {
        await this.$store.dispatch("alerts/show", {
          text: e,
          color: "error"
        });
      }
    },
    async reorderImage() {
      try {
        this.guide.images = this.guide.images.map(
          (item: any, index: number) => ({
            ...item,
            sort: index
          })
        );
        for await (const image of this.guide.images) {
          await this.$http.put(`file/${image.uuid}`, image);
        }
      } catch (e) {
        await this.$store.dispatch("alerts/show", {
          text: e,
          color: "error"
        });
      }
    },
    async endDrag(): Promise<void> {
      this.dragging = false;
      await this.reorderImage();
    }
  }
});
</script>

<template>
  <div>
    <div @dragover="addImage" @dragenter="closeFileDialog" class="mb-5">
      <v-form lazy-validation ref="form" v-model="valid">
        <ul class="custom-input-list mt-7">
          <li>
            <span class="input-header">
              Name
              <span
                class="grey--text font-weight-regular pl-1"
                style="font-size: 14px"
                >(localized)</span
              >
            </span>
            <div>
              <v-text-field
                v-model="guide.nameLocalized"
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
                v-model="guide.bodyLocalized"
                class="custom-input"
                dense
                :rules="required"
                outlined
              />
            </div>
          </li>
        </ul>
      </v-form>
      <div>
        <div>
          <span class="images-header">
            Images
          </span>
          <span class="ml-2 mb-1 list-button" @click="addImage()">
            add
          </span>
        </div>
        <draggable
          class="pa-0 body-1 font-weight-bold images-container"
          ghost-class="ghost"
          handle=".handle"
          tag="ul"
          @end="endDrag"
          @start="dragging = true"
          :list="guide.images"
        >
          <div
            v-for="(image, index) in sortedImages"
            :key="index"
            class="image-container mr-2 handle"
          >
            <v-hover v-slot="{ hover }">
              <div>
                <img
                  class="image"
                  draggable="false"
                  alt="Location image"
                  :src="`${fileBaseUrl}/${image.uuid}`"
                />
                <v-btn
                  v-if="hover"
                  v-confirm="{
                    title: 'Delete confirm',
                    message: 'Delete selected image?',
                    callback: () => deleteImage(index)
                  }"
                  class="red--text white image-remove-btn"
                  text
                >
                  delete
                </v-btn>
              </div>
            </v-hover>
          </div>
        </draggable>
      </div>
    </div>
    <v-divider />
    <div class="mt-5" style="padding-bottom: 90px">
      <span class="next-category-header">
        Locations
      </span>
      <ul>
        <li class="py-0 mt-2">
          <div class="px-0 list-button" @click="editLocation()">
            {{ guide.locations ? guide.locations.length : 0 }} locations
          </div>
        </li>
      </ul>
    </div>
    <file-uploader
      v-model="fileLoader.show"
      :no-modal="fileLoader.noModal"
      ref="fileUploader"
      :guide-id="guide.uuid"
      v-if="fileLoader.show"
      height="calc(100vh - 120px)"
      @close="closeFileDialog"
    ></file-uploader>
  </div>
</template>

<style scoped>
.images-header {
  font-size: 18px;
  font-weight: 500;
  margin-top: 2px;
}

.zoom-container {
  font-weight: bolder;
  position: absolute;
  top: 5px;
  right: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}
.zoom-button {
  text-align: center;
  height: 29px;
  width: 29px;
  background: #ffffff;
  border-left: 1px solid #545454;
  border-right: 1px solid #545454;
  position: relative;
  color: #545454;
}
.zoom-icon {
  font-size: 22px;
  color: #343434;
}
.zoom-button:hover .zoom-icon {
  color: #000;
}
.zoom-container .zoom-button:first-child {
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  border-top: 1px solid #545454;
}
.zoom-container .zoom-button:first-child::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 50%;
  width: 65%;
  height: 1px;
  transform: translate(-50%);
  background: rgb(90%, 90%, 90%);
  z-index: 999999;
}
.zoom-container .zoom-button:last-child {
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
  border-bottom: 1px solid #545454;
}

.add-btn,
.location-btn {
  font-size: 18px !important;
  font-weight: 500;
  text-transform: lowercase;
  min-width: inherit !important;
  color: #0f98b6 !important;
}

.image-remove-btn {
  position: absolute;
  right: 10px;
  top: 10px;
  font-size: 16px;
  font-weight: 500;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  border: 1px solid #545454;
}

.image {
  height: 325px;
  width: inherit !important;
  object-fit: contain;
  border: 1px solid #929292;
}

.images-container {
  overflow: auto hidden;
  display: grid;
  grid-template-columns: repeat(100, 1fr);
  grid-template-rows: 1fr;
  position: relative;
}

.image-container {
  height: 325px;
  position: relative;
  padding-right: 5px;
}

.ghost {
  opacity: 0;
}

.handle {
  cursor: move;
}
</style>
