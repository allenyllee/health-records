#!/usr/bin/env python3
"""Offline candidate builder. No provider access, credentials, or clinical inference."""
import argparse
import copy
from datetime import date, datetime, timezone
from decimal import Decimal, localcontext
import hashlib
import html
import json
import math
from pathlib import Path
import re
import sys

ASSETS = Path(__file__).resolve().parents[1] / 'assets'


class Invalid(ValueError):
    pass


def require(ok, message):
    if not ok:
        raise Invalid(message)


def pairs(items):
    result = {}
    for key, value in items:
        require(key not in result, 'duplicate JSON key')
        result[key] = value
    return result


def load(path):
    with open(path, encoding='utf-8') as stream:
        return json.load(stream, object_pairs_hook=pairs,
                         parse_constant=lambda _: (_ for _ in ()).throw(Invalid('non-finite number')))


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False)


def digest(value):
    return hashlib.sha256(canonical(value).encode('utf-8')).hexdigest()


def timestamp(value):
    require(isinstance(value, str) and re.fullmatch(
        r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})', value),
        'date-time requires seconds and explicit offset')
    parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
    require(parsed.utcoffset() is not None, 'date-time offset required')
    return parsed.astimezone(timezone.utc)


def check(value, schema, path='$'):
    """Evaluate only the bundled schemas' JSON Schema subset; fail closed otherwise."""
    known = {'$schema', '$ref', 'title', 'description', 'type', 'const', 'enum', 'properties',
             'required', 'additionalProperties', 'items', 'minItems', 'uniqueItems',
             'minLength', 'minimum', 'pattern', 'format', 'allOf', 'if', 'then', 'else'}
    require(not set(schema) - known, 'unsupported schema keyword')
    if '$ref' in schema:
        ref = schema['$ref']
        require('/' not in ref and ref.endswith('.schema.json'), 'unsupported schema reference')
        check(value, load(ASSETS / ref), path)
    if 'type' in schema:
        types = schema['type'] if isinstance(schema['type'], list) else [schema['type']]
        matches = {'null': value is None, 'object': isinstance(value, dict),
                   'array': isinstance(value, list), 'string': isinstance(value, str),
                   'boolean': type(value) is bool, 'integer': type(value) is int,
                   'number': type(value) in (int, float)}
        require(any(matches.get(t, False) for t in types), path + ': invalid type')
    if type(value) in (int, float):
        require(math.isfinite(value), path + ': non-finite number')
    if 'const' in schema:
        require(type(value) is type(schema['const']) and value == schema['const'], path + ': invalid constant')
    if 'enum' in schema:
        require(value in schema['enum'], path + ': invalid enum')
    if isinstance(value, dict):
        require(set(schema.get('required', [])) <= set(value), path + ': missing fields')
        props = schema.get('properties', {})
        if schema.get('additionalProperties') is False:
            require(not set(value) - set(props), path + ': undeclared fields')
        for key in value.keys() & props.keys():
            check(value[key], props[key], path + '.' + key)
    if isinstance(value, list):
        require(len(value) >= schema.get('minItems', 0), path + ': too few items')
        if schema.get('uniqueItems'):
            require(len({canonical(v) for v in value}) == len(value), path + ': duplicate items')
        for item in value:
            check(item, schema.get('items', {}), path + '[]')
    if isinstance(value, str):
        require(len(value) >= schema.get('minLength', 0), path + ': empty string')
        if 'pattern' in schema:
            require(re.search(schema['pattern'], value), path + ': pattern mismatch')
        fmt = schema.get('format')
        try:
            if fmt == 'date':
                require(re.fullmatch(r'\d{4}-\d{2}-\d{2}', value), path + ': invalid date')
                date.fromisoformat(value)
            elif fmt == 'date-time':
                timestamp(value)
            elif fmt == 'uri':
                require(re.match(r'^[A-Za-z][A-Za-z0-9+.-]*:[^\s]+$', value), path + ': invalid URI')
            else:
                require(fmt is None, 'unsupported format')
        except ValueError:
            raise Invalid(path + ': invalid format') from None
    if 'minimum' in schema:
        require(value >= schema['minimum'], path + ': below minimum')
    for branch in schema.get('allOf', []):
        check(value, branch, path)
    if 'if' in schema:
        try:
            check(value, schema['if'], path)
            matched = True
        except Invalid:
            matched = False
        check(value, schema.get('then' if matched else 'else', {}), path)


def validate(data):
    check(data, load(ASSETS / 'dataset.schema.json'))
    ids = [r['recordId'] for r in data['records']]
    require(len(set(ids)) == len(ids), 'duplicate record ID')
    receipt_ids = [r['operationId'] for r in data['operations']]
    require(len(set(receipt_ids)) == len(receipt_ids), 'duplicate operation receipt')
    require(len(data['operations']) == data['revision'], 'revision/receipt history mismatch')
    for number, receipt in enumerate(data['operations'], 1):
        require(receipt['revision'] == number, 'receipt revisions must be contiguous')
        require(set(receipt['recordIds']) <= set(ids), 'receipt references missing record')
    if data['binding']['synthetic']:
        require(all(r['synthetic'] for r in data['records']), 'real records in synthetic binding')
    return data


