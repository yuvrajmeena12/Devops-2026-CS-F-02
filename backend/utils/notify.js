const Notification = require('../models/Notification');

/**
 * Creates an in-app notification.
 * Supports both options object: { recipient, actor, type, message, link, dedupeKey }
 * and legacy positional: (userId, type, message, relatedId)
 * Errors/duplicate keys never crash the calling transaction.
 */
async function notify(arg1, arg2, arg3, arg4) {
  try {
    let payload = {};
    if (typeof arg1 === 'object' && arg1 !== null) {
      payload = {
        user: arg1.recipient || arg1.user,
        actor: arg1.actor || null,
        type: arg1.type,
        message: arg1.message,
        link: arg1.link || '/',
        dedupeKey: arg1.dedupeKey || null,
        relatedId: arg1.relatedId || null,
      };
    } else {
      payload = {
        user: arg1,
        type: arg2,
        message: arg3,
        relatedId: arg4 || null,
        link: '/',
      };
    }

    if (!payload.user) return null;
    if (payload.actor && String(payload.actor) === String(payload.user)) {
      return null; // Self-actions never notify self
    }

    return await Notification.create(payload);
  } catch (err) {
    if (err && err.code === 11000) {
      // Duplicate event silenced via partial unique index
      return null;
    }
    console.error('[Notification Dispatch Error]:', err.message);
    return null;
  }
}

// Support both styles: notify({...}) and { createNotification: notify }
notify.createNotification = notify;
module.exports = notify;
