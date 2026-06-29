import {Client as WorkflowClient} from '@upstash/workflow';
import {ARCJET_KEY, QSTASH_TOKEN, QSTASH_URL} from "./env.js";

export const workflowClient = new WorkflowClient({
    baseUrl: QSTASH_URL,
    token: QSTASH_TOKEN
});