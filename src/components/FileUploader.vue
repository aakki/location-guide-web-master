<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "FileUploader",

  props: {
    value: {
      required: false,
      default: false,
      type: Boolean
    },
    acceptAudio: {
      required: false,
      default: false,
      type: Boolean
    },
    noModal: {
      required: false,
      default: false,
      type: Boolean
    },
    skipQuery: {
      required: false,
      default: false,
      type: Boolean
    },
    locationId: {
      required: false,
      default: null,
      type: String
    },
    guideId: {
      required: false,
      default: null,
      type: String
    },
    height: {
      required: false,
      default: "calc(100vh - 100px)",
      type: String
    },
    width: {
      required: false,
      default: "1002px",
      type: String
    }
  },

  data: () => ({
    dialog: false as boolean,
    model: {} as object,
    loadingMessage: "" as string,
    maxImageSize: process.env.MAX_IMAZE_KB_SIZE as number,
    maxAudioSize: process.env.MAX_AUDIO_MB_SIZE as number
  }),

  watch: {
    value() {
      if (this.noModal) {
        this.pickFile();
      } else {
        this.dialog = this.value;
      }
    }
  },

  mounted(): void {
    if (!this.noModal) {
      this.dialog = this.value;
    }
  },

  methods: {
    saveUploadedFile(fileType: string): any {
      this.$emit(`upload${fileType}`, this.model);
      this.dialog = false;
    },
    async uploadFile(file: any): Promise<any> {
      this.loadingMessage = "";
      
      try {
        const form: FormData = new FormData();
        let fileType = "";

        const fileSize = ((file.size / 1024));
        if (file.type.includes("image")) {
          if (fileSize > this.maxImageSize) {
            await this.$store.dispatch("alerts/show", {
              text: `File size is too big, max size is 400 KB`,
              color: "error"
            });
            return; 
          } else {
            form.append("file", file);
            form.append("fileType", "0");
            fileType = "Image";
          }
        } else if (file.type.includes("audio") && this.acceptAudio) {
          const mbFile = fileSize / 1024;          
          if (mbFile > this.maxAudioSize) {
            await this.$store.dispatch("alerts/show", {
              text: `File size is too big, max size is 1 MB`,
              color: "error"
            });
            return;
          } else {
            form.append("file", file);
            form.append("fileType", "1");
            fileType = "Audio";
          }
        }

        if (this.locationId) {
          form.append("locationUUID", this.locationId.toString());
        }

        if (this.guideId) {
          form.append("guideUUID", this.guideId.toString());
        }

        if (!this.skipQuery) {
          this.loadingMessage = "Loading...";
          this.model = await this.$http.post("file", form);
        } else {
          this.model = {
            offlineMode: true,
            file: await this.toBase64(file),
            form
          };
        }
        this.saveUploadedFile(fileType);
        this.closeDialog();
      } catch (e) {
        await this.$store.dispatch("alerts/show", {
          text: e,
          color: "error"
        });
      } finally {
        this.loadingMessage = "";
      }
    },
    getFile(): void {
      const fileInput: any = this.$refs.file;
      const [file]: Array<File> = fileInput.files;
      if (file) {
        this.uploadFile(file);
      }
    },
    pickFile(): void {
      (this.$refs.file as any).click();
    },
    toBase64(file: File): Promise<any> {
      return new Promise(resolve => {
        const reader: FileReader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
      });
    },
    closeDialog(): void {
      this.$emit("close", this.model);
    },
    drop(event: any): void {
      event.preventDefault();
      (this.$refs.file as any).files = event.dataTransfer.files;      
      this.getFile();
      event.currentTarget.classList.remove("drop-over");
    },
    dragover(event: any): void {
      event.preventDefault();
      if (!event.currentTarget.classList.contains("drop-over")) {
        event.currentTarget.classList.add("drop-over");
      }
    },
    dragleave(event: any): void {
      event.currentTarget.classList.remove("drop-over");
    }
  }
});
</script>

<template>
  <div>
    <div id="file-modal"></div>
    <v-dialog
      v-model="dialog"
      :max-width="width"
      attach="#file-modal"
      overlay-opacity="0"
      persistent
    >
      <v-card :height="height" class="pa-16" elevation="0">
        <div class="close-button">
          <v-icon @click="closeDialog">mdi-close</v-icon>
        </div>
        <div
          :class="{ 'drop-over': loadingMessage }"
          class="drop-container"
          @click="pickFile"
          @dragleave="dragleave"
          @dragover="dragover"
          @drop="drop"
        >
          <span v-if="loadingMessage" class="drop-text">
            {{ loadingMessage }}
          </span>
          <span v-else class="drop-text">
            Drop {{ acceptAudio ? "audio or" : "" }} image file here
          </span>
        </div>
      </v-card>
    </v-dialog>
    <input v-show="false" ref="file" type="file" @change="getFile" />
  </div>
</template>

<style scoped>
#file-modal >>> .v-dialog {
  box-shadow: none;
}

.drop-container {
  border: 6px dashed #b6b6b6;
  border-radius: 4px;
  width: 100%;
  height: 100%;
  cursor: pointer;
  color: #898989;
}

.close-button {
  position: absolute;
  right: 10px;
  top: 10px;
}

.drop-text {
  position: absolute;
  width: 300px;
  top: 50%;
  right: calc(50% - 150px);
  text-align: center;
  font-weight: bold;
  font-size: 30px;
  line-height: 35px;
  transform: translateY(-50%);
}

.drop-over {
  color: #2196f3 !important;
  border: 6px dashed #2196f3 !important;
  animation: drop 1s linear infinite;
}

@keyframes drop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.03);
  }
  100% {
    transform: scale(1);
  }
}
</style>
