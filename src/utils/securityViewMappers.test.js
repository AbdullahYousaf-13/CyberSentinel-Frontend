import { formatNetworkTuple, mapAlertToDisplay, mapLogToDisplay } from './securityViewMappers';

test('formatNetworkTuple returns N/A when network fields are missing', () => {
  expect(formatNetworkTuple(null)).toBe('N/A');
  expect(formatNetworkTuple({})).toBe('N/A');
});

test('mapLogToDisplay uses normalized archive fields', () => {
  const row = mapLogToDisplay({
    id: 'db-log-id',
    event_id: '1713607200.100',
    event_time: '2026-04-20T10:00:00Z',
    source_app: 'Authentication',
    source_ip: '203.0.113.10',
    destination_ip: '10.0.0.5',
    channel: 'Network',
    message_normalized: 'SSH brute force attempt'
  });

  expect(row.eventId).toBe('1713607200.100');
  expect(row.sourceApp).toBe('Authentication');
  expect(row.sourceIp).toBe('203.0.113.10');
  expect(row.destinationIp).toBe('10.0.0.5');
  expect(row.channel).toBe('Network');
  expect(row.message).toBe('SSH brute force attempt');
});

test('mapLogToDisplay derives new fields from legacy context when missing', () => {
  const row = mapLogToDisplay({
    id: 'db-log-id-2',
    event_id: '1713607200.101',
    event_time: '2026-04-20T10:00:00Z',
    source: 'wazuh-manager',
    event_origin: '/var/log/auth.log',
    decoder_name: 'sshd',
    network: {
      srcip: '203.0.113.10',
      dstip: '10.0.0.5'
    },
    message_normalized: 'A'.repeat(80)
  });

  expect(row.sourceApp).toBe('Authentication');
  expect(row.sourceIp).toBe('203.0.113.10');
  expect(row.destinationIp).toBe('10.0.0.5');
  expect(row.channel).toBe('Network');
  expect(row.message.length).toBe(80);
  expect(row.message.endsWith('...')).toBe(false);
  expect(row.messageFull).toBe('A'.repeat(80));
});

test('mapAlertToDisplay keeps AI columns and raw context in details payload', () => {
  const alertRow = mapAlertToDisplay(
    {
      id: 'alert-1',
      incident_id: 'alert-1',
      created_at: '2026-04-20T12:00:00Z',
      opened_at: '2026-04-20T12:00:00Z',
      last_seen_at: '2026-04-20T12:05:00Z',
      event_count: 1,
      source_ip: '203.0.113.50',
      destination_ip: '10.0.0.5',
      alert_type: 'known_attack',
      classification: 'SSH_BRUTE',
      model_versions_seen: ['rf-2026-04-20'],
      severity: 'high',
      children: [
        {
          log_id: 'log-1',
          event_time: '2026-04-20T11:59:59Z',
          anomaly_score: 0.98123,
          model_version: 'rf-2026-04-20',
          metadata: {
            log_summary: {
              event_id: '1713614400.200',
              event_time: '2026-04-20T11:59:59Z',
              agent_name: 'prod-web-01',
              event_origin: '/var/log/auth.log',
              decoder_name: 'sshd',
              network: {
                srcip: '203.0.113.50',
                srcport: '51234',
                dstip: '10.0.0.5',
                dstport: '22'
              },
              message: 'SSH brute force attempt'
            }
          }
        }
      ]
    },
    null
  );

  expect(alertRow.alertType).toBe('known_attack');
  expect(alertRow.classification).toBe('SSH_BRUTE');
  expect(alertRow.aiScore).toBe('0.9812');
  expect(alertRow.modelVersion).toBe('rf-2026-04-20');
  expect(alertRow.rawContext.eventId).toBe('1713614400.200');
  expect(alertRow.rawContext.network).toBe('203.0.113.50:51234 -> 10.0.0.5:22');
});

test('mapAlertToDisplay keeps classification as N/A when model label is missing', () => {
  const anomalyRow = mapAlertToDisplay(
    {
      id: 'alert-2',
      incident_id: 'alert-2',
      created_at: '2026-04-20T13:00:00Z',
      opened_at: '2026-04-20T13:00:00Z',
      last_seen_at: '2026-04-20T13:00:00Z',
      event_count: 1,
      source_ip: '__missing_ip__',
      destination_ip: '__missing_ip__',
      alert_type: 'anomaly',
      classification: null,
      model_versions_seen: ['cloud-api'],
      severity: 'medium',
      children: [
        {
          log_id: 'log-2',
          event_time: '2026-04-20T13:00:00Z',
          anomaly_score: 0.7,
          model_version: 'cloud-api',
          metadata: {}
        }
      ]
    },
    null
  );

  expect(anomalyRow.classification).toBe('N/A');
  expect(anomalyRow.sourceIp).toBe('N/A');
  expect(anomalyRow.destinationIp).toBe('N/A');
});

test('mapAlertToDisplay uses parent alert severity instead of averaging child severities', () => {
  const highIncident = mapAlertToDisplay(
    {
      id: 'alert-high',
      incident_id: 'alert-high',
      created_at: '2026-04-20T13:00:00Z',
      opened_at: '2026-04-20T13:00:00Z',
      last_seen_at: '2026-04-20T13:10:00Z',
      event_count: 3,
      alert_type: 'known_attack',
      classification: 'SSH_BRUTE',
      severity: 'high',
      children: [
        { log_id: 'log-1', severity: 'high', anomaly_score: 0.91, metadata: {} },
        { log_id: 'log-2', severity: 'low', anomaly_score: 0.66, metadata: {} },
        { log_id: 'log-3', severity: 'low', anomaly_score: 0.64, metadata: {} }
      ]
    },
    null
  );
  const mediumIncident = mapAlertToDisplay(
    {
      id: 'alert-medium',
      incident_id: 'alert-medium',
      created_at: '2026-04-20T14:00:00Z',
      opened_at: '2026-04-20T14:00:00Z',
      last_seen_at: '2026-04-20T14:05:00Z',
      event_count: 2,
      alert_type: 'anomaly',
      classification: null,
      severity: 'medium',
      children: [
        { log_id: 'log-4', severity: 'medium', anomaly_score: 0.73, metadata: {} },
        { log_id: 'log-5', severity: 'low', anomaly_score: 0.66, metadata: {} }
      ]
    },
    null
  );

  expect(highIncident.severity).toBe('high');
  expect(mediumIncident.severity).toBe('medium');
  expect(highIncident.children[1].severity).toBe('low');
});

test('mapAlertToDisplay falls back to legacy root anomaly_score and model_version', () => {
  const row = mapAlertToDisplay(
    {
      id: 'legacy-1',
      incident_id: 'legacy-1',
      created_at: '2026-04-20T13:00:00Z',
      opened_at: '2026-04-20T13:00:00Z',
      last_seen_at: '2026-04-20T13:00:00Z',
      event_count: 1,
      source_ip: null,
      destination_ip: null,
      alert_type: 'known_attack',
      classification: 'OTHER_ATTACK',
      model_version: '20260510144302',
      anomaly_score: 1.0,
      metadata: {
        log_summary: {
          source_ip: '203.0.113.10',
          destination_ip: '10.0.0.5'
        }
      }
    },
    null
  );

  expect(row.aiScore).toBe('1.0000');
  expect(row.modelVersion).toBe('20260510144302');
  expect(row.sourceIp).toBe('203.0.113.10');
  expect(row.destinationIp).toBe('10.0.0.5');
});
