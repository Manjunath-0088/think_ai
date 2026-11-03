const moderatorService = require('../services/forum/moderatorService');

function requireCommunityModerator(req, res, next) {
  const user = req.communityUser || req.user;
  if (['Admin', 'Administrator', 'Moderator'].includes(user?.role) || moderatorService.isModerator(user)) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Moderator permission is required.' });
}

module.exports = requireCommunityModerator;
