"""Bounded offline schema and mutation behavior checks. No provider integration."""
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / 'skills/manage-health-records'
SPEC = importlib.util.spec_from_file_location('health_records', SKILL / 'scripts/health_records.py')
h = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(h)

def fixture(name):
    return h.load(SKILL / 'assets' / name)

class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.empty = fixture('synthetic-empty-dataset.json')
        self.append = fixture('synthetic-append.json')
        self.full = fixture('synthetic-dataset.json')
        self.correct = fixture('synthetic-correction.json')
        self.delete = fixture('synthetic-delete.json')

    def test_existing_record_and_binding_fixtures(self):
        for name in ('record', 'binding'):
            h.check(fixture('synthetic-'+name+'.json'),fixture(name+'.schema.json'))

    def test_package_has_no_provider_or_backend_wiring(self):
        for manifest in (ROOT/'plugin.json',ROOT/'.codex-plugin/plugin.json'):
            value=json.loads(manifest.read_text())
            self.assertNotIn('apps',value)
            self.assertNotIn('mcpServers',value)
            self.assertNotIn('hooks',value)
        for name in ('.app.json','.mcp.json','mcp.json','hooks/hooks.json'):
            self.assertFalse((ROOT/name).exists())

    def test_unknown_unit_suppresses_chart_and_delta(self):
        d=copy.deepcopy(self.full)
        for row in d['records']:row['unit']=None
        self.assertIsNone(h.summary(d)['groups'][0]['trends'][0]['delta'])
        self.assertNotIn('<svg',h.report(d))

    def test_receipt_history_corruption_rejected(self):
        for field,value in [('revision',3),('recordIds',['missing-id']),('requestHash','bad-hash')]:
            d=copy.deepcopy(self.full);d['operations'][0][field]=value
            with self.assertRaises(h.Invalid):h.validate(d)

    def test_append_atomic_and_deterministic(self):
        original=copy.deepcopy(self.empty)
        candidate,outcome=h.apply(self.empty,self.append,0)
        self.assertEqual(candidate,self.full)
        self.assertEqual(outcome,'applied')
        self.assertEqual(self.empty,original)
        self.assertEqual(candidate,h.apply(self.empty,self.append,0)[0])

    def test_retry_after_reopen_does_not_duplicate(self):
        reopened=json.loads(h.canonical(self.full))
        self.assertEqual(h.apply(reopened,self.append,0),(self.full,'already-applied'))
        self.assertEqual(h.apply(reopened,self.append,1)[0]['revision'],1)

    def test_operation_id_reuse_conflicts(self):
        self.append['records'][0]['value']=99
        with self.assertRaises(h.Invalid): h.apply(self.full,self.append,1)

    def test_new_operation_cannot_silently_duplicate_record(self):
        self.append['operationId']='synthetic-new-import'
        for row in self.append['records']: row['operationId']=self.append['operationId']
        with self.assertRaises(h.Invalid): h.apply(self.full,self.append,1)

    def test_stale_revision_has_no_side_effect(self):
        prior=copy.deepcopy(self.full)
        with self.assertRaises(h.Invalid): h.apply(self.full,self.correct,0)
        self.assertEqual(prior,self.full)

    def test_correction_preserves_identity_and_unrequested_fields(self):
        candidate,_=h.apply(self.full,self.correct,1)
        original=self.full['records'][0]
        changed=candidate['records'][0]
        for key in set(original)-{'operationId','value','rawValueText'}:
            self.assertEqual(original[key],changed[key])
        self.assertEqual(candidate['records'][1:],self.full['records'][1:])
        self.assertEqual(h.apply(candidate,self.correct,1),(candidate,'already-applied'))

    def test_retry_never_undoes_later_changes(self):
        candidate,_=h.apply(self.full,self.correct,1)
        self.assertEqual(h.apply(candidate,self.append,0),(candidate,'already-applied'))

    def test_illegal_correction_fields_and_mixed_actions(self):
        for field in ('recordId','status','providerRecordReference','synthetic'):
            request=copy.deepcopy(self.correct);request['patch']={field:'forbidden'}
            with self.assertRaises(h.Invalid):h.apply(self.full,request,1)
        self.correct['records']=self.append['records']
        with self.assertRaises(h.Invalid):h.apply(self.full,self.correct,1)

    def test_reversible_status_requires_instruction(self):
        bad=copy.deepcopy(self.delete);del bad['userInstruction']
        with self.assertRaises(h.Invalid):h.apply(self.full,bad,1)
        deleted,_=h.apply(self.full,self.delete,1)
        self.assertEqual(h.summary(deleted)['deletedCount'],1)
        self.assertEqual(h.summary(deleted)['groups'][0]['activeCount'],2)
        restore=dict(self.delete,operationId='synthetic-restore',status='active',deletedAt=None,userInstruction='Synthetic user requested restoration.')
        restored,_=h.apply(deleted,restore,2)
        self.assertEqual(restored['records'][0]['status'],'active')
        self.assertEqual(restored['records'][0]['value'],42)
        self.assertEqual(h.summary(restored)['deletedCount'],0)

    def test_tombstone_consistency_and_immutable_identity(self):
        for status,deleted_at in [('deleted',None),('active','2026-01-01T00:00:00Z')]:
            d=copy.deepcopy(self.full);d['records'][0].update(status=status,deletedAt=deleted_at)
            with self.assertRaises(h.Invalid):h.validate(d)

    def test_invalid_dataset_and_record_shapes(self):
        for field,value in [('schemaVersion',2),('revision',True),('revision',-1),('operations',[])]:
            d=copy.deepcopy(self.full);d[field]=value
            with self.assertRaises(h.Invalid):h.validate(d)
        d=copy.deepcopy(self.full);d['records'].append(copy.deepcopy(d['records'][0]))
        with self.assertRaises(h.Invalid):h.validate(d)
        d=copy.deepcopy(self.full);d['records'][0]['value']=float('nan')
        with self.assertRaises(h.Invalid):h.validate(d)

    def test_date_validation_unknown_and_real_calendar(self):
        for normalized in ('2026-02-30','2026-1-01'):
            d=copy.deepcopy(self.full);d['records'][0]['measurementTime']['normalized']=normalized
            with self.assertRaises(h.Invalid):h.validate(d)
        d=copy.deepcopy(self.full);d['records'][0]['measurementTime']['precision']='unknown'
        with self.assertRaises(h.Invalid):h.validate(d)

    def test_unknown_binding_observations_stay_null(self):
        self.empty['binding']['accountReference']=None
        self.empty['binding']['canonicalUrl']=None
        self.empty['binding']['consent']['approvedAt']=None
        self.empty['binding']['sharingObservation']=None
        self.assertEqual(h.validate(self.empty),self.empty)
        self.empty['binding']['accessToken']='forbidden'
        with self.assertRaises(h.Invalid):h.validate(self.empty)

    def test_summary_and_delta_use_canonical_values(self):
        summary=h.summary(self.full)
        group=summary['groups'][0]
        self.assertEqual((group['min'],group['max'],group['mean']),('42','45','43.33333333333333333333333333333333333333'))
        self.assertEqual(group['trends'][0]['delta'],'1')
        corrected,_=h.apply(self.full,self.correct,1)
        self.assertEqual(h.summary(corrected)['groups'][0]['trends'][0]['delta'],'-1')
        self.assertNotEqual(h.summary(corrected)['datasetHash'],summary['datasetHash'])

    def test_units_and_time_precisions_are_separate(self):
        d=copy.deepcopy(self.full)
        d['records'][0]['unit']='other unit'
        d['records'][1]['measurementTime'].update(precision='datetime',normalized='2026-01-02T00:00:00Z',timezone='UTC')
        summary=h.summary(d)
        self.assertEqual(len(summary['groups']),2)
        group=next(g for g in summary['groups'] if g['unit']=='demo units')
        self.assertEqual({t['precision'] for t in group['trends']},{'date','datetime'})

    def test_uncertain_time_and_missing_values_excluded(self):
        d=copy.deepcopy(self.full)
        d['records'][0]['measurementTime']['confirmed']=False
        d['records'][1]['value']=None
        group=h.summary(d)['groups'][0]
        self.assertEqual(len(group['trends'][0]['points']),1)
        self.assertIsNone(group['trends'][0]['delta'])
        self.assertEqual(group['excludedTrendCount'],2)
        self.assertNotIn('<polyline',h.report(d))

    def test_equal_instant_offsets_suppress_trend_delta(self):
        d=copy.deepcopy(self.full)
        for r,t in zip(d['records'],['2026-01-01T00:00:00Z','2026-01-01T01:00:00+01:00','2026-01-02T00:00:00Z']):
            r['measurementTime'].update(precision='datetime',normalized=t,timezone=None)
        self.assertIsNone(h.summary(d)['groups'][0]['trends'][0]['delta'])
        self.assertNotIn('<polyline',h.report(d))

    def test_report_escapes_untrusted_text_and_has_no_remote_assets(self):
        d=copy.deepcopy(self.full)
        d['records'][0]['metric']='<script>alert(1)</script>'
        report=h.report(d)
        self.assertNotIn('<script>',report)
        self.assertIn('&lt;script&gt;',report)
        self.assertNotIn('src=',report)
        self.assertIn('revision 1',report)
        self.assertEqual(report,h.report(d))

    def test_bad_append_batch_is_atomic(self):
        original=copy.deepcopy(self.empty)
        self.append['records'][-1]['operationId']='wrong'
        with self.assertRaises(h.Invalid):h.apply(self.empty,self.append,0)
        self.assertEqual(original,self.empty)

    def test_cli_exclusive_output_duplicate_keys_and_quiet_errors(self):
        script=SKILL/'scripts/health_records.py'
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'candidate.json'
            args=[sys.executable,str(script),'apply',str(SKILL/'assets/synthetic-empty-dataset.json'),str(SKILL/'assets/synthetic-append.json'),'--expected-revision','0','--output',str(path)]
            first=subprocess.run(args,capture_output=True,text=True)
            self.assertEqual(first.returncode,0,first.stderr)
            before=path.read_bytes()
            second=subprocess.run(args,capture_output=True,text=True)
            self.assertEqual(second.returncode,2)
            self.assertEqual(path.read_bytes(),before)
            path.write_text('{"private-value":1,"private-value":2}')
            failed=subprocess.run([sys.executable,str(script),'validate',str(path)],capture_output=True,text=True)
            self.assertEqual(failed.returncode,2)
            self.assertNotIn('private-value',failed.stderr)

if __name__=='__main__':unittest.main(verbosity=2)
