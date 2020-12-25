export default {
  namespaced: true,
  state: {
    lang: localStorage.getItem("locale") as string,
    default: "" as string
  },

  mutations: {
    set(state: any, lang: string) {
      state.lang = lang;
    },
    setDefault(state: any, lang: string) {
      state.default = lang;
    }
  },

  actions: {
    set({ commit }: any, lang: string) {
      commit("set", lang);
      localStorage.setItem("locale", lang);
    },
    setDefault({ commit }: any, lang: string) {
      commit("setDefault", lang);
    }
  },

  getters: {
    lang: (state: any): string => state.lang,
    isDefault: (state: any): boolean => state.lang === state.default,
    default: (state: any): string => state.default
  }
};
