import axios from "axios";

const openHIM = true;

interface Config {
    protocol: string;
    host: string;
    port: number;
    hostPath?: string;
    openHIMAPIhost: string;
    openHIMAPIport: string;
}

export const config = {
    isDev: process.env.NODE_ENV !== "production",
};

export async function initializeAPIClient(){
    try {
        const response = await fetch("/config/default.json");
        const config: Config = await response.json();
        let hostPath = config.hostPath || "";

        if (hostPath) {
            hostPath = "/" + hostPath.replace(/(^\/)|(\/$)/g, "");
        }

        const baseURL = `${config.protocol}://${config.openHIMAPIhost}:${config.openHIMAPIport}${hostPath}`;

        const client = axios.create({
            withCredentials: true,
            baseURL: baseURL,
        });

        return client;
    } catch (error) {
        console.error("Error initializing the API Client:", error);
        throw new Error("Failed to initialize API Client");
    }
}
