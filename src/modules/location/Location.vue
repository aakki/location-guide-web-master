<script lang="ts">
import Vue from "vue";
import EditDialog from "@/modules/location/components/Edit.vue";
import store from "@/store";
import { Area } from "@/interfaces/Area";
import { Location } from "@/interfaces/Location";
import draggable from "vuedraggable";
import Requests from "@/services/api/Requests";

interface EditedLocation {
  area: Area;
  location: Location;
}

interface OriginalLocations {
  [uuid: string]: Location;
}

export default Vue.extend({
  name: "Location",

  components: {
    EditDialog,
    draggable
  },

  data: () => ({
    dialog: {
      createMode: false as boolean,
      show: false as boolean,
      item: {} as EditedLocation
    },
    dragging: false as boolean,
    locations: [] as Array<Location>,
    originalLocations: {} as OriginalLocations,
    map: null as any,
    markers: [] as Array<{ markerCenter: any; circle: any }>
  }),

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
      const locations: Array<Location> =
        (await Requests.get(`location?guideUUID=${to.params.guide_id}`)).data ||
        [];
      next((vm: any) => {
        vm.checkExistBreadcrumbs();
        vm.setData(locations);
        vm.$nextTick(() => {
          vm.loadMap();
        });
      });
    } catch (e) {
      await store.dispatch("alerts/show", {
        text: e,
        color: "error"
      });
    }
  },

  methods: {
    async loadMap(): Promise<void> {
      this.map = new (await this.$google).maps.Map(this.$refs.map as any, {
        center: {
          lat: 0,
          lng: 0
        },
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
        zoom: 2
      });

      await this.setMarker();
      if (localStorage.getItem("editedLoc")) {
        const location = this.locations.find(
          item => item.uuid == localStorage.getItem("editedLoc")
        );
        location && this.editLocation(location);
      }
    },
    async setMarker(): Promise<void> {
      if (!this.map) {
        return;
      }

      for (const marker of this.markers) {
        marker.circle.setMap(null);
        marker.markerCenter.setMap(null);
      }

      this.markers = [];

      for (const [index, location] of this.locations.entries()) {
        const [area]: Array<Area> = location.areas;

        const center = {
          lat: Number(area.latitude),
          lng: Number(area.longitude)
        };

        const markerCenter = new (await this.$google).maps.Marker({
          position: center,
          title: location.titleLocalized,
          map: this.map,
          label: { text: (index + 1).toString(), color: "white" }
        });
        this.openGoogleMap(markerCenter, location);

        const circle = new (await this.$google).maps.Circle({
          map: this.map,
          clickable: true,
          radius: area.radius,
          fillColor: "#FF9C9C",
          fillOpacity: 0.6,
          strokeColor: "#E47B7B",
          strokeOpacity: 1,
          strokeWeight: 2
        });
        this.openGoogleMap(circle, location);
        this.markers.push({ markerCenter, circle });

        circle.bindTo("center", markerCenter, "position");
      }
      if (!this.locations.length) {
        return;
      }

      if (this.locations.length === 1) {
        const [marker]: any = this.markers;
        const zoom = this.getCurrentZoom(marker.circle.radius);
        this.map.setZoom(zoom);
        this.map.setCenter(marker.markerCenter.position);
      } else {
        await this.setMapViewBounds();
      }
    },
    async setMapViewBounds(): Promise<void> {
      const bounds = new (await this.$google).maps.LatLngBounds();

      for (const marker of this.markers) {
        bounds.extend(marker.markerCenter.position);
      }

      this.map.fitBounds(bounds, 35);
    },
    getCurrentZoom(radius: number): number {
      if (radius < 100) {
        return 15;
      }
      if (radius < 500) {
        return 12;
      }
      if (radius < 1000) {
        return 10;
      }
      if (radius < 5000) {
        return 9;
      }
      if (radius < 10000) {
        return 7;
      }
      if (radius < 50000) {
        return 6;
      }
      if (radius < 100000) {
        return 4;
      }
      return 2;
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
            to: `/application`,
            disabled: true
          },
          {
            text: "Guide",
            to: `/guide`,
            disabled: true
          },
          {
            text: "Location",
            to: `/location/${this.$route.params.guide_id}`,
            disabled: true
          }
        ]);
      } else {
        this.$store.dispatch("breadcrumbs/removeAfter", 4);
      }
    },
    async loadLocations() {
      try {
        const locations: Array<Location> =
          (
            await Requests.get(
              `location?guideUUID=${this.$route.params.guide_id}`
            )
          ).data || [];
        this.setData(locations);
        this.$nextTick(() => {
          this.setMarker();
        });
      } catch (e) {
        await this.$store.dispatch("alerts/show", {
          text: e,
          color: "error"
        });
      }
    },
    setData(locations: Array<Location>): void {
      if (!this.isDefaultLang) {
        this.loadDefaultLangLocations();
      }
      this.locations = locations.sort((a, b) => a.sort - b.sort);
    },
    async loadDefaultLangLocations(): Promise<void> {
      try {
        const locations: Array<Location> =
          (
            await this.$http.get(
              `location?guideUUID=${this.$route.params.guide_id}`,
              {
                headers: {
                  "Accept-Language": this.defaultLang
                }
              }
            )
          ).data || [];

        const originalLocations: OriginalLocations = {};

        for (const item of locations) {
          originalLocations[item.uuid] = item;
        }

        this.originalLocations = { ...originalLocations };
      } catch (e) {
        await this.$store.dispatch("alerts/show", {
          text: e,
          color: "error"
        });
      }
    },
    resetEditedItem(): void {
      this.dialog.item = {
        area: {
          longitude: 0,
          latitude: 0,
          radius: 15
        },
        location: {}
      } as EditedLocation;
    },
    openGoogleMap(googleMapPointer: any, location: any):  void {
      const that = this
      google.maps.event.addListener(googleMapPointer, 'click', function () {
          that.editLocation(location)
      });
    },
    createLocation(): void {
      this.resetEditedItem();
      if (this.map) {
        this.dialog.item.area.latitude = this.map.getCenter().lat();
        this.dialog.item.area.longitude = this.map.getCenter().lng();
      } else {
        this.dialog.item.area.latitude = 0;
        this.dialog.item.area.longitude = 0;
      }
      this.dialog.createMode = true;
      this.dialog.show = true;
    },
    editLocation(location: Location): void {
      const [area]: Array<Area> = location.areas;
      this.dialog.item = { area, location };
      this.dialog.createMode = false;
      this.dialog.show = true;
      localStorage.setItem("editedLoc", location.uuid);
    },
    deleteLocation(): void {
      this.deleteEditedLocation(this.dialog.item);
      this.resetEditedItem();
      this.dialog.createMode = false;
      this.dialog.show = false;
      localStorage.removeItem("editedLoc");
    },
    async saveNewLocation(model: EditedLocation): Promise<void> {
      const editedModel: EditedLocation = { ...model };

      editedModel.area.latitude = Number(model.area.latitude);
      editedModel.area.longitude = Number(model.area.longitude);

      try {
        const audioFiles = model.location.audioFiles || [];
        const images = model.location.images || [];

        const location: Location = await this.$http.post("location", {
          ...editedModel.location,
          locked: true,
          audioFiles: null,
          images: null,
          published: true,
          mapIcon: "string",
          sort: 0
        });

        await this.$http.post("area", {
          ...model.area,
          locationUUID: location.uuid,
          radius: Number(model.area.radius),
          sort: 0
        });

        await this.$http.post(
          `guide/${this.$route.params.guide_id}/location/${location.uuid}/join`,
          {
            guideID: this.$route.params.guide_id,
            locationID: location.uuid
          }
        );

        for (const audio of audioFiles) {
          const form = (audio as any).form;
          form.append("locationUUID", location.uuid);
          await this.$http.post("file", form);
        }

        for (const image of images) {
          const form = (image as any).form;
          form.append("locationUUID", location.uuid);
          await this.$http.post("file", form);
        }

        await this.$store.dispatch("alerts/show", {
          text: "Location saved successfully!",
          color: "success"
        });

        await this.loadLocations();
      } catch (e) {
        await this.$store.dispatch("alerts/show", {
          text: e,
          color: "error"
        });
      }
    },
    async saveEditedLocation(model: EditedLocation): Promise<void> {
      const editedModel: EditedLocation = { ...model };

      editedModel.area.latitude = Number(model.area.latitude);
      editedModel.area.longitude = Number(model.area.longitude);

      try {
        const location: Location = await this.$http.put(
          `location/${model.location.uuid}`,
          editedModel.location
        );

        await this.$http.put(`area/${model.area.uuid}`, {
          ...model.area,
          locationUUID: location.uuid,
          radius: Number(model.area.radius),
          sort: 0
        });

        await this.$store.dispatch("alerts/show", {
          text: "Location updated successfully!",
          color: "success"
        });

        await this.loadLocations();
      } catch (e) {
        await this.$store.dispatch("alerts/show", {
          text: e,
          color: "error"
        });
      }
    },
    async deleteEditedLocation(item: EditedLocation): Promise<void> {
      try {
        await this.$http.delete(`location/${item.location.uuid}`);

        await this.$http.delete(`area/${item.area.uuid}`);

        await this.$store.dispatch("alerts/show", {
          text: "Location deleted successfully!",
          color: "success"
        });

        await this.loadLocations();
      } catch (e) {
        await this.$store.dispatch("alerts/show", {
          text: e,
          color: "error"
        });
      }
      localStorage.removeItem("editedLoc");
    },
    async changeOrder(): Promise<void> {
      this.locations = this.locations.map((item, index) => ({
        ...item,
        sort: index
      }));

      try {
        for (const location of this.locations) {
          await this.$http.put(`location/${location.uuid}`, location);
        }
      } catch (e) {
        await this.$store.dispatch("alerts/show", {
          text: e,
          color: "error"
        });
      }
    },
    async closeDialog(model: EditedLocation, callback: Function): Promise<any> {
      if (this.dialog.createMode) {
        await this.saveNewLocation(model);
      } else {
        await this.saveEditedLocation(model);
      }
      if (callback) {
        callback();
      }
    },
    endDrag(): void {
      this.dragging = false;
      this.setMarker();
      this.changeOrder();
    }
  }
});
</script>

