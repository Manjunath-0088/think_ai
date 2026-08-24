class NotificationPreference {
  constructor({
    userId,
    emailEnabled,
    smsEnabled,
    pushEnabled,
    categories,
    updatedAt,
  }) {
    this.userId = userId;
    this.emailEnabled = emailEnabled;
    this.smsEnabled = smsEnabled;
    this.pushEnabled = pushEnabled;
    this.categories = categories;
    this.updatedAt = updatedAt;
  }
}

module.exports = NotificationPreference;