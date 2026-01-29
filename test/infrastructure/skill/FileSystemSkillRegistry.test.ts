import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FileSystemSkillRegistry } from '../../../src/infrastructure/skill/FileSystemSkillRegistry.js';

// Mock os module
vi.mock('os', async (importOriginal) => {
    const mod = await importOriginal<typeof import('os')>();
    return {
        ...mod,
        homedir: vi.fn()
    };
});

describe('FileSystemSkillRegistry', () => {
    let registry: FileSystemSkillRegistry;
    let tempDir: string;
    let skillsDir: string;

    beforeEach(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aicoding-test-'));
        skillsDir = path.join(tempDir, '.aicoding', 'skills');
        await fs.mkdir(skillsDir, { recursive: true });

        // Mock homedir
        vi.mocked(os.homedir).mockReturnValue(path.join(tempDir, 'fake-home'));

        registry = new FileSystemSkillRegistry(tempDir);
    });

    afterEach(async () => {
        vi.clearAllMocks(); // Clear calls but keep mock implementation (or reset it in beforeEach)
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should ignore if skills directory does not exist', async () => {
        const emptyDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aicoding-empty-'));
        const reg = new FileSystemSkillRegistry(emptyDir);
        await reg.init();
        expect(reg.getSkills()).toHaveLength(0);
        await fs.rm(emptyDir, { recursive: true, force: true });
    });

    it('should scan skills from directory on init', async () => {
        const skillPath = path.join(skillsDir, 'test-skill');
        await fs.mkdir(skillPath);

        const skillContent = `---
name: test-skill
description: A test skill
---
# Test Skill
This is the content.`;

        await fs.writeFile(path.join(skillPath, 'SKILL.md'), skillContent);

        await registry.init();

        const skills = registry.getSkills();
        expect(skills).toHaveLength(1);
        expect(skills[0].name).toBe('test-skill');
        expect(skills[0].description).toBe('A test skill');
        expect(skills[0].path).toBe(skillPath);
    });

    it('should ignore skills without valid frontmatter', async () => {
        const skillPath = path.join(skillsDir, 'invalid-skill');
        await fs.mkdir(skillPath);

        await fs.writeFile(path.join(skillPath, 'SKILL.md'), '# Just content');

        await registry.init();

        expect(registry.getSkills()).toHaveLength(0);
    });

    it('should get skill content without frontmatter', async () => {
        const skillPath = path.join(skillsDir, 'content-skill');
        await fs.mkdir(skillPath);

        const skillContent = `---
name: content-skill
description: Content test
---

# Content
Real body.`;

        await fs.writeFile(path.join(skillPath, 'SKILL.md'), skillContent);

        await registry.init();
        const content = await registry.getSkillContent('content-skill');

        expect(content).toBe('# Content\nReal body.');
    });

    it('should return undefined for missing skill content', async () => {
        await registry.init();
        const content = await registry.getSkillContent('non-existent');
        expect(content).toBeUndefined();
    });
});
