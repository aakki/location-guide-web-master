import { BreadcrumbsItem } from "@/interfaces/Breadcrumbs";

export default {
  namespaced: true,
  state: {
    items:
      JSON.parse(localStorage.getItem("breadcrumbs") as string) ||
      ([] as Array<BreadcrumbsItem>),
    showSave: false
  },

  mutations: {
    push(state: any, payload: BreadcrumbsItem) {
      state.items.push(payload);
    },
    set(state: any, payload: Array<BreadcrumbsItem>) {
      state.items = payload;
    },
    showSave(state: any) {
      state.showSave = true;
    },
    hideSave(state: any) {
      state.showSave = false;
    },
    removeAfter(state: any, index: number) {
      state.items.splice(index, state.items.length - index);
    },
    splice(state: any, payload: { index: number; item: BreadcrumbsItem }) {
      state.items.splice(payload.index, 1, payload.item);
    },
    writeToLocalStorage(state: any) {
      localStorage.setItem("breadcrumbs", JSON.stringify(state.items));
    }
  },

  actions: {
    push({ commit }: any, payload: BreadcrumbsItem) {
      commit("push", payload);
      commit("writeToLocalStorage");
    },
    set({ commit }: any, payload: Array<BreadcrumbsItem>) {
      commit("set", payload);
      commit("writeToLocalStorage");
    },
    showSave({ commit }: any) {
      commit("showSave");
    },
    hideSave({ commit }: any) {
      commit("hideSave");
    },
    splice({ commit }: any, payload: { index: number; item: BreadcrumbsItem }) {
      commit("splice", payload);
      commit("writeToLocalStorage");
    },
    removeAfter({ commit }: any, index: number) {
      commit("removeAfter", index);
      commit("writeToLocalStorage");
    }
  },

  getters: {
    get: (state: any): Array<BreadcrumbsItem> => state.items,
    getSave: (state: any): boolean => state.showSave,
    length: (state: any): Array<BreadcrumbsItem> => state.items.length
  }
};
