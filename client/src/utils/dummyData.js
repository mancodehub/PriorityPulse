export const stats = [
  { id: 's1', title: 'Total Emails', value: '1,248' },
  { id: 's2', title: 'High Priority', value: '128' },
  { id: 's3', title: 'Medium Priority', value: '382' },
  { id: 's4', title: 'Low Priority', value: '738' },
];

export const recentEmails = [
  {
    id: '1',
    sender: 'Marcus Chen, VP Engineering',
    subject: 'Production incident — checkout service degraded',
    priority: 'High',
    received: '9 minutes ago',
    body:
      'The checkout service is returning elevated error rates in the EU region. We need eyes on this before the next release window. Can you confirm the on-call rotation and escalate if needed?',
  },
  {
    id: '2',
    sender: 'Priya Nair, Finance',
    subject: 'Q3 budget approval needed by Friday',
    priority: 'High',
    received: '42 minutes ago',
    body:
      'Finance needs sign-off on the Q3 marketing budget by end of day Friday to keep the campaign timeline on track. Attached is the breakdown for review.',
  },
  {
    id: '3',
    sender: 'Dana Ruiz, People Ops',
    subject: 'Reminder: benefits enrollment closes soon',
    priority: 'Medium',
    received: '1 hour ago',
    body:
      'This is a friendly reminder that open enrollment for benefits closes at the end of the month. Please review your selections in the HR portal.',
  },
  {
    id: '4',
    sender: 'GitHub Notifications',
    subject: '[priority-pulse] 3 new pull requests awaiting review',
    priority: 'Medium',
    received: '2 hours ago',
    body:
      'Three pull requests are waiting on your review in the priority-pulse repository. None are marked urgent, but the oldest has been open for two days.',
  },
  {
    id: '5',
    sender: 'Newsletter — Dev Weekly',
    subject: 'This week in machine learning infrastructure',
    priority: 'Low',
    received: '5 hours ago',
    body:
      'A roundup of the week\'s top stories in ML infrastructure, model serving, and data pipeline tooling, curated for engineering teams.',
  },
  {
    id: '6',
    sender: 'Facilities Team',
    subject: 'Scheduled maintenance — 4th floor HVAC',
    priority: 'Low',
    received: 'Yesterday',
    body:
      'Routine HVAC maintenance is scheduled for the 4th floor this weekend. No action is required and office access will not be affected.',
  },
];

export const notifications = [
  {
    id: 'n1',
    title: 'High-priority email detected',
    message: 'A message from Marcus Chen was classified High priority and routed to your alert channel.',
    time: '9m ago',
  },
  {
    id: 'n2',
    title: 'Classifier model updated',
    message: 'The priority classification model was retrained with the latest labeled dataset.',
    time: '3h ago',
  },
  {
    id: 'n3',
    title: 'Weekly digest ready',
    message: 'Your weekly priority and alert summary is ready to view in Analytics.',
    time: 'Yesterday',
  },
  {
    id: 'n4',
    title: 'New team member added',
    message: 'Dana Ruiz was added to your PriorityPulse workspace with analyst access.',
    time: '2 days ago',
  },
];
