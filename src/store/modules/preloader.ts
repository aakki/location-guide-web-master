export default {
  namespaced: true,
  state: {
    show: false as boolean
  },

  mutations: {
    show(state: any) {
      state.show = true;
    },
    hide(state: any) {
      state.show = false;
    }
  },

  actions: {
    show({ commit }: any) {
      commit("show");
    },
    hide({ commit }: any) {
      commit("hide");
    }
  },

  getters: {
    show: (state: any): boolean => state.show
  }
};
