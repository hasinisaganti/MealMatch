import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { readDb, writeDb, id } from './db.js';

const app = express();
const secret = 'mealmatch-local-secret';
app.use(cors());
app.use(express.json());

const issueToken = user => jwt.sign({ id: user.id, role: user.role }, secret, { expiresIn: '7d' });
const auth = (req, res, next) => {
  try {
    const value = req.headers.authorization || '';
    if (!value.startsWith('Bearer ')) throw new Error('Missing token');
    req.user = jwt.verify(value.slice(7), secret);
    next();
  } catch {
    res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
};
const publicUser = user => ({ ...user, password: undefined });
const locationKey = value => String(value || '').trim().toLowerCase().replace(/\s*,\s*/g, ',');
const plansAt = (db, location) => db.plans.filter(plan => plan.available && (!locationKey(location) || locationKey(plan.location) === locationKey(location)));
const currentUser = (db, id) => db.users.find(user => user.id === id);

app.get('/api/health', (_, res) => res.json({ ok: true }));
app.post('/api/auth/register', async (req, res) => {
  const { name, password, role = 'student', location = '' } = req.body;
  const email = String(req.body.email || '').trim().toLowerCase();
  const db = readDb();
  if (db.users.some(user => user.email.toLowerCase() === email)) return res.status(409).json({ error: 'An account with this email already exists. Please log in instead.' });
  const user = { id: id('u'), name, email, password: await bcrypt.hash(password, 10), role, verified: false, location, preferences: { budget: 4500, diet: 'veg', spice: 'medium', allergies: '', location } };
  db.users.push(user);
  writeDb(db);
  res.status(201).json({ token: issueToken(user), user: publicUser(user) });
});
app.post('/api/auth/login', async (req, res) => {
  const db = readDb();
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = db.users.find(candidate => candidate.email.toLowerCase() === email);
  if (!user || !await bcrypt.compare(req.body.password || '', user.password)) return res.status(401).json({ error: 'Invalid email or password.' });
  res.json({ token: issueToken(user), user: publicUser(user) });
});
app.get('/api/me', auth, (req, res) => {
  const user = currentUser(readDb(), req.user.id);
  if (!user) return res.status(401).json({ error: 'Your account is no longer available.' });
  res.json(publicUser(user));
});
app.put('/api/me/preferences', auth, (req, res) => {
  const db = readDb();
  const user = currentUser(db, req.user.id);
  if (!user) return res.status(401).json({ error: 'Your account is no longer available.' });
  user.preferences = { ...user.preferences, ...req.body };
  user.location = user.preferences.location || user.location;
  writeDb(db);
  res.json({ user: publicUser(user), preferences: user.preferences });
});
app.get('/api/plans', auth, (req, res) => {
  const db = readDb();
  const user = currentUser(db, req.user.id);
  const location = user.preferences?.location || user.location;
  res.json(plansAt(db, location).map(plan => ({ ...plan, provider: currentUser(db, plan.providerId)?.name })));
});
app.get('/api/recommendations', auth, (req, res) => {
  const db = readDb();
  const user = currentUser(db, req.user.id);
  const preferences = user.preferences || {};
  const scored = plansAt(db, preferences.location || user.location).map(plan => {
    let score = plan.rating;
    if (plan.diet === preferences.diet) score += 50;
    if (locationKey(plan.location) === locationKey(preferences.location)) score += 25;
    if (plan.price <= Number(preferences.budget || 0)) score += 15;
    if (plan.spice === preferences.spice) score += 5;
    return { ...plan, provider: currentUser(db, plan.providerId)?.name, match: Math.min(99, Math.round(score)) };
  }).sort((a, b) => b.match - a.match);
  res.json(scored);
});
app.post('/api/subscriptions', auth, (req, res) => {
  const db = readDb();
  const user = currentUser(db, req.user.id);
  const plan = db.plans.find(candidate => candidate.id === req.body.planId);
  if (!plan || !plan.available) return res.status(404).json({ error: 'Plan not found or unavailable.' });
  const existing = db.subscriptions.find(subscription => subscription.studentId === user.id && subscription.planId === plan.id && subscription.status === 'active');
  if (existing) return res.json({ ...existing, created: false });
  const subscription = { id: id('s'), studentId: user.id, planId: plan.id, status: 'active', deliveryLocation: user.preferences?.location || user.location || '', startDate: new Date().toISOString().slice(0, 10), nextMeal: 'Tomorrow - Lunch' };
  db.subscriptions.push(subscription);
  writeDb(db);
  res.status(201).json({ ...subscription, created: true });
});
app.get('/api/subscriptions', auth, (req, res) => {
  const db = readDb();
  const unique = new Map();
  db.subscriptions.filter(subscription => subscription.studentId === req.user.id && subscription.status === 'active').forEach(subscription => {
    const key = subscription.planId + ':' + subscription.startDate;
    if (!unique.has(key)) unique.set(key, subscription);
  });
  res.json([...unique.values()].map(subscription => ({ ...subscription, plan: db.plans.find(plan => plan.id === subscription.planId) })));
});
app.listen(4000, () => console.log('MealMatch API on http://localhost:4000'));