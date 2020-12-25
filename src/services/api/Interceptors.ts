import store from "@/store/index";
import router from "@/router/index";
import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

class Interceptors {
  static request(request: any) {
    request.http.interceptors.request.use(
      async (config: AxiosRequestConfig) => {
        const queryConfig: AxiosRequestConfig = config;
        const token: string = store.getters["auth/token"];
        const lang: string = store.getters["localization/lang"];

        store.dispatch("preloader/show");
        if (!queryConfig.headers.hasOwnProperty("Accept-Language")) {
          queryConfig.headers["Accept-Language"] = lang;
        }

        if (token) {
          queryConfig.headers.Authorization = `Bearer ${token}`;
        }
        return queryConfig;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );
  }

  static response(request: any) {
    request.http.interceptors.response.use(
      (response: AxiosResponse) => {
        store.dispatch("preloader/hide");
        return response;
      },
      async (error: AxiosError) => {
        await store.dispatch("preloader/hide");

        if (error?.response?.data.code === "INVALID_INPUT_PARAMS_ERROR") {
          await router.app.$router.push("404");
        }

        if (error?.response?.status == 401) {
          await store.dispatch("auth/logout");
          await router.app.$router.push("/login");
          return Promise.resolve();
        }
        return Promise.reject(error.response);
      }
    );
  }
}

export default Interceptors;
