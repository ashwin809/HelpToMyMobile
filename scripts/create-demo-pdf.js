const fs = require('fs');
const path = require('path');

const PAGE_W = 595;
const PAGE_H = 842;
const GREEN = [0.02, 0.62, 0.32];
const DARK = [0.08, 0.13, 0.22];
const MUTED = [0.30, 0.35, 0.43];
const LIGHT = [0.95, 0.98, 0.96];
const BLUE = [0.90, 0.95, 1.00];
const GOLD = [1.00, 0.97, 0.88];

function esc(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function color(c, op) {
  return `${c.map((n) => n.toFixed(3)).join(' ')} ${op}`;
}

function pageBuilder() {
  const out = [];
  const text = (x, y, size, value, c = DARK, font = 'F1') => {
    out.push(`${color(c, 'rg')} BT /${font} ${size} Tf ${x} ${y} Td (${esc(value)}) Tj ET`);
  };
  const line = (x1, y1, x2, y2, c = GREEN, width = 1.5) => {
    out.push(`${color(c, 'RG')} ${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
  };
  const box = (x, y, w, h, title, lines, fill = LIGHT, border = GREEN) => {
    out.push(`${color(fill, 'rg')} ${color(border, 'RG')} 1 w ${x} ${y} ${w} ${h} re B`);
    text(x + 12, y + h - 22, 12, title, DARK, 'F2');
    lines.forEach((lineText, index) => text(x + 12, y + h - 40 - (index * 15), 9.5, lineText, MUTED));
  };
  const bullet = (x, y, value, c = DARK) => {
    out.push(`${color(GREEN, 'rg')} ${x} ${y + 2} 4 4 re f`);
    text(x + 11, y, 10, value, c);
  };
  return { out, text, line, box, bullet };
}

function pageOne() {
  const p = pageBuilder();
  p.text(42, 790, 25, 'HelpToYou');
  p.text(42, 765, 15, 'Product demonstration flow', GREEN, 'F2');
  p.text(42, 738, 10.5, 'Education community platform for students, faculty, mentors, volunteers, and sponsors.', MUTED);

  p.box(60, 650, 475, 58, '1. Launch app', ['Open HelpToYou in Expo Go or a development build.', 'Confirm branding, loading state, and network status.'], BLUE, [0.25, 0.48, 0.80]);
  p.line(297, 650, 297, 625, GREEN, 2);
  p.box(60, 555, 475, 70, '2. Account registration', ['Create an account with email and password.', 'Required fields are validated; profile details come after registration.'], LIGHT, GREEN);
  p.line(297, 555, 297, 530, GREEN, 2);
  p.box(60, 460, 475, 70, '3. Role selection', ['Choose Student/Aspirant, Faculty, Alumni/Mentor, Sponsor/Donor, or Volunteer.', 'The selected role is clearly highlighted.'], GOLD, [0.80, 0.58, 0.12]);
  p.line(297, 460, 297, 435, GREEN, 2);
  p.box(60, 330, 475, 105, '4. Three-step profile setup', ['Step 1: role interests and help categories.', 'Step 2: institution, field of study, and expertise.', 'Step 3: biography and approved profile details.', 'Back, Continue, Skip, and progress indicators are demonstrated.'], LIGHT, GREEN);
  p.line(297, 330, 297, 305, GREEN, 2);
  p.box(60, 230, 475, 75, '5. Main app experience', ['Resume incomplete setup after sign-in; otherwise open the main app.', 'Bottom navigation exposes Home, Community, Discover, Network, and Profile.'], BLUE, [0.25, 0.48, 0.80]);

  p.text(42, 175, 13, 'Meeting narration', DARK, 'F2');
  p.bullet(48, 150, 'A new user can register without completing the full profile.');
  p.bullet(48, 130, 'Optional biography and specialization can be skipped and edited later.');
  p.bullet(48, 110, 'Returning users resume setup or enter the main app based on completion state.');
  p.text(42, 60, 9, 'HelpToYou | Demonstration guide | 14 Nov 2026', MUTED);
  return p.out.join('\n');
}

function pageTwo() {
  const p = pageBuilder();
  p.text(42, 790, 23, 'Feature demonstration map');
  p.text(42, 765, 11, 'Show each capability in the order that a meeting audience can understand.', MUTED);

  p.box(42, 600, 240, 120, 'A. Profile and roles', ['Open Profile and Edit Profile.', 'Show role, institution, field, expertise,', 'biography, and permitted statistics.', 'Demonstrate save validation and success state.'], LIGHT, GREEN);
  p.box(313, 600, 240, 120, 'B. Community Q&A', ['Open Community.', 'Browse questions and open a detail view.', 'Show loading, empty, and error states.', 'Actions follow the approved MVP matrix.'], BLUE, [0.25, 0.48, 0.80]);
  p.box(42, 440, 240, 120, 'C. Discover mentors', ['Open Discover/Mentors.', 'Browse role, interests, expertise,', 'institution, and short biography.', 'Open a mentor profile for more detail.'], BLUE, [0.25, 0.48, 0.80]);
  p.box(313, 440, 240, 120, 'D. Connections', ['Send a connection request where allowed.', 'Show pending, accepted, declined, or', 'cancelled status to both participants.', 'Private contact data stays protected.'], LIGHT, GREEN);
  p.box(42, 280, 240, 120, 'E. Appointment coordination', ['Start from an accepted connection.', 'Show the approved scheduling flow.', 'Google Calendar is the intended integration.', 'Explain permissions, time zones, and failure states.'], GOLD, [0.80, 0.58, 0.12]);
  p.box(313, 280, 240, 120, 'F. Authentication', ['Sign in and sign out.', 'Try password recovery.', 'Protected pages require authentication.', 'Session expiry prompts re-authentication.'], LIGHT, GREEN);

  p.text(42, 225, 13, 'Roles to mention in the demo', DARK, 'F2');
  p.bullet(48, 200, 'Student/Aspirant: admissions guidance, tutoring, notes, and mentoring.');
  p.bullet(48, 180, 'Professor/Faculty and Alumni/Mentor: expertise profiles and student support.');
  p.bullet(48, 160, 'Sponsor/Donor and Volunteer: approved support and opportunity workflows.');
  p.text(42, 60, 9, 'HelpToYou | Feature map | 14 Nov 2026', MUTED);
  return p.out.join('\n');
}

function pageThree() {
  const p = pageBuilder();
  p.text(42, 790, 23, 'Technical flow and meeting checklist');
  p.text(42, 765, 11, 'The implementation matches the agreed React Native, Node.js, and PostgreSQL direction.', MUTED);

  p.box(42, 650, 150, 75, 'Mobile client', ['React Native + TypeScript', 'Expo development workflow', 'Role-aware navigation'], LIGHT, GREEN);
  p.box(222, 650, 150, 75, 'API backend', ['Node.js REST API', 'Authentication and sessions', 'Role/permission checks'], BLUE, [0.25, 0.48, 0.80]);
  p.box(402, 650, 150, 75, 'Data layer', ['PostgreSQL', 'Migrations and models', 'Privacy-conscious errors'], GOLD, [0.80, 0.58, 0.12]);
  p.line(192, 688, 222, 688, GREEN, 2);
  p.line(372, 688, 402, 688, GREEN, 2);

  p.text(42, 605, 13, 'API examples to show if requested', DARK, 'F2');
  p.bullet(48, 580, 'POST /api/v1/auth/register and /login');
  p.bullet(48, 560, 'GET /api/v1/users/me and PATCH /api/v1/users/me');
  p.bullet(48, 540, 'GET /api/v1/community/questions and mentor discovery endpoints');
  p.bullet(48, 520, 'Connection request endpoints with backend authorization');
  p.bullet(48, 500, 'GET /api/v1/calendar/google/connect and OAuth callback');

  p.box(42, 345, 510, 125, 'Google Calendar status', ['The app has the connect flow and callback design.', 'The MVP decision still needs to specify: create events, check availability,', 'send invitations, or redirect to a calendar link.', 'For a live demo, use a configured OAuth client, exact redirect URI,', 'test-user access, and a running publicly reachable API callback.'], GOLD, [0.80, 0.58, 0.12]);

  p.text(42, 300, 13, 'Acceptance checklist', DARK, 'F2');
  p.bullet(48, 275, 'Registration, sign-in, sign-out, and password recovery work.');
  p.bullet(48, 255, 'Five roles and the three profile setup steps are visible.');
  p.bullet(48, 235, 'Institution selection remains visible after save and navigation.');
  p.bullet(48, 215, 'Community, mentor discovery, profile, and connection states are demonstrable.');
  p.bullet(48, 195, 'Network errors, loading states, and protected routes are handled.');
  p.text(42, 60, 9, 'HelpToYou | Technical checklist | 14 Nov 2026', MUTED);
  return p.out.join('\n');
}

function makePdf(pageStreams) {
  const objects = [];
  const add = (value) => { objects.push(value); return objects.length; };
  const fontRegular = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const fontBold = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const pageIds = [];
  const contentIds = [];
  pageStreams.forEach((stream) => {
    const streamBuffer = Buffer.from(stream, 'latin1');
    contentIds.push(add(`<< /Length ${streamBuffer.length} >>\nstream\n${stream}\nendstream`));
    pageIds.push(add(null));
  });
  const pagesId = add(null);
  pageIds.forEach((pageId, index) => {
    objects[pageId - 1] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`;
  });
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  const catalogId = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  let pdf = '%PDF-1.4\n%\xFF\xFF\xFF\xFF\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

const outputPath = path.resolve(__dirname, '..', 'HelpToYou_Demonstration_Guide.pdf');
fs.writeFileSync(outputPath, makePdf([pageOne(), pageTwo(), pageThree()]));
console.log(outputPath);
