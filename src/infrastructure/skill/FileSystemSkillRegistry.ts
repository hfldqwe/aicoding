import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import matter from 'gray-matter';
import { ISkill, ISkillRegistry } from '../../types/skill.js';

export class FileSystemSkillRegistry implements ISkillRegistry {
    private skills: Map<string, ISkill> = new Map();
    private initialized = false;

    constructor(private rootDir: string = process.cwd()) { }

    async init(): Promise<void> {
        // Priority: Project > User > System
        // We load in reverse priority order so stricter scopes overwrite broader scopes.

        // 1. System Level (Placeholder for now, usually installation dir)
        // await this.loadFromDir('/etc/aicoding/skills');

        // 2. User Level (~/.aicoding/skills)
        const userSkillsDir = path.join(os.homedir(), '.aicoding', 'skills');
        await this.loadFromDir(userSkillsDir);

        // 3. Project Level (Workspace/.aicoding/skills)
        const projectSkillsDir = path.join(this.rootDir, '.aicoding', 'skills');
        await this.loadFromDir(projectSkillsDir);

        this.initialized = true;
    }

    private async loadFromDir(dir: string): Promise<void> {
        try {
            await fs.access(dir);
        } catch {
            return; // Directory doesn't exist, skip
        }

        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const skillPath = path.join(dir, entry.name);
                    const skillMdPath = path.join(skillPath, 'SKILL.md');

                    try {
                        const content = await fs.readFile(skillMdPath, 'utf-8');
                        const { data } = matter(content);

                        if (data.name && data.description) {
                            // Map.set will overwrite existing keys, achieving the override behavior
                            this.skills.set(data.name, {
                                name: data.name,
                                description: data.description,
                                path: skillPath,
                            });
                        } else {
                            console.warn(`[SkillRegistry] SKILL.md in ${entry.name} missing name or description. Skipping.`);
                        }
                    } catch (error) {
                        // Ignore if SKILL.md is missing or unreadable
                        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                            console.warn(`[SkillRegistry] Failed to load skill from ${entry.name}:`, error);
                        }
                    }
                }
            }
        } catch (error) {
            console.warn(`[SkillRegistry] Failed to scan directory ${dir}:`, error);
        }
    }

    getSkills(): ISkill[] {
        if (!this.initialized) {
            console.warn('[SkillRegistry] getSkills called before init()');
        }
        return Array.from(this.skills.values());
    }

    getSkill(name: string): ISkill | undefined {
        return this.skills.get(name);
    }

    async getSkillContent(name: string): Promise<string | undefined> {
        const skill = this.skills.get(name);
        if (!skill) return undefined;

        const skillMdPath = path.join(skill.path, 'SKILL.md');
        try {
            const content = await fs.readFile(skillMdPath, 'utf-8');
            const { content: body } = matter(content);
            return body.trim();
        } catch (error) {
            console.error(`[SkillRegistry] Failed to read content for skill ${name}:`, error);
            return undefined;
        }
    }
}
