import { Inngest } from "inngest";


//  Create a client to send an recieve events
export const inngest = new Inngest({
    id: "Wealthory",
    retryFunction: async(attempt) => ({
        delay: Math.pow(2 , attempt) * 1000, // Exponential backoff
        maxAttempts: 2, // Maximum number of retry attempts
    }),
});