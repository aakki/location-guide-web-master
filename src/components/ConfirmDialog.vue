<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "ConfirmDialog",

  props: {
    executeAction: {
      type: Function,
      required: true
    }
  },

  data: () => ({
    showed: false as boolean,
    action: "" as string,
    title: "" as string,
    text: "" as string,
    sheet: false as boolean,
    params: {} as any
  }),

  methods: {
    open(action: string, title: string, text: string, params: any): void {
      this.action = action;
      this.title = title;
      this.text = text;
      this.params = params;
      this.showed = true;
    },
    close(): void {
      this.showed = false;
    },
    confirm(): void {
      this.executeAction(this.action, this.params);
      this.close();
    },
    cancel(): void {
      this.close();
    }
  }
});
</script>

<template>
  <div>
    <v-dialog
      id="dialog"
      v-model="showed"
      :color="params ? params.color : ''"
      max-width="300"
      persistent
    >
      <v-card class="hidden-xs-only">
        <v-card-title class="headline">
          {{ title }}
        </v-card-title>
        <v-card-text>{{ text }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn id="close" color="blue darken-1" text @click="cancel()">
            Cancel
          </v-btn>
          <v-btn id="confirm" color="red darken-1" text @click="confirm()">
            Confirm
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <div class="text-center hidden-sm-and-up">
      <v-bottom-sheet v-model="showed" hide-overlay>
        <v-sheet class="text-center hidden-sm-and-up">
          <v-card>
            <v-card-title class="headline">
              {{ title }}
            </v-card-title>
            <v-card-text>{{ text }}</v-card-text>
            <v-card-actions class="justify-space-around">
              <v-btn color="red darken-1" text @click="confirm()">
                Confirm
              </v-btn>
              <v-btn color="blue darken-1" text @click="cancel()">
                Cancel
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-sheet>
      </v-bottom-sheet>
    </div>
  </div>
</template>

<style scoped></style>
