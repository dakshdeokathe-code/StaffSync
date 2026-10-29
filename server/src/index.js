import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

const { Schema, model } = mongoose;
const User = model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['employee', 'manager', 'hr'], default: 'employee' },
  department: { type: String, default: 'General' },
  title: { type: String, default: 'Team Member' }
}, { timestamps: true }));
const Attendance = model('Attendance', new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, status: { type: String, default: 'Present' }
}, { timestamps: true }));
const Leave = model('Leave', new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true }, startDate: String, endDate: String,
  reason: String, status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, { timestamps: true }));
const Announcement = model('Announcement', new Schema({
  title: { type: String, required: true }, body: { type: String, required: true },
  author: { type: String, default: 'HR Team' }
}, { timestamps: true }));
const Training = model('Training', new Schema({
  title: { type: String, required: true }, description: String, date: String,
  owner: { type: String, default: 'Learning & Development' }
}, { timestamps: true }));

const auth = (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    if (!token) throw new Error('Missing token');
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch { res.status(401).json({ message: 'Please log in again.' }); }
};
const roles = (...allowed) => (req, res, next) =>
  allowed.includes(req.user.role) ? next() : res.status(403).json({ message: 'You do not have permission.' });

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'StaffSync API' }));
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 8)
      return res.status(400).json({ message: 'Name, email and password (8+ characters) are required.' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'An account with this email already exists.' });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
    res.status(201).json(makeSession(user));
  } catch (e) { res.status(500).json({ message: 'Could not register user.' }); }
});
app.post('/api/auth/login', async (req, res) => {
  const user = await User.findOne({ email: String(req.body.email || '').toLowerCase() });
  if (!user || !(await bcrypt.compare(req.body.password || '', user.password)))
    return res.status(401).json({ message: 'Incorrect email or password.' });
  res.json(makeSession(user));
});
function makeSession(user) {
  return { token: jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '8h' }),
    user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department, title: user.title } };
}
app.get('/api/auth/me', auth, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json(user);
});
app.get('/api/employees', auth, roles('hr', 'manager'), async (_req, res) =>
  res.json(await User.find().select('-password').sort({ createdAt: -1 })));
app.post('/api/employees', auth, roles('hr'), async (req, res) => {
  const { name, email, department, title } = req.body;
  if (!name || !email) return res.status(400).json({ message: 'Name and email are required.' });
  if (await User.findOne({ email })) return res.status(409).json({ message: 'Email already exists.' });
  const tempPassword = await bcrypt.hash(Math.random().toString(36) + 'A1!', 12);
  res.status(201).json(await User.create({ name, email, department, title, password: tempPassword }));
});
app.patch('/api/employees/:id', auth, roles('hr'), async (req, res) => {
  const allowed = ['name', 'department', 'title'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'Employee not found.' });
  res.json(user);
});
app.delete('/api/employees/:id', auth, roles('hr'), async (req, res) => {
  if (String(req.user.id) === req.params.id) return res.status(400).json({ message: 'You cannot delete your own account.' });
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'Employee not found.' });
  res.json({ message: 'Employee deleted.' });
});
app.get('/api/attendance', auth, async (req, res) => {
  const filter = req.user.role === 'employee' ? { user: req.user.id } : {};
  res.json(await Attendance.find(filter).populate('user', 'name department').sort({ createdAt: -1 }).limit(200));
});
app.post('/api/attendance', auth, async (req, res) => {
  const date = new Date().toISOString().slice(0, 10);
  const existing = await Attendance.findOne({ user: req.user.id, date });
  if (existing) return res.status(409).json({ message: 'Attendance already marked today.' });
  res.status(201).json(await Attendance.create({ user: req.user.id, date, status: 'Present' }));
});
app.get('/api/leaves', auth, async (req, res) => {
  const filter = req.user.role === 'employee' ? { user: req.user.id } : {};
  res.json(await Leave.find(filter).populate('user', 'name department').sort({ createdAt: -1 }));
});
app.post('/api/leaves', auth, async (req, res) => {
  const { type, startDate, endDate, reason } = req.body;
  if (!type || !startDate || !endDate) return res.status(400).json({ message: 'Leave type and dates are required.' });
  res.status(201).json(await Leave.create({ user: req.user.id, type, startDate, endDate, reason }));
});
app.patch('/api/leaves/:id', auth, roles('hr', 'manager'), async (req, res) => {
  if (!['Approved', 'Rejected'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid leave status.' });
  const leave = await Leave.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!leave) return res.status(404).json({ message: 'Leave request not found.' });
  res.json(leave);
});
app.get('/api/announcements', auth, async (_req, res) => res.json(await Announcement.find().sort({ createdAt: -1 })));
app.post('/api/announcements', auth, roles('hr'), async (req, res) => {
  if (!req.body.title || !req.body.body) return res.status(400).json({ message: 'Title and message are required.' });
  res.status(201).json(await Announcement.create({ title: req.body.title, body: req.body.body, author: req.user.name }));
});
app.get('/api/trainings', auth, async (_req, res) => res.json(await Training.find().sort({ date: 1 })));
app.post('/api/trainings', auth, roles('hr', 'manager'), async (req, res) => {
  if (!req.body.title) return res.status(400).json({ message: 'Training title is required.' });
  res.status(201).json(await Training.create(req.body));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected server error.' });
});
const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(port, () => console.log(`StaffSync API running on port ${port}`)))
  .catch(err => { console.error('MongoDB connection failed. Check MONGO_URI in server/.env', err.message); process.exit(1); });
