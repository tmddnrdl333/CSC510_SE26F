# Third-Party Libraries

Direct dependencies of the three packages in this repo (root, server,
client), with each library's license as declared in its own
`package.json`. Transitive dependencies inherit from these and are
resolvable via the lockfiles.

| Package | Where | Kind | Version range | License |
|---|---|---|---|---|
| `@tanstack/react-query` | root (tooling/tests) | runtime | `^5.90.6` | MIT |
| `react` | root (tooling/tests) | runtime | `^19.2.0` | MIT |
| `react-dom` | root (tooling/tests) | runtime | `^19.2.0` | MIT |
| `@types/react` | root (tooling/tests) | dev | `^19.2.2` | MIT |
| `@types/react-dom` | root (tooling/tests) | dev | `^19.2.2` | MIT |
| `concurrently` | root (tooling/tests) | dev | `^8.2.2` | MIT |
| `eslint` | root (tooling/tests) | dev | `^8.57.0` | MIT |
| `express` | root (tooling/tests) | dev | `^5.2.1` | MIT |
| `jest` | root (tooling/tests) | dev | `^29.7.0` | MIT |
| `supertest` | root (tooling/tests) | dev | `^7.2.2` | MIT |
| `axios` | server | runtime | `^1.6.7` | MIT |
| `bcryptjs` | server | runtime | `^2.4.3` | MIT |
| `cors` | server | runtime | `^2.8.5` | MIT |
| `dotenv` | server | runtime | `^16.3.1` | BSD-2-Clause |
| `express` | server | runtime | `^4.18.2` | MIT |
| `express-validator` | server | runtime | `^7.0.1` | MIT |
| `firebase-admin` | server | runtime | `^11.11.0` | Apache-2.0 |
| `helmet` | server | runtime | `^7.1.0` | MIT |
| `jsonwebtoken` | server | runtime | `^9.0.3` | MIT |
| `morgan` | server | runtime | `^1.10.0` | MIT |
| `jest` | server | dev | `^29.7.0` | MIT |
| `nodemon` | server | dev | `^3.0.1` | MIT |
| `supertest` | server | dev | `^6.3.3` | MIT |
| `@react-google-maps/api` | client | runtime | `^2.20.7` | MIT |
| `@tanstack/react-query` | client | runtime | `^5.90.5` | MIT |
| `@testing-library/dom` | client | runtime | `^10.4.1` | MIT |
| `@testing-library/jest-dom` | client | runtime | `^6.9.1` | MIT |
| `@testing-library/react` | client | runtime | `^16.3.0` | MIT |
| `@testing-library/user-event` | client | runtime | `^13.5.0` | MIT |
| `@types/jest` | client | runtime | `^27.5.2` | MIT |
| `@types/node` | client | runtime | `^16.18.126` | MIT |
| `@types/react` | client | runtime | `^19.2.2` | MIT |
| `@types/react-dom` | client | runtime | `^19.2.2` | MIT |
| `@types/react-router-dom` | client | runtime | `^5.3.3` | MIT |
| `axios` | client | runtime | `^1.12.2` | MIT |
| `react` | client | runtime | `^19.2.0` | MIT |
| `react-dom` | client | runtime | `^19.2.0` | MIT |
| `react-router-dom` | client | runtime | `^7.9.4` | MIT |
| `react-scripts` | client | runtime | `5.0.1` | MIT |
| `recharts` | client | runtime | `^3.5.1` | MIT |
| `typescript` | client | runtime | `^4.9.5` | Apache-2.0 |
| `web-vitals` | client | runtime | `^2.1.4` | Apache-2.0 |

All runtime licenses are MIT/Apache-2.0/BSD-class permissive licenses;
no copyleft obligation affects this repo's fork-and-extend model
(itself MIT, see `docs/LICENSE.md`).
