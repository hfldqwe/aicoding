export interface ISkill {
    name: string;        // 来自 Frontmatter
    description: string; // 来自 Frontmatter
    path: string;        // 技能根目录绝对路径
}

export interface ISkillRegistry {
    /** 扫描并缓存所有技能元数据 */
    init(): Promise<void>;

    /** 获取所有可用技能列表 (用于 System Prompt) */
    getSkills(): ISkill[];

    /** 根据名称获取技能元数据 */
    getSkill(name: string): ISkill | undefined;

    /** 核心：读取并返回 SKILL.md 的完整正文内容 (去除 Frontmatter) */
    getSkillContent(name: string): Promise<string | undefined>;
}
