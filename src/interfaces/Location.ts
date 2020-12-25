import { Area } from "@/interfaces/Area";

export interface Location {
  areas: Array<Area>;
  audioFiles: Array<{
    createdAt: string;
    createdBy: number;
    fileType: string;
    locationUUID: string;
    sort: number;
    updatedAt: string;
    updatedBy: string;
    uuid: string;
  }>;
  bodyLocalized: string;
  createdAt: string;
  createdBy: number;
  deletedAt: string;
  guides: Array<number>;
  images: Array<{
    createdAt: string;
    createdBy: number;
    fileType: string;
    locationUUID: string;
    sort: number;
    updatedAt: string;
    updatedBy: string;
    uuid: string;
  }>;
  locked: boolean;
  mapIcon: string;
  published: boolean;
  sort: number;
  titleLocalized: string;
  updatedAt: string;
  updatedBy: number;
  uuid: string;
}
