/**
 * Abstraction for file system operations within a scoped workspace.
 * Automatically handles .gitignore compliance and security boundaries.
 */
export interface IWorkspace {
    readonly rootPath: string;

    /**
     * Reads file content. Throws if file is outside workspace or ignored.
     */
    readFile(relativePath: string): Promise<string>;

    /**
     * Writes content to file. Creates directories if needed.
     */
    writeFile(relativePath: string, content: string): Promise<void>;

    /**
     * Lists files respecting .gitignore.
     */
    listFiles(pattern?: string): Promise<string[]>;

    /**
     * Checks if a path exists.
     */
    exists(relativePath: string): Promise<boolean>;

    /**
     * Creates a directory recursively.
     */
    mkdir(relativePath: string): Promise<void>;
}
