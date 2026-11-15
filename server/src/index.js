import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { ZodError } from 'zod';
import { askAcademicAssistant } from './aiAssistant.js';
import { currentUser, login, logout, register, requestPasswordReset, resetPassword, requireAuth, updateCurrentUser } from './auth.js';
import { createRequest, createResponse, getCommunityImpact, getRequest, listRequests, resolveRequest, toggleVote } from './community.js';
import {
  blockUser, createConnection, createOrGetThread, createReport, getActivitySummary, getConnections, listBlocks,
  listMentors, listMessages, listNotifications, listThreads, markMessageRead,
  markNotificationRead, removePushToken, savePushToken, sendMessage, unblockUser,
  submitContactMessage, updateConnection,
} from './social.js';
import { pool } from './db.js';
import {
  addBookingToGoogleCalendar, completeGoogleCalendarConnect, disconnectGoogleCalendar,
  getGoogleCalendarStatus, startGoogleCalendarConnect,
} from './googleCalendar.js';
import {
  acceptHelpResponse, bookOfficeHour, createGoal, createOfficeHour, createOpportunity, createResource, createStudyCircle,
  deleteGoal, joinStudyCircle, listGoals, listOfficeHours, listOpportunities, listResources,
  listStudyCircles, toggleSavedOpportunity, updateGoal, updateOfficeHourBooking, listCirclePosts, createCirclePost,
} from './features.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must contain at least 32 characters.');
}

const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  const requestId = randomUUID();
  req.requestId = requestId;
  res.set('X-Request-Id', requestId);
  next();
});
app.use(helmet());
const configuredOrigins = process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) || [];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (configuredOrigins.includes(origin)) return callback(null, true);
    if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: '3mb' }));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });
const passwordResetRequestLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false });
const passwordResetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });
const aiAssistantLimiter = rateLimit({ windowMs: 60 * 1000, limit: 12, standardHeaders: 'draft-8', legacyHeaders: false });
app.use('/api/v1', apiLimiter);
app.get(['/health', '/api/v1/health'], async (_req, res, next) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', database: 'connected' }); }
  catch (error) { next(error); }
});
app.get('/api/v1/calendar/google/callback', completeGoogleCalendarConnect);
app.get('/api/v1/calendar/google/status', requireAuth, getGoogleCalendarStatus);
app.post('/api/v1/calendar/google/connect', requireAuth, startGoogleCalendarConnect);
app.delete('/api/v1/calendar/google/connection', requireAuth, disconnectGoogleCalendar);
app.post('/api/v1/calendar/google/events', requireAuth, addBookingToGoogleCalendar);
app.post('/api/v1/auth/register', authLimiter, register);
app.post('/api/v1/auth/login', authLimiter, login);
app.post('/api/v1/auth/forgot-password', passwordResetRequestLimiter, requestPasswordReset);
app.post('/api/v1/auth/reset-password', passwordResetLimiter, resetPassword);
app.post('/api/v1/contact-messages', authLimiter, submitContactMessage);
app.post('/api/v1/ai/assistant', requireAuth, aiAssistantLimiter, askAcademicAssistant);
app.get('/api/v1/activity/summary', requireAuth, getActivitySummary);
app.get('/api/v1/community/impact', requireAuth, getCommunityImpact);
app.post('/api/v1/auth/logout', requireAuth, logout);
app.get('/api/v1/auth/me', requireAuth, currentUser);
app.patch('/api/v1/profile', requireAuth, updateCurrentUser);
app.get('/api/v1/community/questions', requireAuth, listRequests);
app.post('/api/v1/community/questions', requireAuth, createRequest);
app.get('/api/v1/community/questions/:requestId', requireAuth, getRequest);
app.post('/api/v1/community/questions/:requestId/responses', requireAuth, createResponse);
app.post('/api/v1/community/questions/:requestId/responses/:responseId/accept', requireAuth, acceptHelpResponse);
app.post('/api/v1/community/questions/:requestId/vote', requireAuth, toggleVote);
app.post('/api/v1/community/questions/:requestId/resolve', requireAuth, resolveRequest);
app.get('/api/v1/mentors', requireAuth, listMentors);
app.get('/api/v1/connections', requireAuth, getConnections);
app.post('/api/v1/connections', requireAuth, createConnection);
app.patch('/api/v1/connections/:connectionId', requireAuth, updateConnection);
app.get('/api/v1/blocks', requireAuth, listBlocks);
app.post('/api/v1/blocks', requireAuth, blockUser);
app.delete('/api/v1/blocks/:targetUserId', requireAuth, unblockUser);
app.post('/api/v1/reports', requireAuth, createReport);
app.get('/api/v1/notifications', requireAuth, listNotifications);
app.patch('/api/v1/notifications/:notificationId/read', requireAuth, markNotificationRead);
app.post('/api/v1/push-tokens', requireAuth, savePushToken);
app.delete('/api/v1/push-tokens', requireAuth, removePushToken);
app.get('/api/v1/chat/threads', requireAuth, listThreads);
app.post('/api/v1/chat/threads', requireAuth, createOrGetThread);
app.get('/api/v1/chat/threads/:threadId/messages', requireAuth, listMessages);
app.post('/api/v1/chat/threads/:threadId/messages', requireAuth, sendMessage);
app.patch('/api/v1/chat/threads/:threadId/messages/:messageId/read', requireAuth, markMessageRead);
app.get('/api/v1/study-circles', requireAuth, listStudyCircles);
app.post('/api/v1/study-circles', requireAuth, createStudyCircle);
app.post('/api/v1/study-circles/:circleId/join', requireAuth, joinStudyCircle);
app.get('/api/v1/study-circles/:circleId/posts', requireAuth, listCirclePosts);
app.post('/api/v1/study-circles/:circleId/posts', requireAuth, createCirclePost);
app.get('/api/v1/office-hours', requireAuth, listOfficeHours);
app.post('/api/v1/office-hours', requireAuth, createOfficeHour);
app.post('/api/v1/office-hours/:officeHourId/book', requireAuth, bookOfficeHour);
app.patch('/api/v1/office-hour-bookings/:bookingId', requireAuth, updateOfficeHourBooking);
app.get('/api/v1/opportunities', requireAuth, listOpportunities);
app.post('/api/v1/opportunities/:opportunityId/save', requireAuth, toggleSavedOpportunity);
app.post('/api/v1/opportunities', requireAuth, createOpportunity);
app.get('/api/v1/goals', requireAuth, listGoals);
app.post('/api/v1/goals', requireAuth, createGoal);
app.patch('/api/v1/goals/:goalId', requireAuth, updateGoal);
app.delete('/api/v1/goals/:goalId', requireAuth, deleteGoal);
app.get('/api/v1/resources', requireAuth, listResources);
app.post('/api/v1/resources', requireAuth, createResource);

app.use((error, _req, res, _next) => {
  const requestId = _req.requestId;
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body must be valid JSON.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large.' });
  if (error instanceof ZodError) return res.status(400).json({ error: 'Invalid request data.', details: error.issues.map(({ path, message }) => ({ field: path.join('.'), message })) });
  if (error.code === '23505') return res.status(409).json({ error: 'An account with this email address already exists.' });
  if (error.code === '22P02') return res.status(400).json({ error: 'Invalid identifier or value.' });
  console.error(JSON.stringify({ event: 'api_request_failed', requestId, method: _req.method, path: _req.path, name: error.name, code: error.code }));
  return res.status(500).json({ error: 'Something went wrong. Please try again.', requestId });
});

const port = Number(process.env.PORT || 4000);
const server = app.listen(port, () => console.info(`HelpToYou API listening on port ${port}`));

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
