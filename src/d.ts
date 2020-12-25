import Requests from "@/services/api/Requests";

declare module "vue/types/vue" {
  interface Vue {
    // @ts-ignore
    $http: Requests;
    $google: any;
    focus: () => {};
    sendChecks: () => {};
    checkExistBreadcrumbs: () => {};
    setData: () => {};
    0: {
      focus: () => {};
    };
  }

  interface Element {
    // @ts-ignore
    $http: Requests;
    sendChecks: () => {};
    focus: () => {};
  }
}
