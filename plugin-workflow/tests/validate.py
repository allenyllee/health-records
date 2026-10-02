"""Offline source/schema checks, not provider integration tests."""
from pathlib import Path
import json
import unittest
from jsonschema import Draft202012Validator, FormatChecker
ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT/'skills/manage-health-records/assets'
def read(name):
    return json.loads((ASSETS/name).read_text())
RECORD = Draft202012Validator(read('record.schema.json'), format_checker=FormatChecker())
BINDING = Draft202012Validator(read('binding.schema.json'), format_checker=FormatChecker())
class SourceTests(unittest.TestCase):
    def test_schemas_well_formed(self):
        Draft202012Validator.check_schema(RECORD.schema)
        Draft202012Validator.check_schema(BINDING.schema)
    def test_synthetic_examples_valid(self):
        RECORD.validate(read('synthetic-record.json'))
        BINDING.validate(read('synthetic-binding.json'))
    def test_unknown_date_not_invented(self):
        value=read('synthetic-record.json')
        value['measurementTime']['normalized']='2026-03-04'
        self.assertFalse(RECORD.is_valid(value))
    def test_unknown_schema_version_rejected(self):
        value=read('synthetic-record.json'); value['schemaVersion']=2
        self.assertFalse(RECORD.is_valid(value))
    def test_deleted_record_needs_tombstone_time(self):
        value=read('synthetic-record.json'); value['status']='deleted'
        self.assertFalse(RECORD.is_valid(value))
        value['deletedAt']='2026-01-01T01:00:00Z'
        self.assertTrue(RECORD.is_valid(value))
    def test_active_record_rejects_tombstone_time(self):
        value=read('synthetic-record.json'); value['deletedAt']='2026-01-01T01:00:00Z'
        self.assertFalse(RECORD.is_valid(value))
    def test_blank_record_identity_rejected(self):
        value=read('synthetic-record.json'); value['recordId']=''
        self.assertFalse(RECORD.is_valid(value))
    def test_binding_requires_exact_target_and_consent(self):
        for field in ['canonicalDatasetReference','accountReference','consent']:
            value=read('synthetic-binding.json'); del value[field]
            self.assertFalse(BINDING.is_valid(value))
    def test_provider_is_not_vendor_locked(self):
        for provider in ['notion','google-drive','chatgpt-space','user-chosen-new-provider']:
            value=read('synthetic-binding.json'); value['provider']=provider
            self.assertTrue(BINDING.is_valid(value))
    def test_undeclared_credential_fields_rejected(self):
        value=read('synthetic-binding.json'); value['accessToken']='synthetic-forbidden-field'
        self.assertFalse(BINDING.is_valid(value))
    def test_no_remote_backend_configuration(self):
        manifest=json.loads((ROOT/'.codex-plugin/plugin.json').read_text())
        self.assertNotIn('apps',manifest);self.assertNotIn('mcpServers',manifest)
        for name in ['.app.json','.mcp.json','mcp.json']:
            self.assertFalse((ROOT/name).exists())
    def test_source_examples_are_synthetic(self):
        for name in ['synthetic-record.json','synthetic-binding.json']:
            self.assertIs(read(name)['synthetic'],True)
        self.assertIn('example.invalid',read('synthetic-binding.json')['canonicalUrl'])
if __name__=='__main__':unittest.main(verbosity=2)
