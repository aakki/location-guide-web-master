import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const routes = [
  {
    path: "*",
    redirect: "/404"
  },
  {
    path: "/",
    redirect: "/profile"
  },
  {
    path: "/404",
    meta: {
      hideNav: true
    },
    component: () =>
      import(/* webpackChunkName: "views" */ "../modules/errors/404.vue")
  },
  {
    path: "/login/:email?",
    name: "login",
    meta: {
      hideNav: true
    },
    component: () =>
      import(/* webpackChunkName: "views" */ "../modules/auth/Login.vue")
  },
  {
    path: "/profile",
    name: "profile",
    component: () =>
      import(/* webpackChunkName: "views" */ "../modules/profile/Profile.vue")
  },
  {
    path: "/application/:company_id/:edit?/:application_id?",
    name: "application",
    component: () =>
      import(
        /* webpackChunkName: "views" */ "../modules/application/Application.vue"
      )
  },
  {
    path: "/guide/:application_id/:edit?/:guide_id?",
    name: "guide",
    component: () =>
      import(/* webpackChunkName: "views" */ "../modules/guide/Guide.vue")
  },
  {
    path: "/location/:guide_id/:edit?/:location_id?",
    name: "locations",
    component: () =>
      import(/* webpackChunkName: "views" */ "../modules/location/Location.vue")
  },
  {
    path: "/reload",
    name: "reload",
    component: () =>
      import(/* webpackChunkName: "unknown" */ "../modules/errors/unknown.vue")
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
