const toDisplay = (value, fallback = 'N/A') => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const truncateText = (value, maxLength = 60) => {
  const text = String(value || '').trim();
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
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
  const rawEventTime = linkedLog?.event_time || linkedLog?.timestamp;
  const rawContext = {
    eventId: linkedLog?.event_id || linkedLog?.id || 'N/A',
    eventTime: rawEventTime ? new Date(rawEventTime).toLocaleString() : 'N/A',
    agentName: linkedLog?.agent_name || 'N/A',
    eventOrigin: linkedLog?.event_origin || 'N/A',
    decoderName: linkedLog?.decoder_name || 'N/A',
    network: formatNetworkTuple(linkedLog?.network),
    message: linkedLog?.message_normalized || linkedLog?.message || 'N/A'
  };

  return {
    id: alert.id,
    detectedAt: new Date(alert.created_at).toLocaleString(),
    alertType: toDisplay(alert.alert_type, 'unknown'),
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
    message: truncateText(messageFull, 60),
    messageFull
  };
};
