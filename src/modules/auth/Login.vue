<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "Login",

  data: () => ({
    isLoading: false as boolean,
    email: "" as string,
    code: "" as string,
    rules: {
      email: [
        (v: string): boolean | string => !!v || "E-mail field is required",
        (v: string): boolean | string =>
          /.+@.+\..+/.test(v) || "E-mail field must be valid"
      ],
      code: [(v: string): boolean | string => !!v || "Code field is required!"]
    },
    valid: true as boolean
  }),

  computed: {
    existEmail(): boolean {
      return !!this.$route.params.email;
    }
  },

  mounted(): void {
    if (this.$route.params.email) {
      this.email = this.$route.params.email;
    }
  },

  methods: {
    async signUp(): Promise<any> {
      const signUpForm: any = this.$refs.form;
      if (await signUpForm.validate()) {
        try {
          await this.$http.post("signup", { email: this.email });
          await this.$router.push(`login/${this.email}`);
        } catch (e) {
          await this.$store.dispatch("alerts/show", {
            text: e,
            color: "error"
          });
        }
      }
    },
    async login(): Promise<any> {
      this.isLoading = true;
      const signUpForm: any = this.$refs.form;
      if (await signUpForm.validate()) {
        try {
          this.isLoading = false;
          const response = await this.$http.post("login", {
            email: this.email,
            code: this.code
          });
          await this.$store.dispatch("auth/login", response.token);
          await (this.$parent.$parent.$refs.langSwitch as any).loadLocales();
          this.$router.push({ name: 'profile' });         
        } catch (e) {
          this.isLoading = false;
          await this.$store.dispatch("alerts/show", {
            text: 'Account not found',
            color: "error"
          });
        }
      }
    },
    handleEnterKeyUp(): void {
      if (this.existEmail) {
        this.login();
      } else {
        this.signUp();
      }
    }
  }
});
</script>

<template>
  <div>
    <v-form ref="form" v-model="valid" lazy-validation>
      <v-card class="login-container" flat width="325px">
        <v-card-title>
          <v-row class="text-center">
            <v-col class="pa-0 pb-5 text-h4 font-weight-bold">
              Log in
            </v-col>
          </v-row>
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="email"
            :rules="rules.email"
            class="login-input"
            dense
            outlined
            placeholder="Enter your email address"
            @keyup.enter="handleEnterKeyUp"
          />
          <div v-if="existEmail">
            <v-row class="text-center">
              <v-col class="text-center pt-5 pb-0" cols="12">
                We've just sent you a temporary login code.
              </v-col>
              <v-col class="text-center pb-5 pt-0 " cols="12">
                Please check your inbox.
              </v-col>
            </v-row>
            <v-text-field
              v-model="code"
              :rules="rules.code"
              class="login-input"
              dense
              outlined
              placeholder="Paste your login code"
              @keyup.enter="login"
            />
            <v-btn
              class="login-button mt-7 py-5"
              outlined
              width="100%"
              @click="login()"
            >
              Continue with login code
            </v-btn>
          </div>
          <v-btn
            v-else
            class="login-button mt-2 py-5 text-capitalize"
            outlined
            width="100%"
            @click="signUp()"
          >
            Continue
          </v-btn>
        </v-card-text>
      </v-card>
    </v-form>
  </div>
</template>

<style scoped>
.login-container {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.login-input {
  font-size: 18px;
}

.login-button {
  border: 1px solid #0f98b6 !important;
  background: #dff4f9;
  color: #0f98b6;
  font-size: 18px;
}

.login-input >>> .v-input__slot {
  min-height: 48px !important;
}
</style>
