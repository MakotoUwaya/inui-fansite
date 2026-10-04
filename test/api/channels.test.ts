import { describe, it, expect, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../pages/api/channels';

describe('/api/channels', () => {
  it('returns 405 for non-GET requests', async () => {
    const req = { method: 'POST' } as unknown as NextApiRequest;
    const res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      end: vi.fn(),
      json: vi.fn(),
    } as unknown as NextApiResponse;

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.setHeader).toHaveBeenCalledWith('Allow', ['GET']);
  });

  it('returns 200 and empty object or cached data when no API key is provided', async () => {
    const originalEnv = process.env.HOLODEX_APIKEY;
    delete process.env.HOLODEX_APIKEY;

    const req = { method: 'GET' } as unknown as NextApiRequest;
    let jsonResult: any = null;
    const res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn((data) => {
        jsonResult = data;
      }),
    } as unknown as NextApiResponse;

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(jsonResult).toBeTypeOf('object');

    process.env.HOLODEX_APIKEY = originalEnv;
  });
});
