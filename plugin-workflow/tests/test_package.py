"""Verify deterministic ZIP and standalone-skill execution in isolated extraction."""
import importlib.util
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zipfile

ROOT=Path(__file__).resolve().parents[1]
SPEC=importlib.util.spec_from_file_location('build_plugin', ROOT/'scripts/build_plugin.py')
b=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(b)

class PackageTests(unittest.TestCase):
    def test_zip_and_standalone_skill(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            first=root/'first.zip';second=root/'second.zip'
            self.assertEqual(b.build(first),b.build(second))
            self.assertEqual(first.read_bytes(),second.read_bytes())
            with self.assertRaises(FileExistsError):b.build(first)
            with zipfile.ZipFile(first) as archive:
                self.assertEqual(set(archive.namelist()),set(b.FILES))
                self.assertFalse(any('..' in Path(name).parts or name.startswith('/') for name in archive.namelist()))
                archive.extractall(root/'extract')
            extracted=root/'extract'
            run=subprocess.run([sys.executable,str(extracted/'tests/validate.py')],cwd=root,capture_output=True,text=True)
            self.assertEqual(run.returncode,0,run.stderr)
            # Copy only the skill out of the package; it must not read its parent.
            import shutil
            shutil.copytree(extracted/'skills/manage-health-records',root/'standalone')
            skill=root/'standalone'
            command=[sys.executable,str(skill/'scripts/health_records.py')]
            apply=subprocess.run(command+['apply',str(skill/'assets/synthetic-empty-dataset.json'),str(skill/'assets/synthetic-append.json'),'--expected-revision','0','--output',str(root/'candidate.json')],cwd=root,capture_output=True,text=True)
            self.assertEqual(apply.returncode,0,apply.stderr)
            report=subprocess.run(command+['report',str(root/'candidate.json'),'--output',str(root/'report.html')],cwd=root,capture_output=True,text=True)
            self.assertEqual(report.returncode,0,report.stderr)
            self.assertIn('<svg', (root/'report.html').read_text())
            self.assertTrue((skill/'LICENSE').is_file())
            rebuilt=root/'rebuilt.zip'
            build=subprocess.run([sys.executable,str(extracted/'scripts/build_plugin.py'),'--output',str(rebuilt)],cwd=root,capture_output=True,text=True)
            self.assertEqual(build.returncode,0,build.stderr)
            self.assertEqual(rebuilt.read_bytes(),first.read_bytes())

if __name__=='__main__':unittest.main(verbosity=2)
