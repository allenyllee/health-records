#!/usr/bin/env python3
"""Build a deterministic, allowlisted skills-only ZIP; no network or install."""
import argparse
import hashlib
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
FILES = ['plugin.json', '.codex-plugin/plugin.json', 'README.md', 'LICENSE', 'NOTICE.md',
         'scripts/build_plugin.py', 'tests/validate.py', 'tests/test_package.py', 'tests/behavior-cases.json']
SKILL_FILES = ['SKILL.md','LICENSE','agents/openai.yaml','scripts/health_records.py',
    'references/toolkit.md','references/provider-contract.md','references/record-format.md','references/write-safety.md',
    'assets/binding.schema.json','assets/record.schema.json','assets/dataset.schema.json','assets/request.schema.json',
    'assets/synthetic-binding.json','assets/synthetic-record.json','assets/synthetic-empty-dataset.json',
    'assets/synthetic-dataset.json','assets/synthetic-append.json','assets/synthetic-correction.json','assets/synthetic-delete.json']
FILES += ['skills/manage-health-records/'+name for name in SKILL_FILES]

def build(output):
    require = lambda ok: None if ok else (_ for _ in ()).throw(ValueError('missing or unsafe allowlisted package file'))
    for name in FILES:
        path=ROOT/name
        require(path.is_file() and not path.is_symlink() and path.resolve().is_relative_to(ROOT))
    with open(output, 'xb') as stream:
        with zipfile.ZipFile(stream,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
            for name in sorted(FILES):
                info=zipfile.ZipInfo(name,date_time=(2026,1,1,0,0,0))
                info.compress_type=zipfile.ZIP_DEFLATED
                info.create_system=3
                info.external_attr=0o100644 << 16
                archive.writestr(info,(ROOT/name).read_bytes())
    return hashlib.sha256(Path(output).read_bytes()).hexdigest()

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    print(build(args.output))