<template>
  <div class="location">
    <div class="location-left mt-5">
      <div class="mapouter">
        <div class="gmap_canvas">
          <div ref="map" style="height: 100%; width: 100%"></div>
        </div>
      </div>
    </div>
    <div class="location-right mt-5 pl-5">
      <span class="locations-header pl-4">
        Locations
      </span>
      <span class="list-button ml-2 mb-1 px-0" @click="createLocation()">
        add
      </span>
      <div class="d-flex justify-start">
        <draggable
          :list="locations"
          style="width: 100%;"
          class="locations-list text-left"
          ghost-class="ghost"
          handle=".handle"
          tag="ul"
          @end="endDrag"
          @start="dragging = true"
        >
          <v-list-item
            class="handle"
            @click="editLocation(item)"
            two-line
            v-for="(item, index) in locations"
            :key="index"
          >
            <v-list-item-content>
              <v-list-item-title
                style="max-width: 200px;"
                class="font-weight-bold d-inline-block text-truncate size-14"
              >
                <span> {{ index + 1 }}. </span>
                <span v-if="item.titleLocalized">
                  {{ item.titleLocalized }}
                </span>
                <span v-else class="caption grey--text">
                  No location title
                </span>
                <span
                  v-if="
                    originalLocations[item.uuid] &&
                      originalLocations[item.uuid].titleLocalized
                  "
                >
                  ({{ originalLocations[item.uuid].titleLocalized }})
                </span>
              </v-list-item-title>
              <v-list-item-subtitle
                class="d-inline-block text-truncate"
                style="max-width: 200px;"
                >{{ item.bodyLocalized }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </draggable>
      </div>
    </div>
    <edit-dialog
      v-if="dialog.show"
      v-model="dialog.show"
      :zoom="map.getZoom()"
      :create-mode="dialog.createMode"
      :item="dialog.item"
      @save="closeDialog"
      @delete="deleteLocation()"
    ></edit-dialog>
  </div>
</template>

<style scoped>
.location {
  display: grid;
  grid-template-columns: 73% 27%;
}

.locations-list li {
  display: grid;
  grid-template-columns: 35px auto;
  grid-template-rows: repeat(2, 1fr);
}

.locations-list li span:first-child {
  text-align: right;
}

.locations-list li span:last-child {
  max-width: 150px;
}

.locations-header {
  font-size: 18px;
  font-weight: 500;
}

.add-btn {
  min-width: inherit !important;
  font-size: 18px;
  font-weight: 500;
  color: #0f98b6 !important;
}

.location-title {
  font-size: 16px;
  font-weight: 500;
}

.location-subtitle {
  grid-area: 2/2/2/2;
}

.meta-data-button {
  font-size: 14px;
  font-weight: 400;
  min-width: inherit !important;
  height: inherit !important;
  text-transform: capitalize;
}

.mapouter {
  position: relative;
  text-align: right;
}

.gmap_canvas {
  overflow: hidden;
  background: none !important;
  height: 540px;
  border: 1px solid #929292;
  border-radius: 4px;
}

.v-input >>> .v-input__slot {
  min-height: 30px !important;
}

.ghost {
  opacity: 0;
}
</style>
