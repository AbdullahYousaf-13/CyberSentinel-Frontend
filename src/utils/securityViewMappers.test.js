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
    agent_name: 'prod-web-01',
    event_origin: '/var/log/auth.log',
    decoder_name: 'sshd',
    network: {
      srcip: '203.0.113.10',
      srcport: '51422',
      dstip: '10.0.0.5',
      dstport: '22'
    },
    message_normalized: 'SSH brute force attempt'
  });

  expect(row.eventId).toBe('1713607200.100');
  expect(row.agentName).toBe('prod-web-01');
  expect(row.eventOrigin).toBe('/var/log/auth.log');
  expect(row.decoderName).toBe('sshd');
  expect(row.network).toBe('203.0.113.10:51422 -> 10.0.0.5:22');
  expect(row.message).toBe('SSH brute force attempt');
});

test('mapAlertToDisplay keeps AI columns and raw context in details payload', () => {
  const alertRow = mapAlertToDisplay(
    {
      id: 'alert-1',
      created_at: '2026-04-20T12:00:00Z',
      alert_type: 'known_attack',
      classification: 'SSH_BRUTE',
      anomaly_score: 0.98123,
      model_version: 'rf-2026-04-20',
      severity: 'high'
    },
    {
      id: 'log-1',
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
      message_normalized: 'SSH brute force attempt'
    }
  );

  expect(alertRow.alertType).toBe('known_attack');
  expect(alertRow.classification).toBe('SSH_BRUTE');
  expect(alertRow.aiScore).toBe('0.9812');
  expect(alertRow.modelVersion).toBe('rf-2026-04-20');
  expect(alertRow.rawContext.eventId).toBe('1713614400.200');
  expect(alertRow.rawContext.network).toBe('203.0.113.50:51234 -> 10.0.0.5:22');
});
