const toDisplay = (value, fallback = 'N/A') => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const classifySourceApp = (eventOrigin, source) => {
  const probe = `${String(eventOrigin || '')} ${String(source || '')}`.toLowerCase();
  if (/(auth|sshd|login|secure)/i.test(probe)) return 'Authentication';
  if (/(kern|kernel|syslog|system)/i.test(probe)) return 'System';
  return 'General System';
};

const classifyChannel = (network, decoderName) => {
  const srcip = toDisplay(network?.srcip, '');
  const dstip = toDisplay(network?.dstip, '');
  if (srcip || dstip) return 'Network';

  const decoder = String(decoderName || '').trim().toLowerCase();
  if (decoder === 'sshd') return 'Login';
  if (decoder === 'syscheck') return 'File';
  if (decoder === 'kernel') return 'System';
  return 'General';
};

const normalizeAlertType = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'known_attack') return 'known_attack';
  if (raw === 'anomaly' || raw === 'unknown_attack') return 'anomaly';
  if (raw === 'benign') return 'benign';
  return 'anomaly';
};

export const formatAiScore = (score) => {
  if (typeof score !== 'number' || Number.isNaN(score)) return 'N/A';
  return score.toFixed(4);
};

export const formatNetworkTuple = (network) => {
  if (!network || typeof network !== 'object') return 'N/A';

  const srcip = toDisplay(network.srcip, '');
  const dstip = toDisplay(network.dstip, '');
  const srcport = toDisplay(network.srcport, '?');
  const dstport = toDisplay(network.dstport, '?');

  if (!srcip && !dstip) return 'N/A';
  return `${srcip || 'N/A'}:${srcport} -> ${dstip || 'N/A'}:${dstport}`;
};

export const mapAlertToDisplay = (alert, linkedLog) => {
  const context = alert?.log_context || linkedLog || {};
  const rawEventTime = context?.event_time || context?.timestamp;
  const rawContext = {
    eventId: context?.event_id || context?.id || 'N/A',
    eventTime: rawEventTime ? new Date(rawEventTime).toLocaleString() : 'N/A',
    agentName: context?.agent_name || 'N/A',
    eventOrigin: context?.event_origin || 'N/A',
    decoderName: context?.decoder_name || 'N/A',
    network: formatNetworkTuple(context?.network),
    message: context?.message_normalized || context?.message || 'N/A'
  };

  return {
    id: alert.id,
    detectedAt: new Date(alert.created_at).toLocaleString(),
    alertType: normalizeAlertType(alert.alert_type),
    classification: toDisplay(alert.classification),
    aiScore: formatAiScore(alert.anomaly_score),
    modelVersion: toDisplay(alert.model_version),
    severity: toDisplay(alert.severity, 'low').toLowerCase(),
    rawContext
  };
};

export const mapLogToDisplay = (log) => {
  const eventTime = log.event_time || log.timestamp;
  const messageFull = log.message_normalized || log.message || 'No message available.';
  const sourceApp = toDisplay(log.source_app, classifySourceApp(log.event_origin, log.source));
  const sourceIp = toDisplay(log.source_ip, toDisplay(log.network?.srcip));
  const destinationIp = toDisplay(log.destination_ip, toDisplay(log.network?.dstip));
  const channel = toDisplay(log.channel, classifyChannel(log.network, log.decoder_name));
  return {
    id: log.id,
    eventId: log.event_id || log.id,
    eventTime: eventTime ? new Date(eventTime).toLocaleString() : 'N/A',
    sourceApp,
    sourceIp,
    destinationIp,
    channel,
    message: messageFull,
    messageFull
  };
};
