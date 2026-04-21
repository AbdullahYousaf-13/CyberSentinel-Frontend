const toDisplay = (value, fallback = 'N/A') => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
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
  return {
    id: log.id,
    eventId: log.event_id || log.id,
    eventTime: eventTime ? new Date(eventTime).toLocaleString() : 'N/A',
    agentName: toDisplay(log.agent_name),
    eventOrigin: toDisplay(log.event_origin),
    decoderName: toDisplay(log.decoder_name),
    network: formatNetworkTuple(log.network),
    message: log.message_normalized || log.message || 'No message available.'
  };
};
