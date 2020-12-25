export default {
  namespaced: true,
  state: {
    show: false as boolean,
    message: {} as object
  },

  mutations: {
    show(state: any, payload: object) {
      state.message = payload;
      state.show = true;
    },
    hide(state: any) {
      state.show = false;
      state.message = {};
    }
  },

  actions: {
    show({ commit }: any, payload: object) {
      commit("show", payload);
    },
    hide({ commit }: any) {
      commit("hide");
    }
  },

  getters: {
    show: (state: any): boolean => state.show,
    message: (state: any): boolean => state.message
  }
};
