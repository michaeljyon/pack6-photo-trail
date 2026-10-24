// Netlify Function: every /api/* request lands here. Data lives in Netlify
// Blobs (no database to set up), in a store named after pack.id.
import { getStore } from '@netlify/blobs';
import { handle } from '../lib/core.mjs';
import pack from '../../pack/pack.js';

export default async (req) => handle(req, {
  store: getStore({ name: `photos-${pack.id}`, consistency: 'strong' }),
  packCode: process.env.PACK_CODE || '',
  leaderPasscode: process.env.LEADER_PASSCODE || '',
});

export const config = { path: '/api/*' };
