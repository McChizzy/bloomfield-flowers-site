export function returnedPaymentState(result, expectedReference) {
  if (!result || typeof result !== 'object' || Array.isArray(result) ||
    typeof expectedReference !== 'string' || !expectedReference || result.transaction_ref !== expectedReference) {
    return 'unknown'
  }
  if (result.transaction_status === null || result.transaction_status === undefined || result.transaction_status === '') {
    return 'pending'
  }
  if (typeof result.transaction_status !== 'string') return 'unknown'
  const status = result.transaction_status.toLowerCase()
  return ['success', 'failed', 'fail', 'abandoned', 'pending'].includes(status) ? status : 'unknown'
}
