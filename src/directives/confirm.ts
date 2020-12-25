import Vue from "vue";
import Confirm from "@/components/ConfirmDialog.vue";

const ConfirmDialog = Vue.extend(Confirm);

export default {
  bind(el: any, binding: any, vnode: any) {
    el.style.cursor = "pointer";
    el.handleEvent = (event: any) => {
      event.stopPropagation();
      const propsData = {
        executeAction: binding.value.callback
      };
      const component: any = new ConfirmDialog({ propsData });
      const root: any = document.createElement("div");
      const app: any = document.getElementById("app");
      const oldRoot: any = (app as any).querySelector(
        "#custom-directive-modal"
      );

      root.setAttribute("id", "custom-directive-modal");
      component.$vuetify = vnode.context.$vuetify;
      component.$mount();
      root.appendChild(component.$el);

      if (oldRoot) {
        app.removeChild(oldRoot);
        app.appendChild(root);
      } else {
        app.appendChild(root);
      }
      component.open(1, binding.value.title, binding.value.message);
    };

    if (binding.arg) {
      el.addEventListener(binding.arg, el.handleEvent);
    } else {
      el.addEventListener("click", el.handleEvent);
    }
  },
  unbind() {
    const app: any = document.getElementById("app");
    const oldRoot: any = app.querySelector("#custom-directive-modal");
    if (oldRoot) {
      app.removeChild(oldRoot);
    }
  }
};
