import { recentEmails, notifications } from '../utils/dummyData.js';

export function fetchRecentEmails() {
  return Promise.resolve(recentEmails);
}

export function fetchEmailById(id) {
  const email = recentEmails.find((item) => item.id === id);
  return Promise.resolve(email || null);
}

export function fetchNotifications() {
  return Promise.resolve(notifications);
}
