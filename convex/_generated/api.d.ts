/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accessibility from "../accessibility.js";
import type * as advancedTicketing from "../advancedTicketing.js";
import type * as auth from "../auth.js";
import type * as bookings from "../bookings.js";
import type * as constants from "../constants.js";
import type * as crons from "../crons.js";
import type * as eventHelpers from "../eventHelpers.js";
import type * as eventTemplates from "../eventTemplates.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as migrations_initializeConfigs from "../migrations/initializeConfigs.js";
import type * as mobileApp from "../mobileApp.js";
import type * as organizers from "../organizers.js";
import type * as products from "../products.js";
import type * as promoCodes from "../promoCodes.js";
import type * as providers_ResendOTP from "../providers/ResendOTP.js";
import type * as providers_ResendPasswordReset from "../providers/ResendPasswordReset.js";
import type * as socialFeatures from "../socialFeatures.js";
import type * as storage from "../storage.js";
import type * as systemConfigs from "../systemConfigs.js";
import type * as users from "../users.js";
import type * as waitingList from "../waitingList.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  accessibility: typeof accessibility;
  advancedTicketing: typeof advancedTicketing;
  auth: typeof auth;
  bookings: typeof bookings;
  constants: typeof constants;
  crons: typeof crons;
  eventHelpers: typeof eventHelpers;
  eventTemplates: typeof eventTemplates;
  events: typeof events;
  http: typeof http;
  "migrations/initializeConfigs": typeof migrations_initializeConfigs;
  mobileApp: typeof mobileApp;
  organizers: typeof organizers;
  products: typeof products;
  promoCodes: typeof promoCodes;
  "providers/ResendOTP": typeof providers_ResendOTP;
  "providers/ResendPasswordReset": typeof providers_ResendPasswordReset;
  socialFeatures: typeof socialFeatures;
  storage: typeof storage;
  systemConfigs: typeof systemConfigs;
  users: typeof users;
  waitingList: typeof waitingList;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: {
    lib: {
      checkRateLimit: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
      getValue: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          key?: string;
          name: string;
          sampleShards?: number;
        },
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          shard: number;
          ts: number;
          value: number;
        }
      >;
      rateLimit: FunctionReference<
        "mutation",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      resetRateLimit: FunctionReference<
        "mutation",
        "internal",
        { key?: string; name: string },
        null
      >;
    };
    time: {
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
    };
  };
};
