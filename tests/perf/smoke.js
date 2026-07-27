import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const API = __ENV.API_URL ?? 'http://localhost:4000/api/v1';

export default function () {
  const res = http.get(`${API}/health`);
  check(res, {
    'health status 200': (r) => r.status === 200,
    'health body ok': (r) => r.json('status') === 'ok',
  });
  sleep(1);
}
