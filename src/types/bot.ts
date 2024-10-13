export enum BotReturnType {
    Raw = 'raw',
    StringArray = 'stringArray',
    Form = 'form',
    OneOf = 'oneOf',
    MoveAST = 'moveAST',
    ContractDefinition = 'contractDefinition'
}

/**
 * Represents the history of a conversation with the bot.
 */
export interface BotHistory {
    /**
     * The role of the participant in the conversation.
     */
    role: string;

    /**
     * The content of the participant's message.
     */
    content: string;
}

/**
 * Represents the configuration for a bot.
 */
export interface BotConfig {
    /**
     * The temperature parameter for generating responses.
     */
    temperature: number;

    /**
     * The frequency penalty parameter for generating responses.
     */
    frequencyPenalty: number;

    /**
     * The presence penalty parameter for generating responses.
     */
    presencePenalty: number;

    /**
     * The number of retries for generating responses.
     */
    retries: number;

    /**
     * The return type of the bot.
     */
    returnType: BotReturnType;

    /**
     * The system prompt for generating responses.
     */
    systemPrompt: string;

    /**
     * The models used by the bot.
     */
    models: string[];
}

export interface BotStreamResponse {
    /**
     * The message content.
     */
    content: string;
}