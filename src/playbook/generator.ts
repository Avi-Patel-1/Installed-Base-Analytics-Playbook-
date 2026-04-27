import type { Account, Playbook, Recommendation, ScoredAccount } from '../types'
import { formatCurrency } from '../utils/format'

export function generatePlaybook(scored: ScoredAccount): Playbook {
  const { account, recommendations } = scored
  const primary = recommendations[0]
  const questions = buildQuestions(account, scored, recommendations)
  const sections = [
    section(
      'Executive Summary',
      `${account.accountName} should be approached with a ${scored.recommendedOpportunityType.toLowerCase()} conversation. The account shows ${scored.lifecycleRisk.label.toLowerCase()} lifecycle risk, ${scored.modernizationFit.label.toLowerCase()} modernization fit, and ${formatCurrency(account.estimatedAnnualDowntimeCost)} in estimated annual downtime exposure. The recommended next step is to ${scored.nextBestAction.toLowerCase()}.`,
    ),
    section(
      'Account Snapshot',
      `${account.plantType} site in the ${account.region} region serving the ${account.industrySegment} segment. The installed base includes ${account.productionLines} production lines, ${account.installedPlcFamily} controls, ${account.installedHmiScadaSystem}, ${account.driveMotorCount} drives and motors, and approximately ${account.sensorCount} sensors. Current confidence is ${account.installedBaseConfidence.toLowerCase()} with ${account.dataAvailability.toLowerCase()} data availability.`,
    ),
    section(
      'Likely Pain Points',
      account.downtimePainPoints
        .map((point) => `- ${point}`)
        .join('\n') + `\n- ${account.urgencyNotes}`,
    ),
    section(
      'Installed-Base Assumptions',
      `The current recommendation assumes that ${account.assetLifecycleStage.toLowerCase()} lifecycle status and ${account.supportRisk.toLowerCase()} support risk are visible to operations leadership. It also assumes the ${account.likelyBuyingTrigger.toLowerCase()} trigger is still active and that the customer can share enough asset and downtime evidence to shape scope.`,
    ),
    section(
      'Evidence Behind Recommendation',
      recommendations.length > 0
        ? recommendations
            .slice(0, 4)
            .map((recommendation) => `- ${recommendation.title}: ${recommendation.rationale}`)
            .join('\n')
        : `The scorecard points toward a discovery discussion because current evidence is incomplete, but the account still has enough value signal to justify targeted questions.`,
    ),
    section('Discovery Questions', questions.map((question) => `- ${question}`).join('\n')),
    section(
      'Recommended Workshop Agenda',
      [
        '1. Confirm business trigger, outage windows, and decision process.',
        '2. Review installed equipment by line, including controllers, HMI/SCADA, drives, safety, and sensors.',
        '3. Walk through recent downtime events and identify the evidence behind each pain point.',
        '4. Prioritize one or two opportunity areas by value, risk reduction, and implementation effort.',
        '5. Agree on data, access, and stakeholders needed for the next deliverable.',
      ].join('\n'),
    ),
    section(
      'Proposed Solution Architecture',
      solutionArchitecture(account, primary),
    ),
    section(
      'Value Hypothesis',
      `If the customer can reduce the top downtime modes by 10-15%, the annual value range is approximately ${formatCurrency(account.estimatedAnnualDowntimeCost * 0.1)} to ${formatCurrency(account.estimatedAnnualDowntimeCost * 0.15)} before considering safety, quality, and maintenance labor benefits. The practical first milestone should be proof that the selected scope can reduce response time or eliminate a repeat failure mode.`,
    ),
    section(
      'Data Needed From Customer',
      unique([
        'Asset list by production line',
        'Recent downtime events with timestamps and duration',
        'Current control network overview',
        'Maintenance work orders for the targeted asset class',
        ...recommendations.flatMap((recommendation) => recommendation.evidenceToCollect),
      ])
        .slice(0, 10)
        .map((item) => `- ${item}`)
        .join('\n'),
    ),
    section(
      'Potential Objections',
      [
        `- Existing supplier coverage: ${account.competitorPresence}.`,
        '- Concern that modernization will disrupt production schedules.',
        '- Unclear ownership for downtime data or asset inventory.',
        '- Budget approval may require a more explicit risk or payback model.',
      ].join('\n'),
    ),
    section(
      'Risk Mitigation Points',
      [
        '- Start with one production area or asset class before expanding scope.',
        '- Separate discovery, design, and implementation decisions.',
        '- Use the customer downtime examples as the basis for value estimates.',
        '- Preserve current operations standards unless evidence supports changing them.',
      ].join('\n'),
    ),
    section(
      'Follow-Up Actions',
      [
        `- Confirm owner for ${account.likelyBuyingTrigger.toLowerCase()}.`,
        `- Request installed-base evidence tied to ${account.downtimePainPoints[0].toLowerCase()}.`,
        '- Schedule a 60-90 minute technical discovery session.',
        '- Prepare a one-page scope option for the highest-confidence opportunity.',
      ].join('\n'),
    ),
    section(
      'Proposal Outline',
      [
        '1. Business context and reliability objective.',
        '2. Installed-base findings and evidence gaps.',
        '3. Recommended solution category and phased scope.',
        '4. Assumptions, data needs, and customer responsibilities.',
        '5. Expected operational value and success measures.',
        '6. Timeline, outage requirements, and next decision point.',
      ].join('\n'),
    ),
  ]

  return {
    accountId: account.accountId,
    accountName: account.accountName,
    generatedOn: new Date().toISOString().slice(0, 10),
    sections,
    questions,
  }
}

