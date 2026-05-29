import { getAi } from "@/lib/ai/client";
import { GPT_OSS_120B_MODEL } from "@/lib/ai/model";
import type { AiChatRequest } from "@/lib/ai/types";

type GptOss120bInput = AiModels["@cf/openai/gpt-oss-120b"]["inputs"];
type GptOss120bOutput = AiModels["@cf/openai/gpt-oss-120b"]["postProcessedOutputs"];

function toModelInput(request: AiChatRequest): GptOss120bInput {
  const { messages, stream, ...options } = request;

  return {
    messages,
    ...options,
    ...(stream ? { stream: true } : {}),
  } as GptOss120bInput;
}

export async function runGptOss120bChat(
  request: AiChatRequest
): Promise<GptOss120bOutput | ReadableStream> {
  const ai = await getAi();
  const input = toModelInput(request);

  if (request.stream) {
    return ai.run(GPT_OSS_120B_MODEL, input as GptOss120bInput & { stream: true });
  }

  return ai.run(GPT_OSS_120B_MODEL, input);
}
