import { HttpClient } from "../core/HttpClient";

export const createClient = (baseUrl: string) => {
    return new HttpClient(baseUrl);
};