function buildQuestions(account: Account, scored: ScoredAccount, recommendations: Recommendation[]) {
  const base = [
    `Which production line or asset class is most affected by ${account.downtimePainPoints[0].toLowerCase()}?`,
    `How is ${formatCurrency(account.estimatedAnnualDowntimeCost)} in downtime exposure currently estimated?`,
    `What makes ${account.likelyBuyingTrigger.toLowerCase()} urgent enough to act now?`,
    'Which stakeholders must agree on scope, outage timing, and success measures?',
    `What evidence would make a ${scored.recommendedOpportunityType.toLowerCase()} recommendation credible internally?`,
  ]

  const recommendationQuestions = recommendations.slice(0, 3).flatMap((recommendation) => [
    `What current evidence supports the ${recommendation.title.toLowerCase()} finding?`,
    `Which item from "${recommendation.evidenceToCollect[0]}" is easiest to validate this week?`,
  ])

  return unique([...base, ...recommendationQuestions]).slice(0, 11)
}

function solutionArchitecture(account: Account, primary?: Recommendation) {
  const focus = primary?.opportunityType || 'Assessment workshop'

  if (focus === 'Analytics and edge monitoring') {
    return `Start with read-only data collection from ${account.installedHmiScadaSystem}, normalize tags for one critical line, and publish a simple operating view for downtime modes, alarms, and equipment state. Keep the pilot bounded to one business question before scaling across lines.`
  }

  if (focus === 'Drive health and predictive maintenance') {
    return `Focus on critical drives and motors first. Combine fault history, load signals, inspection findings, and spare availability into a health view that maintenance can use during planning meetings.`
  }

  if (focus === 'Safety lifecycle review') {
    return `Begin with a safety inventory, validation record review, and gap register. Any controls modernization scope should preserve safety function integrity and align with the customer's outage windows.`
  }

  if (focus === 'HMI/SCADA standardization') {
    return `Define common HMI navigation, alarm priorities, line status views, and reporting expectations. The first deliverable should be a standard that can be applied to the highest-value line without forcing a full plant rewrite.`
  }

  if (focus === 'Digital simulation workshop') {
    return `Model the operating scenario that matters most: capacity ramp, batch variability, changeover timing, or line balancing. Use the workshop to test control strategies and data requirements before the customer commits to equipment changes.`
  }

  return `Run an installed-base assessment that maps controllers, HMI/SCADA, drives, safety, sensors, network dependencies, downtime evidence, and support risks. Convert the findings into a prioritized roadmap.`
}

function section(title: string, body: string) {
  return { title, body }
}

function unique(items: string[]) {
  return [...new Set(items.filter(Boolean))]
}
