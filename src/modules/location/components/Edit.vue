<script lang="ts">
import Vue from "vue";
import LangSwitcher from "@/components/LangSwitcher.vue";
import FileUploader from "@/components/FileUploader.vue";
import { Location } from "@/interfaces/Location";
import { Area } from "@/interfaces/Area";
import draggable from "vuedraggable";

export default Vue.extend({
  name: "EditLocation",

  components: {
    LangSwitcher,
    FileUploader,
    draggable
  },

  props: {
    value: {
      required: false,
      default: false,
      type: Boolean
    },
    item: {
      required: true,
      type: Object
    },
    createMode: {
      required: false,
      default: false,
      type: Boolean
    },
    zoom: {
      required: false,
      default: 2,
      type: Number
    }
  },

  data: () => ({
    dialog: false as boolean,
    dragging: false as boolean,
    locales: {
      saveImage: `Image file was uploaded successfully!` as string,
      saveAudio: `Audio file was uploaded successfully!` as string
    },
    model: {
      location: {} as Location,
      area: {} as Area
    },
    addDialog: {
      show: false as boolean,
      acceptAudio: false as boolean,
      skipQuery: false as boolean,
      noModal: false as boolean
    },
    rules: {
      required: [(v: string) => !!v || "Field is required"],
      longitude: [
        (v: string) =>
          (Number(v) <= 180 && Number(v) >= -180) ||
          "The field must contain a value between 180 and -180"
      ],
      latitude: [
        (v: string) =>
          (Number(v) <= 90 && Number(v) >= -90) ||
          "The field must contain a value between 90 and -90"
      ]
    },
    map: null as any,
    marker: null as any,
    fileBaseUrl: `${process.env.VUE_APP_API_SERVER_URL}/file` as string,
    formChanged: false as boolean
  }),

  watch: {
    value() {
      this.dialog = this.value;
    },
    item() {
      this.model = this.item;
    },
    model: {
      deep: true,
      handler(): void {
        this.formChanged = true;
      }
    }
  },

  computed: {
    sortedImages(): Array<any> {
      if (this.model.location.images) {
        return [...this.model.location.images].sort((a, b) => a.sort - b.sort);
      }
      return [];
    }
  },

  mounted(): void {
    this.model = { ...this.item };
    this.dialog = this.value;

    this.$nextTick(() => {
      this.loadMap();
      (this.$refs.form as any).resetValidation();
      this.formChanged = false;
    });
  },

  methods: {
    async loadMap(): Promise<void> {
      let zoom = this.zoom;

      if (!this.createMode) {
        zoom = this.getCurrentZoom();
      }

      this.map = new (await this.$google).maps.Map(this.$refs.map as any, {
        center: {
          lat: Number(this.model.area.latitude),
          lng: Number(this.model.area.longitude)
        },
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
        zoom
      });

      this.map.addListener("click", async (e: any) => {
        this.model.area.longitude = e.latLng.lng();
        this.model.area.latitude = e.latLng.lat();
        await this.setMarker();
      });

      await this.setMarker();
    },
    async setMarker(): Promise<void> {
      if (!this.map) {
        return;
      }

      if (this.marker) {
        this.marker.setMap(null);
      }

      this.marker = new (await this.$google).maps.Circle({
        strokeColor: "#E47B7B",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF9C9C",
        fillOpacity: 0.35,
        draggable: true,
        center: {
          lat: Number(this.model.area.latitude),
          lng: Number(this.model.area.longitude)
        },
        radius: Number(this.model.area.radius)
      });

      this.marker.setMap(this.map);

      this.marker.addListener("drag", (e: any) => {
        this.model.area.longitude = e.latLng.lng();
        this.model.area.latitude = e.latLng.lat();
      });
    },
    getCurrentZoom() {
      if (Number(this.model.area.radius) < 100) {
        return 15;
      }
      if (Number(this.model.area.radius) < 500) {
        return 12;
      }
      if (Number(this.model.area.radius) < 1000) {
        return 10;
      }
      if (Number(this.model.area.radius) < 5000) {
        return 9;
      }
      if (Number(this.model.area.radius) < 10000) {
        return 7;
      }
      if (Number(this.model.area.radius) < 50000) {
        return 6;
      }
      if (Number(this.model.area.radius) < 100000) {
        return 4;
      }
      return 2;
    },
    changeData(action: string, closeDialog: boolean): void {
      this.$emit(action, this.model);

      if (closeDialog) {
        this.dialog = false;
        this.$emit("input", this.dialog);
      }
    },
    pushImage(file: any) {
      if (!this.model.location.images) {
        this.model.location = { ...this.model.location, images: [] };
      }
      this.model.location.images.push(file);
      this.$store.dispatch("alerts/show", {
        text: this.locales.saveImage,
        color: "success"
      });
    },
    pushAudio(file: any) {
      if (!this.model.location.audioFiles) {
        this.model.location = { ...this.model.location, audioFiles: [] };
      }
      this.model.location.audioFiles.push(file);
      this.$store.dispatch("alerts/show", {
        text: this.locales.saveAudio,
        color: "success"
      });
    },
    deleteImage(index: number) {
      try {
        if (!this.createMode) {
          this.$http.delete(`file/${this.model.location.images[index].uuid}`);
        }
        this.model.location.images.splice(index, 1);
      } catch (e) {
        this.$store.dispatch("alerts/show", {
          text: e,
          color: "error"
        });
      }
    },
    async deleteAudio(index: number) {
      try {
        if (!this.createMode) {
          await this.$http.delete(
            `file/${this.model.location.audioFiles[index].uuid}`
          );
        }
        this.model.location.audioFiles.splice(index, 1);
      } catch (e) {
        await this.$store.dispatch("alerts/show", {
          text: e,
          color: "error"
        });
      }
    },
    addFile(e: any): void {
      if (e && e.dataTransfer.effectAllowed === "move") {
        return;
      }
      if (this.createMode) {
        this.addDialog.skipQuery = true;
      }
      this.addDialog.acceptAudio = true;
      this.addDialog.show = true;

      if (!e) {
        this.addDialog.noModal = true;
        this.$nextTick(() => {
          (this.$refs.fileUploader as any).pickFile();
        });
      }
    },
    closeAddDialog(): void {
      this.addDialog.noModal = false;
      this.addDialog.acceptAudio = false;
      this.addDialog.show = false;
      console.log(this.addDialog);
    },
    closeDialog(): void {
      if (this.formChanged) {
        (this as any).$dialog
          .confirm({
            title: `Do you want to ${
              this.createMode ? "create new location" : "save"
            }?`,
            okText: "Discard",
            cancelText: "Cancel"
          })
          .then(async () => {
            if (await (this.$refs.form as any).validate()) {
              (this.$parent as any).resetEditedItem();
              this.$emit("save", this.model);
              this.dialog = false;
              this.$emit("input", this.dialog);
            }
          })
          .catch(() => {
            this.dialog = false;
            this.$emit("input", this.dialog);
          });
      } else {
        this.dialog = false;
        this.$emit("input", this.dialog);
      }
      localStorage.removeItem("editedLoc");
    },
    async saveDialog(): Promise<void> {
      if (await (this.$refs.form as any).validate()) {
        this.$emit("save", this.model, () => {
          this.formChanged = false;
        });
      }
    },
    async saveBeforeLangChange(callback: Function): Promise<any> {
      if (this.formChanged) {
        if (await (this.$refs.form as any).validate()) {
          (this as any).$dialog
            .confirm({
              title: `Do you want to ${
                this.createMode ? "create new location" : "save"
              }?`,
              okText: "Discard",
              cancelText: "Cancel"
            })
            .then(() => {
              (this.$parent as any).resetEditedItem();
              this.$emit("save", this.model, callback);
              this.dialog = false;
              this.$emit("input", this.dialog);
            })
            .catch(() => {
              Promise.resolve();
            });
        }
      } else {
        callback();
      }
    },
    async reorderImage() {
      try {
        this.model.location.images = this.model.location.images.map(
          (item: any, index: number) => ({
            ...item,
            sort: index
          })
        );
        if (!this.createMode) {
          for await (const image of this.model.location.images) {
            await this.$http.put(`file/${image.uuid}`, image);
          }
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
  <div id="edit-dialog">
    <v-dialog
      v-model="dialog"
      attach="#edit-dialog"
      eager
      height="calc(100vh - 130px)"
      max-width="863px"
      persistent
    >
      <v-card @dragover="addFile" @dragenter="closeAddDialog">
        <v-card-title class="py-1">
          <v-row align="center">
            <div>
              <span class="ml-5">
                <v-icon @click="closeDialog()">
                  mdi-close
                </v-icon>
                <span class="pl-3 modal-header">
                  Edit {{ createMode ? "new" : "" }} location
                </span>
              </span>
            </div>
            <v-spacer></v-spacer>
            <span
              v-if="formChanged"
              class="list-button pr-6"
              @click="saveDialog()"
              >save</span
            >
            <lang-switcher
              @save="saveBeforeLangChange"
              with-confirm
            ></lang-switcher>
            <v-btn
              v-if="!createMode"
              v-confirm="{
                title: 'Delete confirm',
                message: 'Delete edited location?',
                callback: () => changeData('delete', true)
              }"
              class="red--text text-lowercase delete-btn"
              text
            >
              delete
            </v-btn>
          </v-row>
        </v-card-title>
        <v-card-text class="edit-content">
          <v-form ref="form" lazy-validation>
            <v-row>
              <v-col class="py-0" cols="7">
                <div
                  ref="map"
                  class="google-map"
                  style="height: 100%; width: 100%"
                ></div>
              </v-col>
              <v-col class="py-0" cols="5">
                <ul class="custom-input-list">
                  <li>
                    <span class="input-header">
                      Title
                      <span
                        class="grey--text font-weight-regular pl-1"
                        style="font-size: 14px"
                        >(localized)</span
                      >
                    </span>
                    <v-text-field
                      v-model="model.location.titleLocalized"
                      :rules="rules.required"
                      class="custom-input"
                      dense
                      outlined
                    />
                  </li>
                  <li>
                    <span class="input-header">
                      Latitude
                    </span>
                    <v-text-field
                      v-model="model.area.latitude"
                      :rules="[...rules.required, ...rules.latitude]"
                      class="custom-input hide-arrow"
                      dense
                      outlined
                      type="number"
                      @input="setMarker"
                    />
                  </li>
                  <li>
                    <span class="input-header">
                      Longitude
                    </span>
                    <v-text-field
                      v-model="model.area.longitude"
                      :rules="[...rules.required, ...rules.longitude]"
                      class="custom-input hide-arrow"
                      dense
                      outlined
                      type="number"
                      @input="setMarker"
                    />
                  </li>
                  <li>
                    <span class="input-header">
                      Radius (meter)
                    </span>
                    <v-text-field
                      v-model="model.area.radius"
                      class="custom-input"
                      :rules="[...rules.required]"
                      dense
                      outlined
                      type="number"
                      @input="setMarker"
                    />
                  </li>
                </ul>
              </v-col>
            </v-row>
            <div class="description-container mt-3">
              <span class="input-header">
                Description
                <span
                  class="grey--text font-weight-regular pl-1"
                  style="font-size: 14px"
                  >(localized)</span
                >
              </span>
              <v-textarea
                v-model="model.location.bodyLocalized"
                auto-grow
                dense
                :rules="rules.required"
                outlined
                row-height="24px"
                rows="1"
              />
            </div>
            <div class="black--text mt-3">
              <span class="audio-header">
                Audio
              </span>
              <span
                class="grey--text font-weight-regular pl-1"
                style="font-size: 14px"
                >(localized)</span
              >
              <span class="ml-2 mb-1 px-0 list-button" @click="addFile()">
                add
              </span>
              <div
                v-for="(audio, index) in model.location.audioFiles"
                :key="index"
                class="audio-subheader d-flex align-center mb-2"
              >
                <audio
                  v-if="audio.offlineMode"
                  :src="audio.file"
                  controls
                  style="height: 30px"
                >
                  Your browser does not support the
                  <code>audio</code> element.
                </audio>
                <audio
                  v-else
                  :src="`${fileBaseUrl}/${audio.uuid}`"
                  controls
                  style="height: 30px"
                >
                  Your browser does not support the
                  <code>audio</code> element.
                </audio>
                <v-btn
                  v-confirm="{
                    title: 'Delete confirm',
                    message: 'Delete selected audio?',
                    callback: () => deleteAudio(index)
                  }"
                  class="red--text white text-lowercase audio-delete-btn"
                  text
                >
                  delete
                </v-btn>
              </div>
            </div>
            <v-row>
              <v-col class="pa-0" cols="12">
                <v-col
                  class="py-0 text-subtitle-1 black--text font-weight-bold"
                  cols="3"
                >
                  <span class="images-header">
                    Image
                  </span>
                  <span class="ml-2 mb-1 px-0 list-button" @click="addFile()">
                    add
                  </span>
                </v-col>
                <draggable
                  class="pa-0 mx-3 body-1 font-weight-bold images-container"
                  style="position:relative"
                  ghost-class="ghost"
                  handle=".handle"
                  tag="div"
                  @end="endDrag"
                  @start="dragging = true"
                  :list="model.location.images"
                >
                  <div
                    v-for="(image, index) in sortedImages"
                    :key="index"
                    class="image-container handle mr-2"
                  >
                    <v-hover v-slot="{ hover }">
                      <div>
                        <img
                          class="image"
                          v-if="image.offlineMode"
                          draggable="false"
                          :src="image.file"
                          alt="Location image"
                        />
                        <img
                          v-else
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
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
    <file-uploader
      v-model="addDialog.show"
      :accept-audio="addDialog.acceptAudio"
      :location-id="model.location.uuid"
      :skip-query="addDialog.skipQuery"
      v-if="addDialog.show"
      height="calc(100vh - 90px)"
      width="863px"
      ref="fileUploader"
      @close="closeAddDialog"
      @uploadAudio="pushAudio"
      :no-modal="addDialog.noModal"
      @uploadImage="pushImage"
    ></file-uploader>
  </div>
</template>

<style scoped>
.google-map {
  border: 1px solid #929292;
  border-radius: 4px;
}
.edit-content {
  padding-left: 75px !important;
}

.modal-header {
  font-size: 20px !important;
  font-weight: bold;
}

.custom-input {
  margin-top: 3px;
  margin-bottom: 7px;
}

.description-container {
  width: 55%;
}

.input-header {
  font-size: 14px;
  font-weight: 500;
  color: #000;
}

.audio-header {
  font-size: 18px;
  font-weight: 500;
  margin-top: 2px;
  color: #000;
}

.audio-subheader {
  font-size: 18px;
}

.add-btn {
  min-width: inherit !important;
  font-size: 18px;
  font-weight: 500;
  height: inherit !important;
  color: #0f98b6 !important;
}

.delete-btn {
  font-weight: 500;
  font-size: 18px;
}

.images-header {
  font-size: 18px;
  font-weight: 500;
  margin-top: 2px;
}

.audio-play-btn,
.audio-delete-btn {
  font-size: 18px;
  font-weight: 500;
  height: inherit !important;
}

.audio-hint {
  font-size: 18px;
}

.image {
  height: 325px;
  width: inherit !important;
  object-fit: contain;
  border: 1px solid #929292;
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

.zoom-container {
  font-weight: bolder;
  position: absolute;
  top: 50px;
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

.hide-arrow >>> input[type="number"]::-webkit-inner-spin-button,
.hide-arrow >>> input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
