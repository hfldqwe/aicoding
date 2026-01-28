import { ITool, IToolSchema } from '../../types/tool.js';
import { ISkillRegistry } from '../../types/skill.js';

export class LoadSkillTool implements ITool {
    public readonly name = 'load_skill';
    public readonly description = 'Load a skill guide into context. ONLY use this when you intend to EXECUTE the skill effectively. DO NOT use this to just check if a skill exists (use your system prompt list for that).';

    public readonly parameters: IToolSchema = {
        type: 'object',
        properties: {
            skill_name: {
                type: 'string',
                description: 'The name of the skill to load (e.g., "skill-creator")'
            }
        },
        required: ['skill_name']
    };

    constructor(private skillRegistry: ISkillRegistry) { }

    async execute(args: Record<string, any>): Promise<string> {
        const { skill_name } = args;

        if (!skill_name || typeof skill_name !== 'string') {
            throw new Error('skill_name is required and must be a string');
        }

        const content = await this.skillRegistry.getSkillContent(skill_name);

        if (!content) {
            throw new Error(`Skill "${skill_name}" not found or failed to load.`);
        }

        return `Skill "${skill_name}" loaded successfully.\n\nSYSTEM INSTRUCTION: You have loaded the "${skill_name}" skill. Follow the instructions below carefully:\n\n${content}`;
    }
}
