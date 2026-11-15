import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { pool } from './db.js';

const CALENDAR_EVENTS_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const googleConfig = () => ({
  clientId: process.env.GOOGLE_OAUTH_CLIENT_ID?.trim(),
  clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim(),
  redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim(),
  encryptionKey: process.env.GOOGLE_TOKEN_ENCRYPTION_KEY?.trim(),
});

function calendarIsConfigured() {
  const config = googleConfig();
  return Boolean(config.clientId && config.clientSecret && config.redirectUri && /^[a-f0-9]{64}$/i.test(config.encryptionKey || ''));
}

function encryptionKey() {
  const key = googleConfig().encryptionKey || '';
  if (!/^[a-f0-9]{64}$/i.test(key)) throw new Error('Calendar token encryption is not configured.');
  return Buffer.from(key, 'hex');
}

function encryptToken(token) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return { ciphertext: ciphertext.toString('base64'), iv: iv.toString('hex'), authTag: cipher.getAuthTag().toString('hex') };
}

function decryptToken(encrypted) {
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(encrypted.refresh_token_iv, 'hex'));
  decipher.setAuthTag(Buffer.from(encrypted.refresh_token_auth_tag, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted.refresh_token_ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

function callbackPage(res, success, failureDetail) {
  const heading = success ? 'Google Calendar connected' : 'Google Calendar connection failed';
  const detail = success
    ? 'You can return to HelpToYou. Your confirmed appointments can now be added to this calendar.'
    : failureDetail || 'Return to HelpToYou and try connecting again. You can close this page.';
  const safeDetail = detail.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
  return res
    .set('Cache-Control', 'no-store')
    .set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'")
    .status(success ? 200 : 400)
    .type('html')
    .send(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${heading}</title><body style="font:16px system-ui,sans-serif;max-width:520px;margin:15vh auto;padding:24px;color:#1f2937"><h1>${heading}</h1><p>${safeDetail}</p></body></html>`);
}

export async function getGoogleCalendarStatus(req, res) {
  const result = await pool.query('SELECT 1 FROM google_calendar_connections WHERE user_id=$1', [req.userId]);
  return res.json({ configured: calendarIsConfigured(), connected: Boolean(result.rowCount) });
}

export async function startGoogleCalendarConnect(req, res) {
  if (!calendarIsConfigured()) return res.status(503).json({ error: 'Google Calendar is not configured on the API server yet.' });
  const config = googleConfig();
  const rawState = randomBytes(32).toString('hex');
  const stateHash = createHash('sha256').update(rawState).digest('hex');
  await pool.query('DELETE FROM google_calendar_oauth_states WHERE expires_at < NOW()');
  await pool.query(
    `INSERT INTO google_calendar_oauth_states (state_hash,user_id,expires_at)
     VALUES ($1,$2,NOW() + INTERVAL '10 minutes')`,
    [stateHash, req.userId],
  );
  const authorization = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorization.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: CALENDAR_EVENTS_SCOPE,
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'consent',
    state: rawState,
  }).toString();
  return res.json({ authorizationUrl: authorization.toString() });
}

export async function completeGoogleCalendarConnect(req, res) {
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  if (!/^[a-f0-9]{64}$/i.test(state)) {
    return callbackPage(res, false, 'This Google sign-in session is invalid. Return to HelpToYou and start the connection again.');
  }
  const stateHash = createHash('sha256').update(state).digest('hex');
  const stateRow = await pool.query(
    `DELETE FROM google_calendar_oauth_states WHERE state_hash=$1 AND expires_at>NOW() RETURNING user_id`,
    [stateHash],
  );
  if (!stateRow.rowCount) {
    return callbackPage(res, false, 'This Google sign-in session expired. Return to HelpToYou and start the connection again.');
  }
  if (typeof req.query.error === 'string') {
    const detail = req.query.error === 'access_denied'
      ? 'Google denied access. If the OAuth app is in Testing, add this Google account under Google Auth Platform > Audience > Test users, then try again.'
      : `Google sign-in returned ${req.query.error.slice(0, 100)}. Check the OAuth consent screen and authorized redirect URI in Google Cloud Console.`;
    return callbackPage(res, false, detail);
  }
  if (typeof req.query.code !== 'string') {
    return callbackPage(res, false, 'Google did not return an authorization code. Check the OAuth consent screen and try again.');
  }
  if (!calendarIsConfigured()) {
    return callbackPage(res, false, 'Google Calendar credentials are missing or invalid on the API server.');
  }

  try {
    const config = googleConfig();
    const body = new URLSearchParams({
      code: req.query.code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    });
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
      body,
      signal: AbortSignal.timeout(12_000),
    });
    if (!tokenResponse.ok) {
      const failure = await tokenResponse.json().catch(() => ({}));
      console.error('Google Calendar OAuth token exchange rejected:', failure.error || tokenResponse.status);
      const detail = failure.error === 'invalid_grant'
        ? 'Google rejected the authorization code. Confirm the callback URL exactly matches the Authorized redirect URI in Google Cloud Console, then reconnect.'
        : failure.error === 'invalid_client'
          ? 'Google rejected the OAuth client. Confirm the Web client ID and secret in server/.env match the client in Google Cloud Console.'
          : 'Google rejected the authorization exchange. Confirm the OAuth client and Authorized redirect URI in Google Cloud Console.';
      return callbackPage(res, false, detail);
    }
    const tokens = await tokenResponse.json();
    if (typeof tokens.refresh_token !== 'string' && !Number.isFinite(tokens.expires_in)) {
      return callbackPage(res, false, 'Google did not return calendar authorization. Reconnect and approve the requested Calendar access.');
    }

    let refreshToken = tokens.refresh_token;
    if (!refreshToken) {
      const existing = await pool.query(
        'SELECT refresh_token_ciphertext,refresh_token_iv,refresh_token_auth_tag FROM google_calendar_connections WHERE user_id=$1',
        [stateRow.rows[0].user_id],
      );
      if (!existing.rowCount) {
        return callbackPage(res, false, 'Google did not provide a refresh token. Remove HelpToYou from your Google Account connections, then connect again and approve Calendar access.');
      }
      refreshToken = decryptToken(existing.rows[0]);
    }
    const encrypted = encryptToken(refreshToken);
    await pool.query(
      `INSERT INTO google_calendar_connections (user_id,refresh_token_ciphertext,refresh_token_iv,refresh_token_auth_tag)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id) DO UPDATE SET refresh_token_ciphertext=EXCLUDED.refresh_token_ciphertext,
         refresh_token_iv=EXCLUDED.refresh_token_iv,refresh_token_auth_tag=EXCLUDED.refresh_token_auth_tag,updated_at=NOW()`,
      [stateRow.rows[0].user_id, encrypted.ciphertext, encrypted.iv, encrypted.authTag],
    );
    return callbackPage(res, true);
  } catch (error) {
    console.error('Google Calendar OAuth callback failed:', error.message);
    const detail = error.name === 'AbortError' || error.name === 'TimeoutError'
      ? 'Google took too long to authorize the connection. Check the server internet connection and try again.'
      : error.message === 'fetch failed'
        ? 'The API server could not reach Google to finish connecting. Check the computer internet connection and try again.'
        : error.message?.includes('Calendar token encryption')
          ? 'The API token encryption key is invalid. Check GOOGLE_TOKEN_ENCRYPTION_KEY in server/.env and restart the API.'
          : 'Google authorization returned, but the API could not save the connection. Check the API server log and try again.';
    return callbackPage(res, false, detail);
  }
}

export async function disconnectGoogleCalendar(req, res) {
  const result = await pool.query(
    `DELETE FROM google_calendar_connections WHERE user_id=$1
     RETURNING refresh_token_ciphertext,refresh_token_iv,refresh_token_auth_tag`,
    [req.userId],
  );
  if (result.rowCount) {
    try {
      const token = decryptToken(result.rows[0]);
      await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token }),
        signal: AbortSignal.timeout(8_000),
      });
    } catch (error) {
      console.warn('Google Calendar token revocation did not complete:', error.message);
    }
  }
  return res.json({ connected: false });
}

async function getCalendarAccessToken(userId) {
  const result = await pool.query(
    'SELECT refresh_token_ciphertext,refresh_token_iv,refresh_token_auth_tag FROM google_calendar_connections WHERE user_id=$1',
    [userId],
  );
  if (!result.rowCount) return null;
  const config = googleConfig();
  const refreshToken = decryptToken(result.rows[0]);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error('Google Calendar authorization expired; reconnect the account.');
  const tokens = await response.json();
  return typeof tokens.access_token === 'string' ? tokens.access_token : null;
}

export async function addBookingToGoogleCalendar(req, res) {
  const input = z.object({ bookingId: z.uuid() }).strict().parse(req.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`calendar:${req.userId}:${input.bookingId}`]);
    const existing = await client.query(
      'SELECT event_url AS "eventUrl" FROM google_calendar_events WHERE user_id=$1 AND booking_id=$2',
      [req.userId, input.bookingId],
    );
    if (existing.rowCount) {
      await client.query('COMMIT');
      return res.json({ eventUrl: existing.rows[0].eventUrl, alreadyAdded: true });
    }

    const booking = await client.query(
      `SELECT b.id,b.status,o.title,o.starts_at AS "startsAt",o.ends_at AS "endsAt",o.meeting_url AS "meetingUrl",
        mentor.first_name || ' ' || mentor.last_name AS "mentorName",
        student.first_name || ' ' || student.last_name AS "studentName"
       FROM office_hour_bookings b JOIN mentor_office_hours o ON o.id=b.office_hour_id
       JOIN users mentor ON mentor.id=o.mentor_id JOIN users student ON student.id=b.student_id
       WHERE b.id=$1 AND b.status='accepted' AND (b.student_id=$2 OR o.mentor_id=$2)`,
      [input.bookingId, req.userId],
    );
    if (!booking.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Only confirmed appointments on your account can be added to Google Calendar.' });
    }
    if (booking.rows[0].startsAt <= new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Only upcoming appointments can be added to Google Calendar.' });
    }
    const accessToken = await getCalendarAccessToken(req.userId);
    if (!accessToken) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Connect Google Calendar before adding an appointment.' });
    }

    const details = [`HelpToYou appointment with ${booking.rows[0].mentorName}.`];
    if (booking.rows[0].meetingUrl) details.push(`Meeting link: ${booking.rows[0].meetingUrl}`);
    const eventResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=none', {
      method: 'POST',
      headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        summary: booking.rows[0].title,
        description: details.join('\n'),
        start: { dateTime: booking.rows[0].startsAt.toISOString() },
        end: { dateTime: booking.rows[0].endsAt.toISOString() },
        ...(booking.rows[0].meetingUrl ? { location: booking.rows[0].meetingUrl } : {}),
        visibility: 'private',
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!eventResponse.ok) {
      await client.query('ROLLBACK');
      return res.status(502).json({ error: 'Google Calendar could not add this appointment. Reconnect and try again.' });
    }
    const event = await eventResponse.json();
    if (typeof event.id !== 'string') {
      await client.query('ROLLBACK');
      return res.status(502).json({ error: 'Google Calendar returned an invalid event response.' });
    }
    await client.query(
      `INSERT INTO google_calendar_events (user_id,booking_id,google_event_id,event_url)
       VALUES ($1,$2,$3,$4)`,
      [req.userId, input.bookingId, event.id, event.htmlLink || null],
    );
    await client.query('COMMIT');
    return res.status(201).json({ eventUrl: event.htmlLink || null, alreadyAdded: false });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    if (error.name === 'AbortError' || error.name === 'TimeoutError') return res.status(504).json({ error: 'Google Calendar took too long to respond. Please try again.' });
    // A Google authorization failure must not invalidate the HelpToYou session.
    if (error.message?.includes('authorization expired')) return res.status(409).json({ error: error.message });
    console.error('Google Calendar event creation failed:', error.message);
    return res.status(502).json({ error: 'Could not add the appointment to Google Calendar.' });
  } finally {
    client.release();
  }
}
