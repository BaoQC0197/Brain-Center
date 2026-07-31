import { QAAgentType } from '../types'
import { buildAssembledPrompt, ProjectContext } from '../prompt-builder'

export async function buildQAAgentPrompt(
  agentType: QAAgentType,
  inputDocsText: string,
  userPromptText: string,
  projectContext: ProjectContext,
  systemInstruction?: string,
  additionalParams?: Record<string, string>
): Promise<{ systemPrompt: string; userPrompt: string }> {
  return buildAssembledPrompt({
    taskKey: agentType,
    projectContext,
    knowledgeBaseText: inputDocsText,
    userPromptText,
    projectInstructionOverride: systemInstruction,
    additionalParams,
  })
}
