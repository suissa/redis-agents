export const ACTIVATION_CHANNEL = "chatbot_activation";

export const streamKeyForPhone = (phone: string) => `user:${phone}`;
export const flowKeyForPhone = (phone: string) => `flow:user:${phone}`;