def apply(data, request, expected_revision):
    validate(data)
    check(request, load(ASSETS / 'request.schema.json'))
    require(type(expected_revision) is int and expected_revision >= 0, 'invalid expected revision')
    fingerprint = digest(request)
    for receipt in data['operations']:
        if receipt['operationId'] == request['operationId']:
            require(receipt['requestHash'] == fingerprint, 'operation ID reused with different request')
            require(expected_revision in (receipt['revision'] - 1, data['revision']), 'retry revision conflict')
            return copy.deepcopy(data), 'already-applied'
    require(expected_revision == data['revision'], 'revision conflict; reread canonical dataset')
    candidate = copy.deepcopy(data)
    index = {r['recordId']: r for r in candidate['records']}
    action = request['action']
    affected = []
    if action == 'append':
        affected = [r['recordId'] for r in request['records']]
        require(len(set(affected)) == len(affected), 'duplicate IDs in append')
        require(not set(affected) & set(index), 'record ID exists; use original request receipt or correction')
        for record in request['records']:
            require(record['operationId'] == request['operationId'], 'append operation ID mismatch')
            require(record['status'] == 'active', 'append must be active')
        candidate['records'].extend(copy.deepcopy(request['records']))
    else:
        rid = request['recordId']
        require(rid in index, 'record ID not found')
        target = index[rid]
        affected = [rid]
        if action == 'correct':
            require(target['status'] == 'active', 'restore deleted record before correction')
            allowed = {'metric', 'value', 'rawValueText', 'unit', 'measurementTime', 'sourceReference'}
            require(bool(request['patch']) and set(request['patch']) <= allowed, 'invalid correction fields')
            target.update(copy.deepcopy(request['patch']))
        else:
            require(request['userInstruction'].strip(), 'status requires actual user instruction evidence')
            require(request['status'] != target['status'], 'status already set')
            target['status'] = request['status']
            target['deletedAt'] = request['deletedAt']
        target['operationId'] = request['operationId']
    candidate['revision'] += 1
    candidate['operations'].append({'operationId': request['operationId'], 'requestHash': fingerprint,
                                    'action': action, 'revision': candidate['revision'], 'recordIds': affected})
    validate(candidate)
    return candidate, 'applied'


def summary(data):
    validate(data)
    groups = {}
    deleted = 0
    for record in data['records']:
        if record['status'] == 'deleted':
            deleted += 1
            continue
        groups.setdefault((record['metric'], record['unit']), []).append(record)
    result = []
    with localcontext() as ctx:
        ctx.prec = 40
        for (metric, unit), records in sorted(groups.items(), key=lambda item: canonical(item[0])):
            values = sorted(Decimal(str(r['value'])) for r in records if r['value'] is not None)
            # Date-only and datetime series remain separate; unknown time/unit is never guessed.
            series = {}
            for r in records:
                t = r['measurementTime']
                if r['value'] is None or not t['confirmed'] or t['precision'] == 'unknown':
                    continue
                key = date.fromisoformat(t['normalized']).isoformat() if t['precision'] == 'date' else timestamp(t['normalized']).isoformat().replace('+00:00', 'Z')
                series.setdefault(t['precision'], []).append({'recordId': r['recordId'], 'time': key, 'value': r['value']})
            trends = []
            for precision, points in sorted(series.items()):
                points.sort(key=lambda p: (p['time'], p['recordId']))
                unique_times = len({p['time'] for p in points}) == len(points)
                delta = str(Decimal(str(points[-1]['value'])) - Decimal(str(points[0]['value']))) if len(points) > 1 and unique_times and unit is not None else None
                trends.append({'precision': precision, 'points': points, 'delta': delta,
                               'connectPoints': unique_times and len(points) == len(records)})
            result.append({'metric': metric, 'unit': unit, 'activeCount': len(records),
                           'numericCount': len(values), 'min': str(min(values)) if values else None,
                           'max': str(max(values)) if values else None,
                           'mean': str(sum(values) / len(values)) if values else None,
                           'excludedTrendCount': len(records) - sum(len(t['points']) for t in trends),
                           'trends': trends})
    return {'schemaVersion': 1, 'datasetId': data['datasetId'], 'revision': data['revision'],
            'datasetHash': digest(data), 'deletedCount': deleted, 'groups': result}


