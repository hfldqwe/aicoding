import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoadSkillTool } from '../../src/tools/skill/LoadSkillTool.js';
import { ISkillRegistry } from '../../src/types/skill.js';

describe('LoadSkillTool', () => {
    let tool: LoadSkillTool;
    let mockRegistry: ISkillRegistry;

    beforeEach(() => {
        mockRegistry = {
            init: vi.fn(),
            getSkills: vi.fn(),
            getSkill: vi.fn(),
            getSkillContent: vi.fn(),
        };
        tool = new LoadSkillTool(mockRegistry);
    });

    it('should load exist skill content', async () => {
        (mockRegistry.getSkillContent as any).mockResolvedValue('# Content');

        const result = await tool.execute({ skill_name: 'test-skill' });

        expect(mockRegistry.getSkillContent).toHaveBeenCalledWith('test-skill');
        expect(result).toBe('Skill "test-skill" loaded successfully.\n\nSYSTEM INSTRUCTION: You have loaded the "test-skill" skill. Follow the instructions below carefully:\n\n# Content');
    });

    it('should throw error if skill not found', async () => {
        (mockRegistry.getSkillContent as any).mockResolvedValue(undefined);

        await expect(tool.execute({ skill_name: 'unknown' }))
            .rejects.toThrow('Skill "unknown" not found');
    });
});
