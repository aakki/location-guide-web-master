export default {
  namespaced: true,
  state: {
    token: localStorage.getItem("token") as string,
    hasAccessToken: localStorage.getItem("token") as string
  },

  mutations: {
    login(state: any, token: string) {
      state.token = token;
      console.log(token);
      state.hasAccessToken = true;
      localStorage.setItem("token", token);
    },
    logout(state: any) {
      state.token = "";
      state.hasAccessToken = false;
      localStorage.removeItem("token");
      localStorage.removeItem("locale");
    }
  },

  actions: {
    login({ commit }: any, payload: string) {
      commit("login", payload);
    },
    logout({ commit }: any) {
      commit("logout");
    }
  },

  getters: {
    hasAccessToken: (state: any): boolean => state.hasAccessToken,
    token: (state: any): string => state.token
  }
};