def report(data):
    info = summary(data)
    esc = lambda value: html.escape(str(value), quote=True)
    parts = ['<!doctype html><html lang="en"><meta charset="utf-8">',
             '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src \'none\'; base-uri \'none\'; form-action \'none\'">',
             '<meta name="viewport" content="width=device-width, initial-scale=1"><title>Health record summary</title>',
             '<style>body{font:16px system-ui;margin:2rem;max-width:70rem}table{border-collapse:collapse}td,th{padding:.5rem;border:1px solid #bbb}svg{max-width:100%;height:auto}circle{fill:#166534}polyline{stroke:#166534;fill:none}</style>',
             '<h1>Health record summary</h1>',
             '<p>Descriptive observations; no diagnosis, recommendations, unit conversion or prediction.</p>',
             f'<p>Dataset {esc(info["datasetId"])} · revision {info["revision"]} · {info["deletedCount"]} deleted excluded</p>',
             f'<p>Source SHA-256: {info["datasetHash"]}</p>']
    for group in info['groups']:
        label = group['metric'] + ' / ' + (group['unit'] if group['unit'] is not None else 'unknown unit')
        parts.append(f'<h2>{esc(label)}</h2><p>Active: {group["activeCount"]}; numeric: {group["numericCount"]}; excluded from trends: {group["excludedTrendCount"]}; min {esc(group["min"])}; max {esc(group["max"])}; mean {esc(group["mean"])}</p>')
        for trend in group['trends']:
            points = trend['points']
            parts.append(f'<h3>{esc(trend["precision"])} observations</h3><p>First-to-last delta: {esc(trend["delta"])}</p>')
            if len(points) <= 500 and group['unit'] is not None:
                # Decimal avoids overflow for large finite values; elapsed time is the x axis.
                xs = [Decimal(date.fromisoformat(p['time']).toordinal()) if trend['precision'] == 'date' else Decimal(str(timestamp(p['time']).timestamp())) for p in points]
                ys = [Decimal(str(p['value'])) for p in points]
                xmin, xmax, ymin, ymax = min(xs), max(xs), min(ys), max(ys)
                coords = [(float(40 + (x - xmin) / (xmax - xmin or 1) * 620), float(200 - (y - ymin) / (ymax - ymin or 1) * 160)) for x, y in zip(xs, ys)]
                parts.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 260" role="img" aria-label="{esc(label)}"><title>{esc(label)}</title>')
                if trend['connectPoints'] and len(xs) > 1:
                    parts.append('<polyline points="' + ' '.join(f'{x:.2f},{y:.2f}' for x, y in coords) + '"/>')
                for point, (x, y) in zip(points, coords):
                    parts.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r="4"><title>{esc(point["time"])}: {esc(point["value"])}</title></circle>')
                parts.append(f'<text x="40" y="230">{esc(points[0]["time"])}</text><text x="660" y="250" text-anchor="end">{esc(points[-1]["time"])}</text><text x="5" y="35">{esc(ymax)}</text><text x="5" y="215">{esc(ymin)}</text></svg>')
            parts.append('<table><tr><th>Record ID</th><th>Time</th><th>Value</th></tr>')
            for p in points:
                parts.append(f'<tr><td>{esc(p["recordId"])}</td><td>{esc(p["time"])}</td><td>{esc(p["value"])}</td></tr>')
            parts.append('</table>')
    parts.append('<p>Only confirmed dated numeric values enter trends. Date-only and offset timestamps are separate. Equal times suppress delta and connecting lines; unknown units suppress charts and delta. Charts above 500 points are omitted; tables remain complete.</p></html>')
    return '\n'.join(parts) + '\n'


def write_new(path, content):
    # Exclusive creation: cannot replace canonical input or any existing output.
    with open(path, 'x', encoding='utf-8') as stream:
        stream.write(content)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    for name in ('validate', 'apply', 'summary', 'report'):
        command = sub.add_parser(name)
        command.add_argument('dataset')
        if name == 'apply':
            command.add_argument('request')
            command.add_argument('--expected-revision', type=int, required=True)
        if name != 'validate':
            command.add_argument('--output', required=name in ('apply', 'report'))
    args = parser.parse_args(argv)
    try:
        data = validate(load(args.dataset))
        if args.command == 'validate':
            print(canonical({'valid': True, 'revision': data['revision'], 'datasetHash': digest(data)}))
        elif args.command == 'apply':
            candidate, outcome = apply(data, load(args.request), args.expected_revision)
            write_new(args.output, json.dumps(candidate, ensure_ascii=False, sort_keys=True, indent=2, allow_nan=False) + '\n')
            print(canonical({'outcome': outcome, 'revision': candidate['revision'], 'datasetHash': digest(candidate)}))
        else:
            content = report(data) if args.command == 'report' else json.dumps(summary(data), ensure_ascii=False, sort_keys=True, indent=2, allow_nan=False) + '\n'
            if args.output:
                write_new(args.output, content)
            else:
                print(content, end='')
        return 0
    except (Invalid, OSError, ValueError, OverflowError, RecursionError):
        # Never echo health data or local paths in exception output.
        print('Validation, revision, request, or output conflict. Inspect locally; no provider write occurred.', file=sys.stderr)
        return 2


if __name__ == '__main__':
    sys.exit(main())
