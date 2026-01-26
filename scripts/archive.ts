
import fs from 'fs/promises';
import path from 'path';
import { createInterface } from 'readline';

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (q: string): Promise<string> => new Promise(resolve => rl.question(q, resolve));

async function main() {
    console.log("📦 Ralph Archive Tool");
    console.log("=====================");

    const prdPath = path.resolve(process.cwd(), 'prd.json');

    try {
        await fs.access(prdPath);
    } catch {
        console.error("❌ Error: prd.json not found in root.");
        process.exit(1);
    }

    const prdContent = await fs.readFile(prdPath, 'utf-8');
    const prd = JSON.parse(prdContent);
    const featureName = prd.branchName.replace('ralph/', '');

    const today = new Date().toISOString().split('T')[0];
    const archiveName = `${today}-${featureName}`;
    const archiveDir = path.resolve(process.cwd(), '.ai/history', archiveName);

    console.log(`\n📂 Target: ${archiveDir}`);

    const confirm = await ask("Proceed? (y/n) ");
    if (confirm.toLowerCase() !== 'y') {
        console.log("Aborted.");
        process.exit(0);
    }

    // 1. Create directory
    await fs.mkdir(archiveDir, { recursive: true });

    // 2. Move prd.json
    await fs.rename(prdPath, path.join(archiveDir, 'prd.json'));
    console.log("✅ Moved prd.json");

    // 3. Move tasks/prd-*.md files
    const tasksDir = path.resolve(process.cwd(), 'tasks');
    const files = await fs.readdir(tasksDir);
    const prdFiles = files.filter(f => f.startsWith('prd-') && f.endsWith('.md') && f !== 'prd-readme.md' && f !== 'prd-readme-v2.md');

    for (const file of prdFiles) {
        await fs.rename(path.join(tasksDir, file), path.join(archiveDir, file));
        console.log(`✅ Moved tasks/${file}`);
    }

    console.log(`\n🎉 Archived successfully to .ai/history/${archiveName}`);
    rl.close();
}

main().catch(console.error);
