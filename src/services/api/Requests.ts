import axios from "axios";
import store from "@/store/index";
import Interceptors from "@/services/api/Interceptors";

class Requests {
  private http: any;
  private store: any;

  constructor() {
    this.store = store;
    this.http = axios.create({
      baseURL: process.env.VUE_APP_API_SERVER_URL
    });

    Interceptors.request(this);
    Interceptors.response(this);
  }

  public async get(url: string, params: object = {}): Promise<any> {
    try {
      return (await this.http.get(url, params)).data;
    } catch (e) {
      throw e.data.error;
    }
  }

  public async delete(url: string): Promise<any> {
    try {
      return (await this.http.delete(url)).data;
    } catch (e) {
      throw e.data.error;
    }
  }

  public async post(url: string, data: object): Promise<any> {
    try {
      return (await this.http.post(url, data)).data;
    } catch (e) {
      throw e.data.error;
    }
  }

  public async put(url: string, data: object): Promise<any> {
    try {
      return (await this.http.put(url, data)).data;
    } catch (e) {
      throw e.data.error;
    }
  }
}

export default new Requests();
