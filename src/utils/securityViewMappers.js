const toDisplay = (value, fallback = 'N/A') => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  if (!text || text === '__missing_ip__') return fallback;
  return text;
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
  const children = Array.isArray(alert?.children) ? alert.children : [];
  const latestChild = children.length ? children[children.length - 1] : null;
  const summary = latestChild?.metadata?.log_summary || alert?.metadata?.log_summary || {};
  const rawEventTime = summary?.event_time || linkedLog?.event_time || linkedLog?.timestamp;
  const summaryNetwork = summary?.network && typeof summary.network === 'object' ? summary.network : null;
  const latestModelVersion = latestChild?.model_version
    || (Array.isArray(alert?.model_versions_seen) ? alert.model_versions_seen[alert.model_versions_seen.length - 1] : null)
    || alert?.model_version
    || null;
  const latestAiScore = (typeof latestChild?.anomaly_score === 'number')
    ? latestChild.anomaly_score
    : alert?.anomaly_score;
  const rawContext = {
    eventId: summary?.event_id || linkedLog?.event_id || linkedLog?.id || 'N/A',
    eventTime: rawEventTime ? new Date(rawEventTime).toLocaleString() : 'N/A',
    agentName: summary?.agent_name || linkedLog?.agent_name || 'N/A',
    eventOrigin: summary?.event_origin || linkedLog?.event_origin || 'N/A',
    decoderName: summary?.decoder_name || linkedLog?.decoder_name || 'N/A',
    network: formatNetworkTuple(summaryNetwork || linkedLog?.network),
    message: summary?.message || linkedLog?.message_normalized || linkedLog?.message || 'N/A'
  };

  const severityRank = { low: 1, medium: 2, high: 3, critical: 4 };
  const rankSeverity = ['low', 'low', 'medium', 'high', 'critical'];
  const childSeverityRanks = children
    .map((item) => {
      const childSeverity = severityRank[String(item?.severity || '').toLowerCase()];
      if (childSeverity) return childSeverity;
      return severityRank[String(alert?.severity || '').toLowerCase()] || 1;
    });
  const averageSeverityRank = childSeverityRanks.length
    ? (childSeverityRanks.reduce((sum, value) => sum + value, 0) / childSeverityRanks.length)
    : (severityRank[String(alert?.severity || '').toLowerCase()] || 1);
  const roundedAverageSeverityRank = Math.max(1, Math.min(4, Math.round(averageSeverityRank)));

  const resolvedSource = toDisplay(
    alert.source_ip,
    toDisplay(
      summary?.source_ip,
      toDisplay(summary?.agent_name, toDisplay(summary?.event_origin))
    )
  );
  const resolvedDestination = toDisplay(
    alert.destination_ip,
    toDisplay(
      summary?.destination_ip,
      toDisplay(summary?.decoder_name, toDisplay(summary?.agent_name))
    )
  );

  return {
    id: alert.id,
    incidentId: alert.incident_id || alert.id,
    detectedAt: new Date(alert.opened_at || alert.created_at).toLocaleString(),
    lastSeenAt: new Date(alert.last_seen_at || alert.created_at).toLocaleString(),
    eventCount: Number(alert.event_count || 0),
    sourceIp: resolvedSource,
    destinationIp: resolvedDestination,
    status: toDisplay(alert.status, 'open'),
    alertType: normalizeAlertType(alert.alert_type),
    classification: toDisplay(alert.classification),
    aiScore: formatAiScore(latestAiScore),
    modelVersion: toDisplay(latestModelVersion),
    severity: rankSeverity[roundedAverageSeverityRank] || 'low',
    children: children.map((item) => ({
      logId: toDisplay(item?.log_id),
      eventTime: item?.event_time ? new Date(item.event_time).toLocaleString() : 'N/A',
      severity: toDisplay(item?.severity, 'low'),
      modelVersion: toDisplay(item?.model_version),
      aiScore: formatAiScore(item?.anomaly_score),
      message: toDisplay(item?.metadata?.log_summary?.message)
    })),
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
