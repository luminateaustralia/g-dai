export type AiChatMessage = {
  role: "system" | "user" | "assistant" | "developer" | "tool";
  content: string | null;
  name?: string;
  tool_call_id?: string;
};

export type AiChatRequest = {
  messages: AiChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  max_completion_tokens?: number;
  top_p?: number;
  stop?: string | string[];
  response_format?: {
    type: "text" | "json_object" | "json_schema";
    json_schema?: {
      name: string;
      description?: string;
      schema?: Record<string, unknown>;
      strict?: boolean | null;
    };
  };
  tools?: Array<{
    type: "function";
    function: {
      name: string;
      description?: string;
      parameters?: Record<string, unknown>;
    };
  }>;
  tool_choice?:
    | "none"
    | "auto"
    | "required"
    | {
        type: "function";
        function: { name: string };
      };
  reasoning_effort?: "low" | "medium" | "high";
};
