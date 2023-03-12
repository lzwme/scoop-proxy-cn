import { mkdirp } from "@lzwme/fe-utils";
import { copyFileSync, readFileSync } from "node:fs";
import { resolve } from 'node:path';

/** 针对不同仓库的预处理 */
export const customHandler = {
  'ScoopInstaller/Main': {
    /** 该仓库是否拥有高优先级（不会被其他仓库同名应用替换） */
    highPriority: 1,
  },
  'xfqwdsj/BucketDev': {
    preSync: (repoDir) => {
      mkdirp(resolve(repoDir, 'scripts'));
      ['link.ps1', 'setup.ps1'].forEach(d => copyFileSync(resolve(repoDir, d), resolve(repoDir, `scripts/android-sdk-${d}`)));
    },
    fileSync: (filepath, ext) => {
      if ('.json' === ext) {
        return readFileSync(filepath, 'utf8')
          .replace(`\\\\link.ps1`, `\\\\scripts\\\\android-sdk-link.ps1`)
          .replace(`\\\\setup.ps1`, `\\\\scripts\\\\android-sdk-setup.ps1`);
      }
    },
  }
};
