# [US-003] Migrating Config Directory

## Goal
Migrate the configuration directory from `~/aicoding` to `~/.aicoding` to follow standard convention for hidden configuration directories.

## User Review Required
- [ ] Confirm that `~/aicoding` is the correct source to move from.
- [ ] Confirm `~/.aicoding` is the desired target.

## Proposed Changes

### Configuration
#### [MOVE] [Old Config Dir](file:///C:/Users/19410/aicoding) -> [New Config Dir](file:///C:/Users/19410/.aicoding)
- Rename the physical directory.

### Codebase
#### [MODIFY] [ConfigProvider.ts](file:///c:/Users/19410/Documents/Project/aicoding/src/infrastructure/config/ConfigProvider.ts)
- Update `CONFIG_DIR_NAME` constant from `'aicoding'` to `'.aicoding'`.

## Verification Plan
### Manual Verification
- [ ] Check file system to ensure `C:\Users\19410\.aicoding` exists and contains `aicoding.json`.
- [ ] Run the application (or a script) and verify it correctly loads the configuration from the new location.
